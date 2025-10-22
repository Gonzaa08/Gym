<?php
/**
 * API para gestión de clases y turnos
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
 * GET - Obtener clases
 */
function handleGet($db) {
    // Obtener todas las clases (para reservas de socios)
    if (isset($_GET['action']) && $_GET['action'] === 'all') {
        $stmt = $db->query("
            SELECT * FROM clases 
            WHERE activa = 1 
            ORDER BY 
                FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
                hora
        ");
        $clases = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $clases]);
    }
    
    // Obtener clases gym (para instructores)
    else if (isset($_GET['action']) && $_GET['action'] === 'gym') {
        $stmt = $db->query("
            SELECT cg.*, i.nombre as instructor_nombre
            FROM clases_gym cg
            LEFT JOIN instructores i ON cg.instructor_id = i.id
            WHERE cg.activa = 1
            ORDER BY cg.id
        ");
        $clases = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $clases]);
    }
    
    // Obtener clases de un instructor
    else if (isset($_GET['instructor_id'])) {
        $instructor_id = intval($_GET['instructor_id']);
        $stmt = $db->prepare("
            SELECT * FROM clases_gym 
            WHERE instructor_id = ? AND activa = 1
        ");
        $stmt->execute([$instructor_id]);
        $clases = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $clases]);
    }
    
    // Obtener turnos de un socio
    else if (isset($_GET['action']) && $_GET['action'] === 'mis_turnos') {
        $socio_id = intval($_GET['socio_id'] ?? 0);
        
        $stmt = $db->prepare("
            SELECT t.*, c.nombre, c.dia, c.hora, c.instructor, c.duracion
            FROM turnos t
            INNER JOIN clases c ON t.clase_id = c.id
            WHERE t.socio_id = ? AND t.estado = 'Confirmado'
            ORDER BY t.fecha DESC
        ");
        $stmt->execute([$socio_id]);
        $turnos = $stmt->fetchAll();
        
        jsonResponse(['success' => true, 'data' => $turnos]);
    }
    
    else {
        jsonResponse(['success' => false, 'message' => 'Acción no especificada'], 400);
    }
}

/**
 * POST - Crear clase o reservar turno
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Reservar turno
    if (isset($input['action']) && $input['action'] === 'reservar') {
        $socio_id = intval($input['socio_id'] ?? 0);
        $clase_id = intval($input['clase_id'] ?? 0);
        $fecha = sanitize($input['fecha'] ?? '');
        
        if ($socio_id <= 0 || $clase_id <= 0 || empty($fecha)) {
            jsonResponse(['success' => false, 'message' => 'Datos incompletos'], 400);
        }
        
        // Verificar que la clase existe y tiene cupos
        $stmt = $db->prepare("
            SELECT cupos_total, cupos_ocupados, nombre 
            FROM clases 
            WHERE id = ? AND activa = 1
        ");
        $stmt->execute([$clase_id]);
        $clase = $stmt->fetch();
        
        if (!$clase) {
            jsonResponse(['success' => false, 'message' => 'Clase no encontrada'], 404);
        }
        
        if ($clase['cupos_ocupados'] >= $clase['cupos_total']) {
            jsonResponse(['success' => false, 'message' => 'No hay cupos disponibles'], 409);
        }
        
        // Verificar que no tenga ya una reserva para esta clase
        $stmt = $db->prepare("
            SELECT id FROM turnos 
            WHERE socio_id = ? AND clase_id = ? AND estado = 'Confirmado'
        ");
        $stmt->execute([$socio_id, $clase_id]);
        
        if ($stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => 'Ya tienes una reserva para esta clase'], 409);
        }
        
        // Iniciar transacción
        $db->beginTransaction();
        
        try {
            // Crear turno
            $stmt = $db->prepare("
                INSERT INTO turnos (socio_id, clase_id, fecha, estado) 
                VALUES (?, ?, ?, 'Confirmado')
            ");
            $stmt->execute([$socio_id, $clase_id, $fecha]);
            $turno_id = $db->lastInsertId();
            
            // Incrementar cupos ocupados
            $stmt = $db->prepare("
                UPDATE clases 
                SET cupos_ocupados = cupos_ocupados + 1 
                WHERE id = ?
            ");
            $stmt->execute([$clase_id]);
            
            $db->commit();
            
            jsonResponse([
                'success' => true,
                'message' => "Turno reservado exitosamente para {$clase['nombre']}",
                'data' => ['id' => $turno_id]
            ], 201);
            
        } catch (Exception $e) {
            $db->rollBack();
            throw $e;
        }
    }
    
    // Crear clase gym
    else if (isset($input['action']) && $input['action'] === 'crear_gym') {
        $nombre = sanitize($input['nombre'] ?? '');
        $tipo = sanitize($input['tipo'] ?? '');
        $horario = sanitize($input['horario'] ?? '');
        $duracion = sanitize($input['duracion'] ?? '');
        $cupo_maximo = intval($input['cupo_maximo'] ?? 0);
        
        if (empty($nombre) || empty($tipo) || $cupo_maximo <= 0) {
            jsonResponse(['success' => false, 'message' => 'Datos incompletos'], 400);
        }
        
        $stmt = $db->prepare("
            INSERT INTO clases_gym (nombre, tipo, horario, duracion, cupo_maximo) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        if ($stmt->execute([$nombre, $tipo, $horario, $duracion, $cupo_maximo])) {
            jsonResponse([
                'success' => true,
                'message' => 'Clase creada exitosamente',
                'data' => ['id' => $db->lastInsertId()]
            ], 201);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al crear clase'], 500);
        }
    }
    
    else {
        jsonResponse(['success' => false, 'message' => 'Acción no especificada'], 400);
    }
}

/**
 * PUT - Actualizar clase o asignar instructor
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Asignar instructor a clase
    if (isset($input['action']) && $input['action'] === 'asignar_instructor') {
        $clase_id = intval($input['clase_id'] ?? 0);
        $instructor_id = isset($input['instructor_id']) && $input['instructor_id'] !== '' 
            ? intval($input['instructor_id']) 
            : null;
        
        if ($clase_id <= 0) {
            jsonResponse(['success' => false, 'message' => 'ID de clase inválido'], 400);
        }
        
        $stmt = $db->prepare("
            UPDATE clases_gym 
            SET instructor_id = ? 
            WHERE id = ?
        ");
        
        if ($stmt->execute([$instructor_id, $clase_id])) {
            jsonResponse(['success' => true, 'message' => 'Instructor asignado exitosamente']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Error al asignar instructor'], 500);
        }
    }
    
    else {
        jsonResponse(['success' => false, 'message' => 'Acción no especificada'], 400);
    }
}

/**
 * DELETE - Cancelar turno
 */
function handleDelete($db) {
    $turno_id = intval($_GET['id'] ?? 0);
    
    if ($turno_id <= 0) {
        jsonResponse(['success' => false, 'message' => 'ID inválido'], 400);
    }
    
    // Obtener información del turno
    $stmt = $db->prepare("
        SELECT clase_id, estado 
        FROM turnos 
        WHERE id = ?
    ");
    $stmt->execute([$turno_id]);
    $turno = $stmt->fetch();
    
    if (!$turno) {
        jsonResponse(['success' => false, 'message' => 'Turno no encontrado'], 404);
    }
    
    if ($turno['estado'] !== 'Confirmado') {
        jsonResponse(['success' => false, 'message' => 'El turno ya fue cancelado'], 400);
    }
    
    // Iniciar transacción
    $db->beginTransaction();
    
    try {
        // Actualizar estado del turno
        $stmt = $db->prepare("
            UPDATE turnos 
            SET estado = 'Cancelado', fecha_cancelacion = NOW() 
            WHERE id = ?
        ");
        $stmt->execute([$turno_id]);
        
        // Decrementar cupos ocupados
        $stmt = $db->prepare("
            UPDATE clases 
            SET cupos_ocupados = cupos_ocupados - 1 
            WHERE id = ? AND cupos_ocupados > 0
        ");
        $stmt->execute([$turno['clase_id']]);
        
        $db->commit();
        
        jsonResponse(['success' => true, 'message' => 'Turno cancelado exitosamente']);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}
?>