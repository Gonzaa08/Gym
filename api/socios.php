<?php
/**
 * API para gestión de socios
 * The Best Gym - Sistema de Gestión
 */

require_once '../db_connection.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

try {
    switch($method) {
        case 'GET':
            handleGet($db);
            break;
        case 'POST':
            handlePost($db);
            break;
        case 'PUT':
            handlePut($db);
            break;
        case 'DELETE':
            handleDelete($db);
            break;
        default:
            jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
    }
} catch(Exception $e) {
    handleDbError($e);
}

/**
 * GET - Obtener socios
 */
function handleGet($db) {
    // Obtener todos los socios
    if (isset($_GET['action']) && $_GET['action'] === 'all') {
        $stmt = $db->query("
            SELECT id, nombre, dni, email, telefono, plan, estado, 
                   vencimiento, fecha_alta, fecha_nacimiento, genero
            FROM socios 
            ORDER BY nombre
        ");
        $socios = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $socios]);
    }
    
    // Buscar socio por DNI
    else if (isset($_GET['dni'])) {
        $dni = sanitize($_GET['dni']);
        $stmt = $db->prepare("
            SELECT * FROM socios WHERE dni = ?
        ");
        $stmt->execute([$dni]);
        $socio = $stmt->fetch();
        
        if ($socio) {
            jsonResponse(['success' => true, 'data' => $socio]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Socio no encontrado'], 404);
        }
    }
    
    // Obtener socio por ID
    else if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $db->prepare("SELECT * FROM socios WHERE id = ?");
        $stmt->execute([$id]);
        $socio = $stmt->fetch();
        
        if ($socio) {
            jsonResponse(['success' => true, 'data' => $socio]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Socio no encontrado'], 404);
        }
    }
    
    // Obtener socios morosos
    else if (isset($_GET['action']) && $_GET['action'] === 'morosos') {
        $stmt = $db->query("
            SELECT * FROM socios 
            WHERE estado = 'Moroso' 
            ORDER BY vencimiento
        ");
        $morosos = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $morosos]);
    }
    
    // Obtener socios activos
    else if (isset($_GET['action']) && $_GET['action'] === 'activos') {
        $stmt = $db->query("
            SELECT * FROM socios 
            WHERE estado = 'Activo' 
            ORDER BY nombre
        ");
        $activos = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $activos]);
    }
    
    // Estadísticas
    else if (isset($_GET['action']) && $_GET['action'] === 'stats') {
        $stats = [];
        
        // Total activos
        $stmt = $db->query("SELECT COUNT(*) as total FROM socios WHERE estado = 'Activo'");
        $stats['activos'] = $stmt->fetch()['total'];
        
        // Total morosos
        $stmt = $db->query("SELECT COUNT(*) as total FROM socios WHERE estado = 'Moroso'");
        $stats['morosos'] = $stmt->fetch()['total'];
        
        // Total socios
        $stmt = $db->query("SELECT COUNT(*) as total FROM socios");
        $stats['total'] = $stmt->fetch()['total'];
        
        jsonResponse(['success' => true, 'data' => $stats]);
    }
    
    else {
        jsonResponse(['success' => false, 'message' => 'Acción no especificada'], 400);
    }
}

/**
 * POST - Crear nuevo socio
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $nombre = sanitize($input['nombre'] ?? '');
    $dni = sanitize($input['dni'] ?? '');
    $email = sanitize($input['email'] ?? '');
    $telefono = sanitize($input['telefono'] ?? '');
    $plan = sanitize($input['plan'] ?? '');
    $fecha_alta = date('Y-m-d');
    
    if (empty($nombre) || empty($dni) || empty($email) || empty($plan)) {
        jsonResponse(['success' => false, 'message' => 'Datos incompletos'], 400);
    }
    
    // Verificar si el DNI ya existe
    $stmt = $db->prepare("SELECT id FROM socios WHERE dni = ?");
    $stmt->execute([$dni]);
    if ($stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'El DNI ya está registrado'], 409);
    }
    
    // Obtener duración del plan
    $stmt = $db->prepare("SELECT duracion FROM planes WHERE nombre = ?");
    $stmt->execute([$plan]);
    $planData = $stmt->fetch();
    
    if (!$planData) {
        jsonResponse(['success' => false, 'message' => 'Plan no encontrado'], 404);
    }
    
    // Calcular fecha de vencimiento
    $vencimiento = date('Y-m-d', strtotime("+{$planData['duracion']} days"));
    
    $stmt = $db->prepare("
        INSERT INTO socios (nombre, dni, email, telefono, plan, estado, vencimiento, fecha_alta) 
        VALUES (?, ?, ?, ?, ?, 'Activo', ?, ?)
    ");
    
    if ($stmt->execute([$nombre, $dni, $email, $telefono, $plan, $vencimiento, $fecha_alta])) {
        jsonResponse([
            'success' => true,
            'message' => 'Socio creado exitosamente',
            'data' => ['id' => $db->lastInsertId()]
        ], 201);
    } else {
        jsonResponse(['success' => false, 'message' => 'Error al crear socio'], 500);
    }
}

/**
 * PUT - Actualizar socio
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = intval($input['id'] ?? 0);
    $nombre = sanitize($input['nombre'] ?? '');
    $email = sanitize($input['email'] ?? '');
    $telefono = sanitize($input['telefono'] ?? '');
    $plan = sanitize($input['plan'] ?? '');
    
    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido'], 400);
    }
    
    // Actualizar perfil completo si se proporcionan datos adicionales
    if (isset($input['fecha_nacimiento']) || isset($input['genero'])) {
        $fecha_nacimiento = $input['fecha_nacimiento'] ?? null;
        $genero = $input['genero'] ?? null;
        $emergencia_nombre = sanitize($input['emergencia_nombre'] ?? '');
        $emergencia_relacion = sanitize($input['emergencia_relacion'] ?? '');
        $emergencia_telefono = sanitize($input['emergencia_telefono'] ?? '');
        $grupo_sanguineo = sanitize($input['grupo_sanguineo'] ?? '');
        $alergias = sanitize($input['alergias'] ?? '');
        $lesiones = sanitize($input['lesiones'] ?? '');
        
        $stmt = $db->prepare("
            UPDATE socios SET 
                nombre = ?, email = ?, telefono = ?, plan = ?,
                fecha_nacimiento = ?, genero = ?,
                emergencia_nombre = ?, emergencia_relacion = ?, emergencia_telefono = ?,
                grupo_sanguineo = ?, alergias = ?, lesiones = ?
            WHERE id = ?
        ");
        
        $result = $stmt->execute([
            $nombre, $email, $telefono, $plan,
            $fecha_nacimiento, $genero,
            $emergencia_nombre, $emergencia_relacion, $emergencia_telefono,
            $grupo_sanguineo, $alergias, $lesiones,
            $id
        ]);
    } else {
        // Actualización básica
        $stmt = $db->prepare("
            UPDATE socios SET nombre = ?, email = ?, telefono = ?, plan = ?
            WHERE id = ?
        ");
        $result = $stmt->execute([$nombre, $email, $telefono, $plan, $id]);
    }
    
    if ($result) {
        jsonResponse(['success' => true, 'message' => 'Socio actualizado exitosamente']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Error al actualizar socio'], 500);
    }
}

/**
 * DELETE - Eliminar socio
 */
function handleDelete($db) {
    $id = intval($_GET['id'] ?? 0);
    
    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido'], 400);
    }
    
    // Eliminar el socio (esto eliminará automáticamente sus asistencias y pagos por CASCADE)
    $stmt = $db->prepare("DELETE FROM socios WHERE id = ?");
    
    if ($stmt->execute([$id])) {
        jsonResponse(['success' => true, 'message' => 'Socio eliminado exitosamente']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Error al eliminar socio'], 500);
    }
}
?>