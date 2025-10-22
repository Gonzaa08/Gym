-- ============================================
-- DATOS INICIALES: THE BEST GYM
-- ============================================

USE thebestgym;

-- ============================================
-- INSERTAR PLANES
-- ============================================
INSERT INTO planes (id, nombre, duracion, costo, descripcion) VALUES
(1, 'Mensual', 30, 15000.00, 'Acceso completo por 1 mes'),
(2, 'Trimestral', 90, 40000.00, 'Acceso completo por 3 meses'),
(3, 'Anual', 365, 150000.00, 'Acceso completo por 1 año');

-- ============================================
-- INSERTAR SOCIOS
-- ============================================
INSERT INTO socios (id, nombre, dni, email, telefono, plan, estado, vencimiento, fecha_alta, fecha_nacimiento, genero, emergencia_nombre, emergencia_relacion, emergencia_telefono, grupo_sanguineo, alergias, lesiones) VALUES
(1, 'Juan Pérez', '12345678', 'juan@email.com', '261-1234567', 'Mensual', 'Activo', '2025-10-20', '2025-01-15', '1990-05-15', 'Masculino', 'María Pérez', 'Madre', '261-9999999', 'O+', 'Ninguna', 'Lesión de rodilla en 2023'),
(2, 'María García', '87654321', 'maria@email.com', '261-7654321', 'Trimestral', 'Moroso', '2025-10-05', '2025-02-10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'Carlos López', '11223344', 'carlos@email.com', '261-1122334', 'Anual', 'Activo', '2025-12-15', '2024-12-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'Laura Fernández', '22334455', 'laura@email.com', '261-2233445', 'Mensual', 'Activo', '2025-11-01', '2025-03-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ============================================
-- INSERTAR USUARIOS
-- ============================================
INSERT INTO usuarios (id, username, password, nombre, rol, socio_id, instructor_id) VALUES
(1, 'admin', 'admin123', 'Administrador', 'Administrador', NULL, NULL),
(2, 'recep', 'recep123', 'Ana Martínez', 'Recepcionista', NULL, NULL),
(3, 'socio1', 'socio123', 'Juan Pérez', 'Socio', 1, NULL),
(4, 'instructor1', 'inst123', 'Carlos Fitness', 'Instructor', NULL, NULL),
(5, 'instructor2', 'inst123', 'Laura Trainer', 'Instructor', NULL, NULL),
(6, 'instructor3', 'inst123', 'Miguel Strong', 'Instructor', NULL, NULL);

-- ============================================
-- INSERTAR INSTRUCTORES
-- ============================================
INSERT INTO instructores (id, usuario_id, nombre, especialidad, email, telefono, activo) VALUES
(1, 4, 'Carlos Fitness', 'Musculación', 'carlos@thebestgym.com', '261-1111111', TRUE),
(2, 5, 'Laura Trainer', 'Funcional', 'laura@thebestgym.com', '261-2222222', TRUE),
(3, 6, 'Miguel Strong', 'CrossFit', 'miguel@thebestgym.com', '261-3333333', TRUE);

-- ============================================
-- INSERTAR CLASES_GYM (clases del gimnasio para instructores)
-- ============================================
INSERT INTO clases_gym (id, nombre, tipo, horario, duracion, cupo_maximo, instructor_id, activa) VALUES
(1, 'Spinning Mañana', 'Cardio', 'Lunes y Miércoles 09:00', '45 min', 20, NULL, TRUE),
(2, 'Funcional Tarde', 'Funcional', 'Martes y Jueves 18:00', '60 min', 15, 2, TRUE),
(3, 'CrossFit Noche', 'CrossFit', 'Lunes, Miércoles y Viernes 20:00', '60 min', 12, 3, TRUE),
(4, 'Yoga Mañana', 'Relajación', 'Martes y Jueves 10:00', '50 min', 25, NULL, TRUE),
(5, 'Musculación Personalizada', 'Musculación', 'Lunes a Viernes 14:00', '90 min', 10, 1, TRUE);

-- ============================================
-- INSERTAR CLASES (para reservas de socios)
-- ============================================
INSERT INTO clases (id, nombre, dia, hora, instructor, duracion, cupos_total, cupos_ocupados, activa) VALUES
(1, 'Spinning', 'Lunes', '08:00:00', 'Carlos Ruiz', 60, 20, 15, TRUE),
(2, 'Yoga', 'Lunes', '10:00:00', 'Ana López', 60, 15, 10, TRUE),
(3, 'Crossfit', 'Martes', '18:00:00', 'Miguel Ángel', 60, 12, 12, TRUE),
(4, 'Funcional', 'Miércoles', '07:00:00', 'Laura Torres', 45, 15, 8, TRUE),
(5, 'Zumba', 'Jueves', '19:00:00', 'Sofia Morales', 60, 25, 20, TRUE),
(6, 'Spinning', 'Viernes', '08:00:00', 'Carlos Ruiz', 60, 20, 5, TRUE);

-- ============================================
-- INSERTAR ASISTENCIAS
-- ============================================
INSERT INTO asistencias (id, socio_id, fecha, hora) VALUES
(1, 1, '2025-10-14', '08:30:00'),
(2, 3, '2025-10-14', '09:15:00'),
(3, 1, '2025-10-13', '18:45:00'),
(4, 4, '2025-10-14', '07:00:00'),
(5, 3, '2025-10-13', '19:30:00'),
(6, 1, '2025-10-12', '08:15:00'),
(7, 1, '2025-10-11', '18:00:00'),
(8, 1, '2025-10-10', '08:30:00');

-- ============================================
-- INSERTAR PAGOS
-- ============================================
INSERT INTO pagos (id, socio_id, monto, fecha, metodo_pago, concepto) VALUES
(1, 1, 15000.00, '2025-09-20', 'Efectivo', 'Cuota Mensual'),
(2, 3, 150000.00, '2024-12-15', 'Transferencia', 'Plan Anual'),
(3, 4, 15000.00, '2025-10-01', 'Tarjeta', 'Cuota Mensual');

-- ============================================
-- INSERTAR TURNOS
-- ============================================
INSERT INTO turnos (id, socio_id, clase_id, fecha, estado) VALUES
(1, 1, 1, '2025-10-21', 'Confirmado'),
(2, 1, 4, '2025-10-23', 'Confirmado');

-- ============================================
-- INSERTAR CONFIGURACIÓN INICIAL (opcional)
-- ============================================
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('nombre_gimnasio', 'The Best Gym', 'Nombre del gimnasio'),
('email_contacto', 'contacto@thebestgym.com', 'Email de contacto'),
('telefono_contacto', '261-5555555', 'Teléfono de contacto'),
('direccion', 'Av. San Martín 1234, Mendoza', 'Dirección del gimnasio'),
('horario_apertura', '06:00', 'Hora de apertura'),
('horario_cierre', '23:00', 'Hora de cierre');