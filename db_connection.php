<?php
/**
 * Archivo de conexión a la base de datos
 * The Best Gym - Sistema de Gestión
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'thebestgym');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Clase de conexión usando PDO (Singleton)
class Database {
    private static $instance = null;
    private $conn;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            jsonResponse([
                'success' => false,
                'message' => 'Error de conexión con la base de datos'
            ], 500);
            exit;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    private function __clone() {}

    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// Función helper para obtener la conexión fácilmente
function getDB() {
    return Database::getInstance()->getConnection();
}

// Función para sanitizar inputs
function sanitize($data) {
    if (is_null($data)) return null;
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Función para responder con JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Función para manejar errores de base de datos
function handleDbError($e) {
    error_log("Database Error: " . $e->getMessage());
    
    // En producción, no mostrar detalles del error
    $message = 'Error en la base de datos';
    $error = null;
    
    // Solo en desarrollo mostrar detalles
    if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
        $error = $e->getMessage();
    }
    
    jsonResponse([
        'success' => false,
        'message' => $message,
        'error' => $error
    ], 500);
}

// Configuración de zona horaria
date_default_timezone_set('America/Argentina/Mendoza');

// Configuración de errores (cambiar en producción)
define('ENVIRONMENT', 'development'); // Cambiar a 'production' en producción

if (ENVIRONMENT === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// Configuración de sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_secure' => false, // Cambiar a true en HTTPS
        'cookie_samesite' => 'Lax'
    ]);
}

// Función para verificar autenticación
function checkAuth() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse([
            'success' => false,
            'message' => 'No autenticado'
        ], 401);
    }
}

// Función para verificar rol
function checkRole($allowedRoles) {
    checkAuth();
    
    if (!in_array($_SESSION['rol'], $allowedRoles)) {
        jsonResponse([
            'success' => false,
            'message' => 'No tienes permisos para esta acción'
        ], 403);
    }
}

// Función para obtener usuario actual
function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}
?>