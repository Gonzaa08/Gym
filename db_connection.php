<?php
/**
 * Archivo de conexión a la base de datos
 * The Best Gym - Sistema de Gestión
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'thebestgym');
define('DB_USER', 'root');  // Usuario por defecto de XAMPP
define('DB_PASS', '');       // Contraseña vacía por defecto en XAMPP
define('DB_CHARSET', 'utf8mb4');

// Clase de conexión usando PDO
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
            die("Error de conexión: " . $e->getMessage());
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

    // Prevenir clonación del objeto
    private function __clone() {}

    // Prevenir deserialización del objeto
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
    jsonResponse([
        'success' => false,
        'message' => 'Error en la base de datos',
        'error' => $e->getMessage()
    ], 500);
}

// Configuración de zona horaria
date_default_timezone_set('America/Argentina/Mendoza');

// Habilitar reporte de errores en desarrollo (desactivar en producción)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>