// CONFIGURACIÓN DE API
const API_URL = 'api/';

// Helper para hacer peticiones fetch
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(API_URL + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en la petición:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// VARIABLES GLOBALES
let cache = {
    socios: null,
    planes: null,
    instructores: null,
    clases: null,
    clasesGym: null,
    lastUpdate: null
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatCurrency(amount) {
    return "$" + parseFloat(amount).toLocaleString("es-AR");
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-AR");
}

function getCurrentDate() {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("es-AR", options);
}

function getTodayString() {
    return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(" ")[0].substring(0, 5);
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "flex";
}
function generateMenu() {
    const nav = document.getElementById("sidebarNav");
    nav.innerHTML = "";

    const menuItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "fa-chart-line",
            roles: ["Administrador", "Recepcionista"],
        },
        {
            id: "usuarios",
            label: "Usuarios",
            icon: "fa-users-cog",
            roles: ["Administrador"],
        },
        {
            id: "socios",
            label: "Socios",
            icon: "fa-users",
            roles: ["Administrador", "Recepcionista"],
        },
        {
            id: "asistencias",
            label: "Asistencias",
            icon: "fa-calendar-check",
            roles: ["Recepcionista"],
        },
        {
            id: "pagos",
            label: "Pagos",
            icon: "fa-dollar-sign",
            roles: ["Administrador", "Recepcionista"],
        },
        {
            id: "turnos",
            label: "Gestión de Turnos",
            icon: "fa-calendar-alt",
            roles: ["Recepcionista"],
        },
        {
            id: "clasesInstructores",
            label: "Clases",
            icon: "fa-chalkboard-teacher",
            roles: ["Administrador"],
        },
        {
            id: "planes",
            label: "Planes",
            icon: "fa-file-alt",
            roles: ["Administrador", "Recepcionista"],
        },
        {
            id: "reportes",
            label: "Reportes",
            icon: "fa-chart-bar",
            roles: ["Administrador"],
        },
        {
            id: "perfil",
            label: "Mi Perfil",
            icon: "fa-user-circle",
            roles: ["Socio"],
        },
        {
            id: "miPlan",
            label: "Mi Plan",
            icon: "fa-id-card",
            roles: ["Socio"],
        },
        {
            id: "turnos",
            label: "Mis Turnos",
            icon: "fa-calendar-alt",
            roles: ["Socio"],
        },
    ];

    if (!currentUser) return;

    menuItems
        .filter((item) => item.roles.includes(currentUser.rol))
        .forEach((item) => {
            const button = document.createElement("button");
            button.className = "nav-item";
            button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
            button.addEventListener("click", (e) => showModule(item.id, e));
            nav.appendChild(button);
        });
}
// ============================================
// DATOS INICIALES

let currentUser = null;
let activeModule = "dashboard";
// ============================================
// SISTEMA COMPLETO DE PERMISOS
// Agregar este código en script.js después de la línea 6 (después de let activeModule)
// ============================================

// Permisos base por rol (plantillas por defecto)
const permisosPorRol = {
    Administrador: {
        socios: { ver: true, crear: true, editar: true, eliminar: true },
        usuarios: { ver: true, crear: true, editar: true, eliminar: true },
        pagos: { ver: true, crear: true, editar: true, eliminar: true },
        asistencias: { ver: true, registrar: true },
        planes: { ver: true, crear: true, editar: true, eliminar: true },
        clases: { ver: true, crear: true, editar: true, eliminar: true, asignarInstructor: true },
        reportes: { ver: true, exportar: true }
    },
    Recepcionista: {
        socios: { ver: true, crear: true, editar: true, eliminar: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false },
        pagos: { ver: true, crear: true, editar: false, eliminar: false },
        asistencias: { ver: true, registrar: true },
        planes: { ver: true, crear: false, editar: false, eliminar: false },
        clases: { ver: true, crear: false, editar: false, eliminar: false, asignarInstructor: false },
        reportes: { ver: true, exportar: false }
    },
    Instructor: {
        socios: { ver: false, crear: false, editar: false, eliminar: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false },
        pagos: { ver: false, crear: false, editar: false, eliminar: false },
        asistencias: { ver: false, registrar: false },
        planes: { ver: false, crear: false, editar: false, eliminar: false },
        clases: { ver: true, crear: false, editar: false, eliminar: false, asignarInstructor: false },
        reportes: { ver: false, exportar: false }
    },
    Socio: {
        socios: { ver: false, crear: false, editar: false, eliminar: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false },
        pagos: { ver: false, crear: false, editar: false, eliminar: false },
        asistencias: { ver: false, registrar: false },
        planes: { ver: true, crear: false, editar: false, eliminar: false },
        clases: { ver: true, crear: false, editar: false, eliminar: false, asignarInstructor: false },
        reportes: { ver: false, exportar: false }
    }
};
// ============================================
// FUNCIONES PRINCIPALES DE PERMISOS
// ============================================
function obtenerPermisosUsuario(usuarioId) {
    const usuario = database.usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return null;

    // Clonar permisos base del rol
    const permisosBase = JSON.parse(
        JSON.stringify(permisosPorRol[usuario.rol] || {}),
    );

    // Aplicar permisos personalizados si existen
    const personalizados = database.permisosPersonalizados.filter(
        (p) => p.usuarioId === usuarioId,
    );

    personalizados.forEach((perm) => {
        if (permisosBase[perm.modulo]) {
            permisosBase[perm.modulo][perm.accion] = perm.permitido;
        }
    });

    return permisosBase;
}

/**
 * Verifica si el usuario actual tiene un permiso específico
 */
function tienePermiso(modulo, accion) {
    if (!currentUser || !currentUser.rol) return false;
    const permisos = permisosPorRol[currentUser.rol];
    if (!permisos || !permisos[modulo]) return false;
    return permisos[modulo][accion] === true;
}

/**
 * Guarda permisos personalizados para un usuario
 */
function guardarPermisosPersonalizados(usuarioId, modulo, accion, permitido) {
    // Buscar si ya existe el permiso personalizado
    const index = database.permisosPersonalizados.findIndex(
        (p) =>
            p.usuarioId === usuarioId &&
            p.modulo === modulo &&
            p.accion === accion,
    );

    const permiso = {
        id:
            index >= 0
                ? database.permisosPersonalizados[index].id
                : database.permisosPersonalizados.length + 1,
        usuarioId: usuarioId,
        modulo: modulo,
        accion: accion,
        permitido: permitido,
        fechaModificacion: new Date().toISOString(),
        modificadoPor: currentUser.id,
    };

    if (index >= 0) {
        database.permisosPersonalizados[index] = permiso;
    } else {
        database.permisosPersonalizados.push(permiso);
    }

    // Guardar en historial
    database.historialPermisos.push({
        id: database.historialPermisos.length + 1,
        usuarioId: usuarioId,
        modulo: modulo,
        accion: accion,
        valorAnterior:
            index >= 0
                ? database.permisosPersonalizados[index].permitido
                : null,
        valorNuevo: permitido,
        fecha: new Date().toISOString(),
        modificadoPor: currentUser.id,
    });
}

/**
 * Restablece permisos de un usuario a los valores por defecto de su rol
 */
function restablecerPermisosPorDefecto(usuarioId) {
    if (
        !confirm(
            "¿Está seguro de restablecer todos los permisos personalizados?\n\nSe aplicarán los permisos por defecto del rol del usuario.",
        )
    ) {
        return;
    }

    // Eliminar todos los permisos personalizados del usuario
    database.permisosPersonalizados = database.permisosPersonalizados.filter(
        (p) => p.usuarioId !== usuarioId,
    );

    // Registrar en historial
    database.historialPermisos.push({
        id: database.historialPermisos.length + 1,
        usuarioId: usuarioId,
        modulo: "todos",
        accion: "restablecer",
        valorAnterior: "personalizado",
        valorNuevo: "por defecto",
        fecha: new Date().toISOString(),
        modificadoPor: currentUser.id,
    });

    alert("Permisos restablecidos correctamente");
}

/**
 * Copia permisos de un usuario a otro
 */
function copiarPermisos(usuarioOrigenId, usuarioDestinoId) {
    const permisosOrigen = database.permisosPersonalizados.filter(
        (p) => p.usuarioId === usuarioOrigenId,
    );

    if (permisosOrigen.length === 0) {
        alert("El usuario origen no tiene permisos personalizados");
        return;
    }

    if (
        !confirm(
            `¿Copiar ${permisosOrigen.length} permisos personalizados al usuario seleccionado?`,
        )
    ) {
        return;
    }

    // Eliminar permisos existentes del destino
    database.permisosPersonalizados = database.permisosPersonalizados.filter(
        (p) => p.usuarioId !== usuarioDestinoId,
    );

    // Copiar permisos
    permisosOrigen.forEach((perm) => {
        guardarPermisosPersonalizados(
            usuarioDestinoId,
            perm.modulo,
            perm.accion,
            perm.permitido,
        );
    });

    alert("Permisos copiados correctamente");
}

/**
 * Muestra un mensaje de error cuando no hay permisos
 */
function mostrarErrorPermisos() {
    alert(
        "⛔ Acceso Denegado\n\nNo tienes permisos para realizar esta acción.\nContacta al administrador si necesitas acceso.",
    );
}

// ============================================
// INTERFAZ DE GESTIÓN DE PERMISOS
// ============================================

/**
 * Abre el modal completo de gestión de permisos
 */
function gestionarPermisosUsuario(usuarioId) {
    const usuario = database.usuarios.find((u) => u.id === usuarioId);
    if (!usuario) return;

    const permisos = obtenerPermisosUsuario(usuarioId);
    const tienePersonalizados = database.permisosPersonalizados.some(
        (p) => p.usuarioId === usuarioId,
    );

    // Crear modal de gestión
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalGestionPermisos";
    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalPermisos()"></div>
        <div class="modal-content modal-permisos-full">
            <button class="modal-close" onclick="cerrarModalPermisos()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-permisos-full">
                <i class="fas fa-user-shield"></i>
                <div>
                    <h3>Gestión de Permisos</h3>
                    <p>${usuario.nombre} - ${usuario.rol}</p>
                </div>
            </div>

            <div class="modal-body-permisos-full">
                <div class="permisos-toolbar">
                    <button class="btn-permisos-action btn-restablecer" onclick="restablecerPermisosPorDefecto(${usuarioId}); cerrarModalPermisos(); updateUsuariosTable();">
                        <i class="fas fa-undo"></i> Restablecer por Defecto
                    </button>
                    <button class="btn-permisos-action btn-copiar" onclick="abrirModalCopiarPermisos(${usuarioId})">
                        <i class="fas fa-copy"></i> Copiar de otro Usuario
                    </button>
                    <button class="btn-permisos-action btn-historial" onclick="verHistorialPermisos(${usuarioId})">
                        <i class="fas fa-history"></i> Ver Historial
                    </button>
                </div>

                ${
                    tienePersonalizados
                        ? `
                    <div class="permisos-alerta">
                        <i class="fas fa-info-circle"></i>
                        <span>Este usuario tiene permisos personalizados activos</span>
                    </div>
                `
                        : ""
                }

                <div class="permisos-info-full">
                    <i class="fas fa-lightbulb"></i>
                    <span>Activa o desactiva permisos específicos. Los cambios se guardan automáticamente.</span>
                </div>

                <div class="permisos-grid-full">
                    ${Object.entries(permisos)
                        .map(
                            ([modulo, acciones]) => `
                        <div class="permiso-modulo-full">
                            <div class="permiso-modulo-header">
                                <i class="fas fa-folder"></i>
                                <h4>${capitalizarModulo(modulo)}</h4>
                            </div>
                            <div class="permiso-acciones-full">
                                ${Object.entries(acciones)
                                    .map(([accion, permitido]) => {
                                        const esPersonalizado =
                                            database.permisosPersonalizados.some(
                                                (p) =>
                                                    p.usuarioId === usuarioId &&
                                                    p.modulo === modulo &&
                                                    p.accion === accion,
                                            );
                                        return `
                                        <label class="permiso-checkbox ${esPersonalizado ? "personalizado" : ""}">
                                            <input 
                                                type="checkbox" 
                                                ${permitido ? "checked" : ""}
                                                onchange="togglePermiso(${usuarioId}, '${modulo}', '${accion}', this.checked)"
                                            />
                                            <span class="checkbox-custom"></span>
                                            <span class="permiso-label">
                                                ${capitalizarAccion(accion)}
                                                ${esPersonalizado ? '<i class="fas fa-star"></i>' : ""}
                                            </span>
                                        </label>
                                    `;
                                    })
                                    .join("")}
                            </div>
                        </div>
                    `,
                        )
                        .join("")}
                </div>
            </div>

            <div class="modal-footer-permisos-full">
                <button class="btn-secondary" onclick="cerrarModalPermisos()">
                    Cerrar
                </button>
                <button class="btn-primary" onclick="cerrarModalPermisos(); updateUsuariosTable();">
                    <i class="fas fa-check"></i> Aplicar Cambios
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Toggle individual de permisos
 */
function togglePermiso(usuarioId, modulo, accion, permitido) {
    guardarPermisosPersonalizados(usuarioId, modulo, accion, permitido);

    // Feedback visual
    const checkbox = event.target;
    const label = checkbox.closest(".permiso-checkbox");

    if (!label.classList.contains("personalizado")) {
        label.classList.add("personalizado");
        label.querySelector(".permiso-label").innerHTML +=
            ' <i class="fas fa-star"></i>';
    }

    // Mostrar notificación temporal
    mostrarNotificacionPermiso(
        permitido ? "Permiso activado" : "Permiso desactivado",
    );
}

/**
 * Muestra notificación temporal
 */
function mostrarNotificacionPermiso(mensaje) {
    const notif = document.createElement("div");
    notif.className = "notificacion-permiso";
    notif.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add("show");
    }, 10);

    setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

/**
 * Abre modal para copiar permisos
 */
function abrirModalCopiarPermisos(usuarioDestinoId) {
    const usuariosConPermisos = database.usuarios.filter((u) => {
        return (
            u.id !== usuarioDestinoId &&
            database.permisosPersonalizados.some((p) => p.usuarioId === u.id)
        );
    });

    if (usuariosConPermisos.length === 0) {
        alert("No hay otros usuarios con permisos personalizados para copiar");
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content modal-copiar-permisos">
            <button class="modal-close" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-copiar">
                <i class="fas fa-copy"></i>
                <h3>Copiar Permisos</h3>
            </div>

            <div class="modal-body-copiar">
                <p>Selecciona el usuario desde el cual copiar los permisos personalizados:</p>

                <div class="usuarios-lista-copiar">
                    ${usuariosConPermisos
                        .map((u) => {
                            const cantPermisos =
                                database.permisosPersonalizados.filter(
                                    (p) => p.usuarioId === u.id,
                                ).length;
                            return `
                            <div class="usuario-item-copiar" onclick="copiarPermisos(${u.id}, ${usuarioDestinoId}); this.closest('.modal').remove(); document.getElementById('modalGestionPermisos').remove(); updateUsuariosTable();">
                                <div class="usuario-avatar-copiar">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="usuario-info-copiar">
                                    <strong>${u.nombre}</strong>
                                    <span>${u.rol}</span>
                                    <span class="permisos-count">${cantPermisos} permisos personalizados</span>
                                </div>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        `;
                        })
                        .join("")}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Ver historial de cambios de permisos
 */
function verHistorialPermisos(usuarioId) {
    const usuario = database.usuarios.find((u) => u.id === usuarioId);
    const historial = database.historialPermisos
        .filter((h) => h.usuarioId === usuarioId)
        .reverse();

    if (historial.length === 0) {
        alert("No hay historial de cambios de permisos para este usuario");
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content modal-historial">
            <button class="modal-close" onclick="this.closest('.modal').remove()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-historial">
                <i class="fas fa-history"></i>
                <div>
                    <h3>Historial de Permisos</h3>
                    <p>${usuario.nombre}</p>
                </div>
            </div>

            <div class="modal-body-historial">
                <div class="historial-lista">
                    ${historial
                        .map((h) => {
                            const modificador = database.usuarios.find(
                                (u) => u.id === h.modificadoPor,
                            );
                            const fecha = new Date(h.fecha);
                            return `
                            <div class="historial-item">
                                <div class="historial-icono">
                                    <i class="fas fa-${h.accion === "restablecer" ? "undo" : "edit"}"></i>
                                </div>
                                <div class="historial-info">
                                    <div class="historial-accion">
                                        ${
                                            h.accion === "restablecer"
                                                ? "<strong>Permisos restablecidos</strong> a valores por defecto"
                                                : `<strong>${capitalizarModulo(h.modulo)}</strong> - ${capitalizarAccion(h.accion)}`
                                        }
                                    </div>
                                    ${
                                        h.accion !== "restablecer"
                                            ? `
                                        <div class="historial-cambio">
                                            <span class="cambio ${h.valorAnterior ? "permitido" : "denegado"}">
                                                ${h.valorAnterior === null ? "Por defecto" : h.valorAnterior ? "Permitido" : "Denegado"}
                                            </span>
                                            <i class="fas fa-arrow-right"></i>
                                            <span class="cambio ${h.valorNuevo ? "permitido" : "denegado"}">
                                                ${h.valorNuevo ? "Permitido" : "Denegado"}
                                            </span>
                                        </div>
                                    `
                                            : ""
                                    }
                                    <div class="historial-meta">
                                        <span><i class="fas fa-user"></i> ${modificador ? modificador.nombre : "Sistema"}</span>
                                        <span><i class="fas fa-clock"></i> ${fecha.toLocaleString("es-AR")}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        })
                        .join("")}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Cierra el modal de gestión de permisos
 */
function cerrarModalPermisos() {
    const modal = document.getElementById("modalGestionPermisos");
    if (modal) {
        modal.remove();
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function capitalizarModulo(modulo) {
    const nombres = {
        socios: "Socios",
        usuarios: "Usuarios",
        pagos: "Pagos",
        asistencias: "Asistencias",
        planes: "Planes",
        clases: "Clases",
        reportes: "Reportes",
        configuracion: "Configuración",
        todos: "Todos los módulos",
    };
    return nombres[modulo] || modulo;
}

function capitalizarAccion(accion) {
    const nombres = {
        ver: "Ver",
        crear: "Crear",
        editar: "Editar",
        eliminar: "Eliminar",
        registrar: "Registrar",
        anular: "Anular",
        resetPassword: "Resetear Contraseña",
        asignarInstructor: "Asignar Instructor",
        exportar: "Exportar",
        modificar: "Modificar",
        restablecer: "Restablecer",
    };
    return nombres[accion] || accion;
}

// ============================================
// MODIFICAR FUNCIONES EXISTENTES CON VALIDACIONES
// ============================================
console.log("✅ Sistema COMPLETO de Permisos cargado correctamente");
// Base de datos en memoria
const database = {
    usuarios: [
        {
            id: 1,
            username: "admin",
            password: "admin123",
            nombre: "Administrador",
            email: "admin@thebestgym.com",
            rol: "Administrador",
            activo: true,
            fechaCreacion: "2025-01-01",
        },
        {
            id: 2,
            username: "recep",
            password: "recep123",
            nombre: "Ana Martínez",
            email: "ana@thebestgym.com",
            rol: "Recepcionista",
            activo: true,
            fechaCreacion: "2025-01-15",
        },
        {
            id: 3,
            username: "socio1",
            password: "socio123",
            nombre: "Juan Pérez",
            email: "juan@email.com",
            rol: "Socio",
            socioId: 1,
            activo: true,
            fechaCreacion: "2025-01-15",
        },
        {
            id: 4,
            username: "instructor1",
            password: "inst123",
            nombre: "Carlos Fitness",
            email: "carlos@thebestgym.com",
            rol: "Instructor",
            activo: true,
            fechaCreacion: "2025-01-20",
        },
        {
            id: 5,
            username: "instructor2",
            password: "inst123",
            nombre: "Laura Trainer",
            email: "laura@thebestgym.com",
            rol: "Instructor",
            activo: true,
            fechaCreacion: "2025-01-20",
        },
        {
            id: 6,
            username: "instructor3",
            password: "inst123",
            nombre: "Miguel Strong",
            email: "miguel@thebestgym.com",
            rol: "Instructor",
            activo: true,
            fechaCreacion: "2025-01-20",
        },
    ],
    instructores: [
        {
            id: 1,
            usuarioId: 4,
            nombre: "Carlos Fitness",
            especialidad: "Musculación",
            email: "carlos@thebestgym.com",
            telefono: "261-1111111",
            activo: true,
        },
        {
            id: 2,
            usuarioId: 5,
            nombre: "Laura Trainer",
            especialidad: "Funcional",
            email: "laura@thebestgym.com",
            telefono: "261-2222222",
            activo: true,
        },
        {
            id: 3,
            usuarioId: 6,
            nombre: "Miguel Strong",
            especialidad: "CrossFit",
            email: "miguel@thebestgym.com",
            telefono: "261-3333333",
            activo: true,
        },
    ],
    clasesGym: [
        {
            id: 1,
            nombre: "Spinning Mañana",
            tipo: "Cardio",
            horario: "Lunes y Miércoles 09:00",
            duracion: "45 min",
            cupoMaximo: 20,
            instructorId: null,
            activa: true,
        },
        {
            id: 2,
            nombre: "Funcional Tarde",
            tipo: "Funcional",
            horario: "Martes y Jueves 18:00",
            duracion: "60 min",
            cupoMaximo: 15,
            instructorId: 2,
            activa: true,
        },
        {
            id: 3,
            nombre: "CrossFit Noche",
            tipo: "CrossFit",
            horario: "Lunes, Miércoles y Viernes 20:00",
            duracion: "60 min",
            cupoMaximo: 12,
            instructorId: 3,
            activa: true,
        },
        {
            id: 4,
            nombre: "Yoga Mañana",
            tipo: "Relajación",
            horario: "Martes y Jueves 10:00",
            duracion: "50 min",
            cupoMaximo: 25,
            instructorId: null,
            activa: true,
        },
        {
            id: 5,
            nombre: "Musculación Personalizada",
            tipo: "Musculación",
            horario: "Lunes a Viernes 14:00",
            duracion: "90 min",
            cupoMaximo: 10,
            instructorId: 1,
            activa: true,
        },
    ],
    socios: [
        {
            id: 1,
            nombre: "Juan Pérez",
            dni: "12345678",
            email: "juan@email.com",
            telefono: "261-1234567",
            plan: "Mensual",
            estado: "Activo",
            vencimiento: "2025-10-20",
            fechaAlta: "2025-01-15",
            fechaNacimiento: "1990-05-15",
            genero: "Masculino",
            contactoEmergencia: {
                nombre: "María Pérez",
                relacion: "Madre",
                telefono: "261-9999999",
            },
            informacionMedica: {
                grupoSanguineo: "O+",
                alergias: "Ninguna",
                lesiones: "Lesión de rodilla en 2023",
            },
        },
        {
            id: 2,
            nombre: "María García",
            dni: "87654321",
            email: "maria@email.com",
            telefono: "261-7654321",
            plan: "Trimestral",
            estado: "Moroso",
            vencimiento: "2025-10-05",
            fechaAlta: "2025-02-10",
        },
        {
            id: 3,
            nombre: "Carlos López",
            dni: "11223344",
            email: "carlos@email.com",
            telefono: "261-1122334",
            plan: "Anual",
            estado: "Activo",
            vencimiento: "2025-12-15",
            fechaAlta: "2024-12-15",
        },
        {
            id: 4,
            nombre: "Laura Fernández",
            dni: "22334455",
            email: "laura@email.com",
            telefono: "261-2233445",
            plan: "Mensual",
            estado: "Activo",
            vencimiento: "2025-11-01",
            fechaAlta: "2025-03-20",
        },
    ],
    planes: [
        {
            id: 1,
            nombre: "Mensual",
            duracion: 30,
            costo: 15000,
            descripcion: "Acceso completo por 1 mes",
        },
        {
            id: 2,
            nombre: "Trimestral",
            duracion: 90,
            costo: 40000,
            descripcion: "Acceso completo por 3 meses",
        },
        {
            id: 3,
            nombre: "Anual",
            duracion: 365,
            costo: 150000,
            descripcion: "Acceso completo por 1 año",
        },
    ],
    asistencias: [
        { id: 1, socioId: 1, fecha: "2025-10-14", hora: "08:30" },
        { id: 2, socioId: 3, fecha: "2025-10-14", hora: "09:15" },
        { id: 3, socioId: 1, fecha: "2025-10-13", hora: "18:45" },
        { id: 4, socioId: 4, fecha: "2025-10-14", hora: "07:00" },
        { id: 5, socioId: 3, fecha: "2025-10-13", hora: "19:30" },
        { id: 6, socioId: 1, fecha: "2025-10-12", hora: "08:15" },
        { id: 7, socioId: 1, fecha: "2025-10-11", hora: "18:00" },
        { id: 8, socioId: 1, fecha: "2025-10-10", hora: "08:30" },
    ],
    pagos: [
        {
            id: 1,
            socioId: 1,
            monto: 15000,
            fecha: "2025-09-20",
            metodoPago: "Efectivo",
            concepto: "Cuota Mensual",
        },
        {
            id: 2,
            socioId: 3,
            monto: 150000,
            fecha: "2024-12-15",
            metodoPago: "Transferencia",
            concepto: "Plan Anual",
        },
        {
            id: 3,
            socioId: 4,
            monto: 15000,
            fecha: "2025-10-01",
            metodoPago: "Tarjeta",
            concepto: "Cuota Mensual",
        },
    ],

    clases: [
        {
            id: 1,
            nombre: "Spinning",
            dia: "Lunes",
            hora: "08:00",
            instructor: "Carlos Ruiz",
            duracion: 60,
            cuposTotal: 20,
            cuposOcupados: 15,
        },
        {
            id: 2,
            nombre: "Yoga",
            dia: "Lunes",
            hora: "10:00",
            instructor: "Ana López",
            duracion: 60,
            cuposTotal: 15,
            cuposOcupados: 10,
        },
        {
            id: 3,
            nombre: "Crossfit",
            dia: "Martes",
            hora: "18:00",
            instructor: "Miguel Ángel",
            duracion: 60,
            cuposTotal: 12,
            cuposOcupados: 12,
        },
        {
            id: 4,
            nombre: "Funcional",
            dia: "Miércoles",
            hora: "07:00",
            instructor: "Laura Torres",
            duracion: 45,
            cuposTotal: 15,
            cuposOcupados: 8,
        },
        {
            id: 5,
            nombre: "Zumba",
            dia: "Jueves",
            hora: "19:00",
            instructor: "Sofia Morales",
            duracion: 60,
            cuposTotal: 25,
            cuposOcupados: 20,
        },
        {
            id: 6,
            nombre: "Spinning",
            dia: "Viernes",
            hora: "08:00",
            instructor: "Carlos Ruiz",
            duracion: 60,
            cuposTotal: 20,
            cuposOcupados: 5,
        },
    ],

    turnos: [
        {
            id: 1,
            socioId: 1,
            claseId: 1,
            fecha: "2025-10-21",
            estado: "Confirmado",
        },
        {
            id: 2,
            socioId: 1,
            claseId: 4,
            fecha: "2025-10-23",
            estado: "Confirmado",
        },
    ],
    permisosPersonalizados: [],
    historialPermisos: [],
    notificaciones: [],
    logNotificaciones: [],
};

// ============================================
// FUNCIONES DE UTILIDAD

function formatCurrency(amount) {
    return "$" + amount.toLocaleString("es-AR");
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("es-AR");
}

function getCurrentDate() {
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    return new Date().toLocaleDateString("es-AR", options);
}

function getTodayString() {
    const today = new Date();
    return today.toISOString().split("T")[0];
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(" ")[0].substring(0, 5);
}

// ============================================
// SISTEMA DE LOGIN

function initLogin() {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("loginError");

        try {
            const response = await apiRequest(
                `usuarios.php?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
                { method: 'GET' }
            );

            if (response.success) {
                currentUser = response.data;
                errorDiv.style.display = "none";
                showMainSystem();
            } else {
                errorDiv.style.display = "flex";
            }
        } catch (error) {
            console.error('Error en login:', error);
            errorDiv.style.display = "flex";
        }
    });
}

function showMainSystem() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("mainSystem").style.display = "flex";
    initMainSystem();
}

function logout() {
    currentUser = null;
    document.getElementById("mainSystem").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// ============================================
// SISTEMA PRINCIPAL

function initMainSystem() {
    document.getElementById("userRole").textContent = currentUser.rol;
    document.getElementById("welcomeText").textContent = `Bienvenido, ${currentUser.nombre}`;
    document.getElementById("currentDate").textContent = getCurrentDate();
    
    generateMenu();
    
    initDashboard();
    initUsuariosModule();
    initSociosModule();
    initAsistenciasModule();
    initPagosModule();
    initPlanesModule();
    initClasesInstructoresModule();
    
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("toggleSidebar").addEventListener("click", toggleSidebar);
    
    if (currentUser.rol === "Socio") {
        showModule("miPlan");
    } else {
        showModule("dashboard");
    }
}

function generateMenu() {
    const nav = document.getElementById("sidebarNav");
    nav.innerHTML = "";

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: "fa-chart-line", roles: ["Administrador", "Recepcionista"] },
        { id: "usuarios", label: "Usuarios", icon: "fa-users-cog", roles: ["Administrador"] },
        { id: "socios", label: "Socios", icon: "fa-users", roles: ["Administrador", "Recepcionista"] },
        { id: "asistencias", label: "Asistencias", icon: "fa-calendar-check", roles: ["Recepcionista"] },
        { id: "pagos", label: "Pagos", icon: "fa-dollar-sign", roles: ["Administrador", "Recepcionista"] },
        { id: "planes", label: "Planes", icon: "fa-file-alt", roles: ["Administrador", "Recepcionista"] },
        { id: "clasesInstructores", label: "Clases", icon: "fa-chalkboard-teacher", roles: ["Administrador"] },
        { id: "perfil", label: "Mi Perfil", icon: "fa-user-circle", roles: ["Socio"] },
        { id: "miPlan", label: "Mi Plan", icon: "fa-id-card", roles: ["Socio"] }
    ];

    if (!currentUser) return;

    menuItems
        .filter(item => item.roles.includes(currentUser.rol))
        .forEach(item => {
            const button = document.createElement("button");
            button.className = "nav-item";
            button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
            button.addEventListener("click", (e) => showModule(item.id, e));
            nav.appendChild(button);
        });
}

function showModule(moduleName, event) {
    document.querySelectorAll(".module").forEach(module => {
        module.style.display = "none";
    });
    
    document.getElementById(moduleName + "Module").style.display = "block";
    
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });
    
    if (event && event.target) {
        event.target.closest(".nav-item").classList.add("active");
    }
    
    activeModule = moduleName;

    switch (moduleName) {
        case "dashboard": updateDashboard(); break;
        case "usuarios": updateUsuariosTable(); break;
        case "socios": updateSociosTable(); break;
        case "asistencias": updateAsistenciasTable(); break;
        case "pagos": updatePagosTable(); break;
        case "planes": updatePlanesGrid(); break;
        case "clasesInstructores": 
            updateClasesTable();
            updateInstructoresGrid();
            break;
    }
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}


// ============================================
// MÓDULO DASHBOARD

function initDashboard() {
    updateDashboard();
}
function verificarVencimientos() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    database.socios.forEach((socio) => {
        const fechaVencimiento = new Date(socio.vencimiento + "T00:00:00");

        // Si la fecha de vencimiento ya pasó -> Moroso
        if (fechaVencimiento < hoy) {
            socio.estado = "Moroso";
        }
        // Si la fecha es hoy o futura y estaba moroso -> Activo (si renovó)
        else if (fechaVencimiento >= hoy && socio.estado === "Moroso") {
            // No cambiar automáticamente, solo si hay pago reciente
            const pagoReciente = database.pagos.find(
                (p) =>
                    p.socioId === socio.id &&
                    new Date(p.fecha + "T00:00:00") >=
                        new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000),
            );
            if (pagoReciente) {
                socio.estado = "Activo";
            }
        }
    });
}

function obtenerSociosProximosVencer(dias = 7) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return database.socios.filter((socio) => {
        const fechaVencimiento = new Date(socio.vencimiento + "T00:00:00");
        return (
            fechaVencimiento >= hoy &&
            fechaVencimiento <= fechaLimite &&
            socio.estado === "Activo"
        );
    });
}

async function updateDashboard() {
    try {
        const sociosResponse = await apiRequest('socios.php?action=stats', { method: 'GET' });
        if (sociosResponse.success) {
            document.getElementById("sociosActivos").textContent = sociosResponse.data.activos;
            document.getElementById("sociosMorosos").textContent = sociosResponse.data.morosos;
        }

        const asistenciasResponse = await apiRequest('asistencias.php?action=stats', { method: 'GET' });
        if (asistenciasResponse.success) {
            document.getElementById("asistenciasHoy").textContent = asistenciasResponse.data.hoy;
        }

        const pagosResponse = await apiRequest('pagos.php?action=ingresos_mes', { method: 'GET' });
        if (pagosResponse.success) {
            document.getElementById("ingresosDelMes").textContent = formatCurrency(pagosResponse.data.total);
        }

        await updateAlertasVencimiento();
        await updateUltimasAsistencias();
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}
async function updateAlertasVencimiento() {
    const container = document.getElementById("alertasVencimiento");

    try {
        const response = await apiRequest('socios.php?action=morosos', { method: 'GET' });
        
        if (!response.success) {
            container.innerHTML = '<p class="text-center">Error al cargar alertas</p>';
            return;
        }

        const morosos = response.data;

        if (morosos.length === 0) {
            container.innerHTML = `
                <div class="sin-alertas">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay alertas de vencimiento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = morosos.map(socio => {
            const fechaVenc = new Date(socio.vencimiento + 'T00:00:00');
            const hoy = new Date();
            const diasVencido = Math.floor((hoy - fechaVenc) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="alert-item alert-moroso">
                    <div class="alert-item-info">
                        <p class="alert-nombre">${socio.nombre}</p>
                        <p class="alert-detalle">Vencido hace ${diasVencido} día${diasVencido !== 1 ? 's' : ''}</p>
                        <p class="alert-fecha">Vencimiento: ${formatDate(socio.vencimiento)}</p>
                    </div>
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al cargar alertas:', error);
    }
}

async function updateUltimasAsistencias() {
    const container = document.getElementById("ultimasAsistencias");

    try {
        const response = await apiRequest('asistencias.php?action=hoy', { method: 'GET' });
        
        if (!response.success) {
            container.innerHTML = '<p class="text-center">Error al cargar asistencias</p>';
            return;
        }

        const asistencias = response.data.slice(-5).reverse();

        if (asistencias.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay asistencias hoy</p>';
            return;
        }

        container.innerHTML = asistencias.map(asistencia => `
            <div class="attendance-item">
                <div class="attendance-item-info">
                    <p>${asistencia.nombre}</p>
                    <p>${formatDate(asistencia.fecha)} - ${asistencia.hora}</p>
                </div>
                <i class="fas fa-check-circle"></i>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar asistencias:', error);
    }
}

// ============================================
// MÓDULO GESTIÓN DE USUARIOS

function initUsuariosModule() {
    document.getElementById("btnNuevoUsuario")?.addEventListener("click", abrirModalNuevoUsuario);
    document.getElementById("formNuevoUsuario")?.addEventListener("submit", guardarNuevoUsuario);
    document.getElementById("searchUsuarios")?.addEventListener("input", updateUsuariosTable);
    
    const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
    if (btnNuevoUsuario) {
        btnNuevoUsuario.style.display = tienePermiso("usuarios", "crear") ? "flex" : "none";
    }
    
    updateUsuariosTable();
}

async function updateUsuariosTable() {
    const searchTerm = document.getElementById("searchUsuarios").value.toLowerCase();
    const tbody = document.getElementById("tablaUsuarios");

    try {
        const response = await apiRequest('usuarios.php?action=all', { method: 'GET' });
        
        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error al cargar usuarios</td></tr>';
            return;
        }

        const usuarios = response.data.filter(usuario =>
            (usuario.nombre.toLowerCase().includes(searchTerm) ||
             usuario.username.toLowerCase().includes(searchTerm) ||
             usuario.rol.toLowerCase().includes(searchTerm)) &&
            usuario.id !== currentUser.id
        );

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron usuarios</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>
                    <div class="usuario-info">
                        <div class="usuario-avatar-small">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div style="font-weight: 500;">${usuario.nombre}</div>
                            <div style="font-size: 13px; color: var(--text-light);">@${usuario.username}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-rol badge-rol-${usuario.rol.toLowerCase().replace(/\s/g, '')}">
                        ${usuario.rol}
                    </span>
                </td>
                <td>
                    <span class="estado-badge ${usuario.activo ? 'estado-activo' : 'estado-inactivo'}">
                        <i class="fas fa-circle"></i>
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>${usuario.fecha_creacion ? formatDate(usuario.fecha_creacion) : '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-table btn-edit" onclick="editarUsuario(${usuario.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${currentUser.rol === 'Administrador' && usuario.rol !== 'Administrador' ? `
                            <button class="btn-table btn-delete" onclick="eliminarUsuario(${usuario.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    }
}

function abrirModalNuevoUsuario() {
    document.getElementById("modalNuevoUsuario").style.display = "flex";
    document.getElementById("formNuevoUsuario").reset();
}

function cerrarModalUsuario() {
    document.getElementById("modalNuevoUsuario").style.display = "none";
}

function generarUsername(nombre, apellido) {
    // Generar username: primera letra del nombre + apellido (sin espacios, minúsculas)
    const primeraLetra = nombre.charAt(0).toLowerCase();
    const apellidoLimpio = apellido.toLowerCase().replace(/\s/g, "");
    let username = primeraLetra + apellidoLimpio;

    // Verificar si ya existe, si existe agregar número
    let contador = 1;
    let usernameOriginal = username;
    while (database.usuarios.some((u) => u.username === username)) {
        username = usernameOriginal + contador;
        contador++;
    }

    return username;
}

function generarPassword() {
    // Generar contraseña aleatoria de 8 caracteres
    const caracteres =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += caracteres.charAt(
            Math.floor(Math.random() * caracteres.length),
        );
    }
    return password;
}

async function guardarNuevoUsuario(e) {
    e.preventDefault();
    
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const apellido = document.getElementById("nuevoApellido").value.trim();
    const email = document.getElementById("nuevoEmail").value.trim();
    const rol = document.getElementById("nuevoRol").value;
    
    const username = (nombre.charAt(0) + apellido).toLowerCase().replace(/\s/g, '');
    const password = generarPassword();
    const nombreCompleto = `${nombre} ${apellido}`;
    
    try {
        const response = await apiRequest('usuarios.php', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password,
                nombre: nombreCompleto,
                rol: rol
            })
        });
        
        if (response.success) {
            alert(`Usuario creado:\nUsuario: ${username}\nContraseña: ${password}`);
            cerrarModalUsuario();
            updateUsuariosTable();
        } else {
            alert('Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error al crear usuario:', error);
        alert('Error al crear usuario');
    }
}

function mostrarCredencialesGeneradas(username, password) {
    const div = document.getElementById("usuarioGenerado");
    div.innerHTML = `
        <div class="credenciales-header">
            <i class="fas fa-check-circle"></i>
            <h3>¡Usuario creado exitosamente!</h3>
        </div>
        <p class="credenciales-info">Guarde estas credenciales de forma segura. La contraseña no se mostrará nuevamente.</p>
        <div class="credenciales-box">
            <div class="credencial-item">
                <label>Usuario:</label>
                <div class="credencial-value">
                    <code id="usernameGenerado">${username}</code>
                    <button class="btn-copy" onclick="copiarTexto('usernameGenerado')" title="Copiar usuario">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="credencial-item">
                <label>Contraseña:</label>
                <div class="credencial-value">
                    <code id="passwordGenerado">${password}</code>
                    <button class="btn-copy" onclick="copiarTexto('passwordGenerado')" title="Copiar contraseña">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="credenciales-actions">
            <button class="btn-primary" onclick="descargarCredenciales('${username}', '${password}')">
                <i class="fas fa-download"></i> Descargar Credenciales
            </button>
            <button class="btn-secondary" onclick="finalizarCreacionUsuario()">
                <i class="fas fa-check"></i> Finalizar
            </button>
        </div>
    `;
    div.style.display = "block";
}

function copiarTexto(elementId) {
    const texto = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(texto).then(() => {
        // Feedback visual
        const btn = event.target.closest(".btn-copy");
        const iconOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.background = "var(--success-color)";

        setTimeout(() => {
            btn.innerHTML = iconOriginal;
            btn.style.background = "";
        }, 2000);
    });
}

function descargarCredenciales(username, password) {
    const contenido = `
THE BEST GYM - CREDENCIALES DE ACCESO
=====================================

Usuario: ${username}
Contraseña: ${password}

Fecha de creación: ${new Date().toLocaleString("es-AR")}

IMPORTANTE: Guarde estas credenciales de forma segura.
Por razones de seguridad, la contraseña no se mostrará nuevamente.

Puede cambiar su contraseña después del primer ingreso desde su perfil.
    `;

    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credenciales_${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function finalizarCreacionUsuario() {
    cerrarModalUsuario();
    document.getElementById("formNuevoUsuario").style.display = "block";
    document.getElementById("usuarioGenerado").style.display = "none";
}

function editarUsuario(id) {
    if (!tienePermiso("usuarios", "editar")) {
        mostrarErrorPermisos();
        return;
    }

    const usuario = database.usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const nuevoNombre = prompt("Nuevo nombre completo:", usuario.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
        usuario.nombre = nuevoNombre.trim();

        if (usuario.socioId) {
            const socio = database.socios.find((s) => s.id === usuario.socioId);
            if (socio) socio.nombre = nuevoNombre.trim();
        }

        const instructor = database.instructores.find(
            (i) => i.usuarioId === id,
        );
        if (instructor) instructor.nombre = nuevoNombre.trim();

        updateUsuariosTable();
        alert("Usuario actualizado correctamente");
    }
}

function resetearPassword(id) {
    if (!tienePermiso("usuarios", "resetPassword")) {
        mostrarErrorPermisos();
        return;
    }

    const usuario = database.usuarios.find((u) => u.id === id);
    if (!usuario) return;

    if (
        !confirm(
            `¿Está seguro de resetear la contraseña de ${usuario.nombre}?\n\nSe generará una nueva contraseña automáticamente.`,
        )
    ) {
        return;
    }

    const nuevaPassword = generarPassword();
    usuario.password = nuevaPassword;

    alert(
        `Contraseña reseteada exitosamente.\n\nUsuario: ${usuario.username}\nNueva contraseña: ${nuevaPassword}\n\nPor favor, anote esta información ya que no se mostrará nuevamente.`,
    );
}

function toggleEstadoUsuario(id) {
    const usuario = database.usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const nuevoEstado = usuario.activo !== false ? false : true;
    const accion = nuevoEstado ? "activar" : "desactivar";

    if (!confirm(`¿Está seguro de ${accion} el usuario ${usuario.nombre}?`)) {
        return;
    }

    usuario.activo = nuevoEstado;

    // Si es instructor, actualizar también su estado
    const instructor = database.instructores.find((i) => i.usuarioId === id);
    if (instructor) {
        instructor.activo = nuevoEstado;
    }

    updateUsuariosTable();
    alert(`Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente`);
}

async function eliminarUsuario(id) {
    if (!tienePermiso("usuarios", "eliminar")) {
        mostrarErrorPermisos();
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
        const response = await apiRequest(`usuarios.php?id=${id}`, { method: 'DELETE' });
        
        if (response.success) {
            alert('Usuario eliminado correctamente');
            updateUsuariosTable();
        } else {
            alert('Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
    }
}

function getDefaultVencimiento() {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    return fecha.toISOString().split("T")[0];
}

// ============================================
// MÓDULO SOCIOS

function initSociosModule() {
    document.getElementById("searchSocios")?.addEventListener("input", updateSociosTable);
    document.getElementById("formNuevoSocio")?.addEventListener("submit", guardarNuevoSocio);
    document.getElementById("socioPlan")?.addEventListener("change", actualizarVencimientoSocio);
    
    const btnNuevoSocio = document.getElementById("btnNuevoSocio");
    if (btnNuevoSocio) {
        btnNuevoSocio.style.display = tienePermiso("socios", "crear") ? "flex" : "none";
    }
    
    updateSociosTable();
}

// Cargar socios desde la API
async function updateSociosTable() {
    const searchTerm = document.getElementById("searchSocios").value.toLowerCase();
    const tbody = document.getElementById("tablaSocios");

    try {
        // Llamar a la API real
        const response = await apiRequest('socios.php?action=all', { method: 'GET' });
        
        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar socios</td></tr>';
            return;
        }

        const socios = response.data;

        // Filtrar por búsqueda
        const filteredSocios = socios.filter(socio =>
            socio.nombre.toLowerCase().includes(searchTerm) ||
            socio.dni.includes(searchTerm)
        );

        if (filteredSocios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron socios</td></tr>';
            return;
        }

        tbody.innerHTML = filteredSocios.map(socio => {
            let estadoMostrar = socio.estado;
            
            return `
            <tr>
                <td>
                    <div>
                        <div style="font-weight: 500; color: var(--text-dark);">${socio.nombre}</div>
                        <div style="font-size: 13px; color: var(--text-light);">${socio.email}</div>
                    </div>
                </td>
                <td>${socio.dni}</td>
                <td>${socio.plan}</td>
                <td>${formatDate(socio.vencimiento)}</td>
                <td>
                    <span class="badge ${estadoMostrar === 'Activo' ? 'badge-active' : 'badge-moroso'}">
                        ${estadoMostrar}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-table btn-ver-estado" onclick="verEstadoPlan(${socio.id})" title="Ver estado del plan">
                            <i class="fas fa-chart-line"></i> Estado
                        </button>
                        ${tienePermiso('socios', 'editar') ? `
                            <button class="btn-table btn-edit" onclick="editarSocio(${socio.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        ` : ''}
                        ${tienePermiso('socios', 'eliminar') ? `
                            <button class="btn-table btn-delete" onclick="eliminarSocio(${socio.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar socios:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar datos</td></tr>';
    }
}

async function eliminarSocio(id) {
    if (!tienePermiso("socios", "eliminar")) {
        mostrarErrorPermisos();
        return;
    }
    
    if (!confirm('¿Estás seguro de eliminar este socio?')) return;
    
    try {
        const response = await apiRequest(`socios.php?id=${id}`, { method: 'DELETE' });
        
        if (response.success) {
            alert('Socio eliminado correctamente');
            updateSociosTable();
            if (activeModule === 'dashboard') updateDashboard();
        } else {
            alert('Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error al eliminar socio:', error);
    }
}

function editarSocio(id) {
    if (!tienePermiso("socios", "editar")) {
        mostrarErrorPermisos();
        return;
    }

    const socio = database.socios.find((s) => s.id === id);
    if (!socio) {
        alert("❌ Error: Socio no encontrado");
        return;
    }
    abrirActualizarDatosSocio(id);
}
// ============================================
// FUNCIONES PARA NUEVO SOCIO

function abrirModalNuevoSocio() {
    if (!tienePermiso("socios", "crear")) {
        mostrarErrorPermisos();
        return;
    }
    
    document.getElementById("modalNuevoSocio").style.display = "flex";
    document.getElementById("formNuevoSocio").reset();
    document.getElementById("socioFechaAlta").value = getTodayString();
}

function cerrarModalNuevoSocio() {
    document.getElementById("modalNuevoSocio").style.display = "none";
}


async function actualizarVencimientoSocio() {
    const planId = parseInt(document.getElementById("socioPlan").value);
    
    if (!planId) return;
    
    try {
        const response = await apiRequest(`planes.php?id=${planId}`, { method: 'GET' });
        
        if (response.success) {
            const plan = response.data;
            const fechaAlta = new Date(document.getElementById("socioFechaAlta").value + "T00:00:00");
            const fechaVencimiento = new Date(fechaAlta);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + plan.duracion);
            
            document.getElementById("socioVencimiento").value = fechaVencimiento.toISOString().split("T")[0];
            
            const preview = document.getElementById("planPreview");
            document.getElementById("planNombrePreview").textContent = plan.nombre;
            document.getElementById("planDetallesPreview").textContent = `${plan.descripcion} - ${plan.duracion} días`;
            document.getElementById("planPrecioPreview").textContent = formatCurrency(plan.costo);
            preview.style.display = "flex";
        }
    } catch (error) {
        console.error('Error al cargar plan:', error);
    }
}

async function guardarNuevoSocio(e) {
    e.preventDefault();

    const nombre = document.getElementById("socioNombre").value.trim();
    const dni = document.getElementById("socioDni").value.trim();
    const telefono = document.getElementById("socioTelefono").value.trim();
    const email = document.getElementById("socioEmail").value.trim();
    const planId = parseInt(document.getElementById("socioPlan").value);

    const errorDiv = document.getElementById("errorSocio");

    if (dni.length !== 8) {
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>DNI inválido</strong>
                <p>El DNI debe tener 8 dígitos.</p>
            </div>
        `;
        errorDiv.style.display = "flex";
        return;
    }

    try {
        // Buscar el nombre del plan
        const planesResponse = await apiRequest('planes.php?action=all', { method: 'GET' });
        const plan = planesResponse.data.find(p => p.id === planId);

        if (!plan) {
            alert('Error: Plan no encontrado');
            return;
        }

        // Crear el socio
        const response = await apiRequest('socios.php', {
            method: 'POST',
            body: JSON.stringify({
                nombre: nombre,
                dni: dni,
                email: email,
                telefono: telefono,
                plan: plan.nombre
            })
        });

        if (response.success) {
            // Mostrar confirmación
            const socioId = response.data.id;
            mostrarConfirmacionSocio(
                { id: socioId, nombre, dni, plan: plan.nombre, vencimiento: calcularVencimiento(plan.duracion) },
                `socio${dni}`,
                generarPassword(),
                plan
            );

            updateSociosTable();
            document.getElementById("formNuevoSocio").style.display = "none";
        } else {
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Error</strong>
                    <p>${response.message}</p>
                </div>
            `;
            errorDiv.style.display = "flex";
        }
        
    } catch (error) {
        console.error('Error al guardar socio:', error);
        alert('Error al registrar el socio');
    }
}

function calcularVencimiento(duracion) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + duracion);
    return hoy.toISOString().split('T')[0];
}

function generarUsernameFromDNI(dni) {
    let username = "socio" + dni;
    let contador = 1;
    let usernameOriginal = username;

    while (database.usuarios.some((u) => u.username === username)) {
        username = usernameOriginal + contador;
        contador++;
    }

    return username;
}

function mostrarConfirmacionSocio(socio, username, password, plan) {
    const div = document.getElementById("socioRegistrado");

    // Llenar datos de confirmación
    document.getElementById("confirmNombre").textContent = socio.nombre;
    document.getElementById("confirmDni").textContent = socio.dni;
    document.getElementById("confirmPlan").textContent = plan.nombre;
    document.getElementById("confirmVencimiento").textContent = formatDate(
        socio.vencimiento,
    );
    document.getElementById("confirmUsuario").textContent = username;
    document.getElementById("confirmPassword").textContent = password;

    div.style.display = "block";
}

function descargarCredencialesSocio() {
    const nombre = document.getElementById("confirmNombre").textContent;
    const dni = document.getElementById("confirmDni").textContent;
    const usuario = document.getElementById("confirmUsuario").textContent;
    const password = document.getElementById("confirmPassword").textContent;
    const plan = document.getElementById("confirmPlan").textContent;
    const vencimiento =
        document.getElementById("confirmVencimiento").textContent;

    const contenido = `
THE BEST GYM - CREDENCIALES DE SOCIO
====================================

DATOS DEL SOCIO
Nombre: ${nombre}
DNI: ${dni}
Plan: ${plan}
Vencimiento: ${vencimiento}

CREDENCIALES DE ACCESO AL PORTAL
Usuario: ${usuario}
Contraseña: ${password}

Fecha de registro: ${new Date().toLocaleString("es-AR")}

IMPORTANTE: 
- Guarde estas credenciales de forma segura.
- Puede cambiar su contraseña después del primer ingreso desde su perfil.
- Recuerde realizar el pago antes de la fecha de vencimiento.

¡Bienvenido a The Best Gym!
    `;

    const blob = new Blob([contenido], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credenciales_${dni}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function finalizarRegistroSocio() {
    cerrarModalNuevoSocio();
    document.getElementById("formNuevoSocio").style.display = "block";
    document.getElementById("socioRegistrado").style.display = "none";
}
// ============================================
// VERIFICACIÓN DE SOCIO EXISTENTE

function mostrarSocioExistente(socio, tipoCampo) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalSocioExistente";
    modal.style.display = "flex";

    const estadoBadge =
        socio.estado === "Activo"
            ? '<span class="badge-active">Activo</span>'
            : '<span class="badge-moroso">Moroso</span>';

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalSocioExistente()"></div>
        <div class="modal-content modal-socio-existente">
            <button class="modal-close" onclick="cerrarModalSocioExistente()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-warning">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h3>Socio Existente</h3>
                    <p>Ya existe un socio registrado con este ${tipoCampo === "DNI" ? "DNI" : "correo electrónico"}</p>
                </div>
            </div>

            <div class="modal-body-socio-existente">
                <div class="socio-existente-info">
                    <div class="info-header">
                        <div class="info-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <h4>${socio.nombre}</h4>
                            ${estadoBadge}
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <i class="fas fa-id-card"></i>
                            <div>
                                <label>DNI</label>
                                <span>${socio.dni}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <label>Email</label>
                                <span>${socio.email}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <div>
                                <label>Teléfono</label>
                                <span>${socio.telefono}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div>
                                <label>Plan</label>
                                <span>${socio.plan}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar-check"></i>
                            <div>
                                <label>Fecha de Alta</label>
                                <span>${formatDate(socio.fechaAlta)}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <label>Vencimiento</label>
                                <span>${formatDate(socio.vencimiento)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="opciones-socio-existente">
                    <h4><i class="fas fa-question-circle"></i> ¿Qué deseas hacer?</h4>
                    <div class="opciones-buttons">
                        <button class="btn-opcion btn-actualizar" onclick="abrirActualizarDatosSocio(${socio.id})">
                            <i class="fas fa-edit"></i>
                            <div>
                                <strong>Actualizar Datos</strong>
                                <span>Modificar información del socio</span>
                            </div>
                        </button>
                        <button class="btn-opcion btn-renovar" onclick="abrirRenovarPlanSocio(${socio.id})">
                            <i class="fas fa-sync-alt"></i>
                            <div>
                                <strong>Renovar Plan</strong>
                                <span>Extender membresía existente</span>
                            </div>
                        </button>
                        <button class="btn-opcion btn-ver" onclick="verPerfilCompletoSocio(${socio.id})">
                            <i class="fas fa-user-circle"></i>
                            <div>
                                <strong>Ver Perfil Completo</strong>
                                <span>Ver toda la información</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div class="modal-footer-socio-existente">
                <button class="btn-secondary" onclick="cerrarModalSocioExistente()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function cerrarModalSocioExistente() {
    const modal = document.getElementById("modalSocioExistente");
    if (modal) {
        modal.remove();
    }
}

function abrirActualizarDatosSocio(socioId) {
    // Cerrar otros modales si están abiertos
    cerrarModalSocioExistente();
    cerrarModalNuevoSocio();

    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) {
        alert("❌ Error: Socio no encontrado");
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalActualizarSocio";
    modal.style.display = "flex";

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalActualizarSocio()"></div>
        <div class="modal-content modal-actualizar-socio">
            <button class="modal-close" onclick="cerrarModalActualizarSocio()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-socio">
                <i class="fas fa-user-edit"></i>
                <h3>Actualizar Datos del Socio</h3>
            </div>

            <div class="modal-body-socio">
                <form id="formActualizarSocio">
                    <div class="section-title">
                        <i class="fas fa-user"></i>
                        <h4>Datos Personales</h4>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo *</label>
                            <input type="text" id="updateNombre" class="form-control" value="${socio.nombre}" required />
                        </div>
                        <div class="form-group">
                            <label>DNI *</label>
                            <input type="text" id="updateDni" class="form-control" value="${socio.dni}" readonly />
                            <small class="form-hint">
                                <i class="fas fa-info-circle"></i>
                                El DNI no puede modificarse
                            </small>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono *</label>
                            <input type="tel" id="updateTelefono" class="form-control" value="${socio.telefono}" required />
                        </div>
                        <div class="form-group">
                            <label>Correo Electrónico *</label>
                            <input type="email" id="updateEmail" class="form-control" value="${socio.email}" required />
                        </div>
                    </div>

                    <div class="section-title">
                        <i class="fas fa-id-card"></i>
                        <h4>Plan y Membresía</h4>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Plan Actual *</label>
                            <select id="updatePlan" class="form-control" required>
                                <option value="Mensual" ${socio.plan === "Mensual" ? "selected" : ""}>Mensual - $15,000</option>
                                <option value="Trimestral" ${socio.plan === "Trimestral" ? "selected" : ""}>Trimestral - $40,000</option>
                                <option value="Anual" ${socio.plan === "Anual" ? "selected" : ""}>Anual - $150,000</option>
                            </select>
                            <small class="form-hint">
                                <i class="fas fa-info-circle"></i>
                                Cambiar el plan no afecta la fecha de vencimiento
                            </small>
                        </div>
                        <div class="form-group">
                            <label>Estado *</label>
                            <select id="updateEstado" class="form-control" required>
                                <option value="Activo" ${socio.estado === "Activo" ? "selected" : ""}>Activo</option>
                                <option value="Moroso" ${socio.estado === "Moroso" ? "selected" : ""}>Moroso</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Fecha de Vencimiento *</label>
                        <input type="date" id="updateVencimiento" class="form-control" value="${socio.vencimiento}" required />
                    </div>

                    <div id="errorActualizacion" class="error-message-socio" style="display: none">
                        <!-- Mensaje de error dinámico -->
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="cerrarModalActualizarSocio()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("formActualizarSocio")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            guardarCambiosSocio(socioId);
        });
}

function cerrarModalActualizarSocio() {
    const modal = document.getElementById("modalActualizarSocio");
    if (modal) {
        modal.remove();
    }
}

function guardarCambiosSocio(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) {
        alert("❌ Error: Socio no encontrado");
        return;
    }

    const nuevoEmail = document.getElementById("updateEmail").value.trim();
    const errorDiv = document.getElementById("errorActualizacion");

    // Validar que el email no esté en uso por otro socio
    const emailExistente = database.socios.find(
        (s) =>
            s.id !== socioId &&
            s.email.toLowerCase() === nuevoEmail.toLowerCase(),
    );

    if (emailExistente) {
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Email ya registrado</strong>
                <p>El correo ${nuevoEmail} ya está en uso por ${emailExistente.nombre}</p>
            </div>
        `;
        errorDiv.style.display = "flex";
        return;
    }

    // Actualizar datos del socio
    socio.nombre = document.getElementById("updateNombre").value.trim();
    socio.telefono = document.getElementById("updateTelefono").value.trim();
    socio.email = nuevoEmail;
    socio.plan = document.getElementById("updatePlan").value;
    socio.estado = document.getElementById("updateEstado").value;
    socio.vencimiento = document.getElementById("updateVencimiento").value;

    // Actualizar también el usuario asociado si existe
    const usuario = database.usuarios.find((u) => u.socioId === socioId);
    if (usuario) {
        usuario.nombre = socio.nombre;
        usuario.email = socio.email;
    }

    alert("✅ Datos del socio actualizados correctamente");
    cerrarModalActualizarSocio();
    updateSociosTable();

    // Actualizar dashboard si estamos en él
    if (activeModule === "dashboard") {
        updateDashboard();
    }
}

function abrirRenovarPlanSocio(socioId) {
    cerrarModalSocioExistente();

    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalRenovarPlan";
    modal.style.display = "flex";

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalRenovarPlan()"></div>
        <div class="modal-content modal-renovar-plan">
            <button class="modal-close" onclick="cerrarModalRenovarPlan()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-socio">
                <i class="fas fa-sync-alt"></i>
                <h3>Renovar Plan de ${socio.nombre}</h3>
            </div>

            <div class="modal-body-socio">
                <div class="info-actual-plan">
                    <h4>Plan Actual</h4>
                    <div class="plan-actual-card">
                        <div><strong>Plan:</strong> ${socio.plan}</div>
                        <div><strong>Vencimiento:</strong> ${formatDate(socio.vencimiento)}</div>
                        <div><strong>Estado:</strong> <span class="badge ${socio.estado === "Activo" ? "badge-active" : "badge-moroso"}">${socio.estado}</span></div>
                    </div>
                </div>

                <form id="formRenovarPlan">
                    <div class="form-group">
                        <label>Seleccionar Nuevo Plan *</label>
                        <select id="renovarPlanId" class="form-control" required>
                            <option value="">Seleccionar plan...</option>
                            <option value="1">Mensual - $15,000</option>
                            <option value="2">Trimestral - $40,000</option>
                            <option value="3">Anual - $150,000</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Método de Pago *</label>
                        <select id="renovarMetodoPago" class="form-control" required>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="cerrarModalRenovarPlan()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check"></i> Confirmar Renovación
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("formRenovarPlan")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            confirmarRenovacionPlan(socioId);
        });
}

function cerrarModalRenovarPlan() {
    const modal = document.getElementById("modalRenovarPlan");
    if (modal) {
        modal.remove();
    }
}

function confirmarRenovacionPlan(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) return;

    const planId = parseInt(document.getElementById("renovarPlanId").value);
    const metodoPago = document.getElementById("renovarMetodoPago").value;

    const plan = database.planes.find((p) => p.id === planId);
    if (!plan) {
        alert("Error: Plan no encontrado");
        return;
    }

    const hoy = new Date();
    const nuevoVencimiento = new Date(hoy);
    nuevoVencimiento.setDate(nuevoVencimiento.getDate() + plan.duracion);

    socio.plan = plan.nombre;
    socio.vencimiento = nuevoVencimiento.toISOString().split("T")[0];
    socio.estado = "Activo";

    const nuevoPago = {
        id: database.pagos.length + 1,
        socioId: socio.id,
        monto: plan.costo,
        fecha: getTodayString(),
        metodoPago: metodoPago,
        concepto: `Renovación - Plan ${plan.nombre}`,
    };

    database.pagos.push(nuevoPago);

    alert(
        `✅ Plan renovado exitosamente\n\nNuevo vencimiento: ${formatDate(socio.vencimiento)}`,
    );

    cerrarModalRenovarPlan();
    updateSociosTable();
    if (activeModule === "dashboard") {
        updateDashboard();
    }
}

function verPerfilCompletoSocio(socioId) {
    cerrarModalSocioExistente();

    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) return;

    const pagos = database.pagos.filter((p) => p.socioId === socioId);
    const asistencias = database.asistencias.filter(
        (a) => a.socioId === socioId,
    );

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalPerfilSocio";
    modal.style.display = "flex";

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalPerfilSocio()"></div>
        <div class="modal-content modal-perfil-completo">
            <button class="modal-close" onclick="cerrarModalPerfilSocio()">
                <i class="fas fa-times"></i>
            </button>

            <div class="perfil-header">
                <div class="perfil-avatar-large">
                    <i class="fas fa-user"></i>
                </div>
                <div class="perfil-info-header">
                    <h2>${socio.nombre}</h2>
                    <p><i class="fas fa-id-card"></i> DNI: ${socio.dni}</p>
                    <span class="badge ${socio.estado === "Activo" ? "badge-active" : "badge-moroso"}">${socio.estado}</span>
                </div>
            </div>

            <div class="perfil-body">
                <div class="perfil-section">
                    <h4><i class="fas fa-info-circle"></i> Información Personal</h4>
                    <div class="info-grid">
                        <div><strong>Email:</strong> ${socio.email}</div>
                        <div><strong>Teléfono:</strong> ${socio.telefono}</div>
                        <div><strong>Plan:</strong> ${socio.plan}</div>
                        <div><strong>Fecha Alta:</strong> ${formatDate(socio.fechaAlta)}</div>
                        <div><strong>Vencimiento:</strong> ${formatDate(socio.vencimiento)}</div>
                    </div>
                </div>

                <div class="perfil-section">
                    <h4><i class="fas fa-chart-bar"></i> Estadísticas</h4>
                    <div class="stats-perfil">
                        <div class="stat-perfil">
                            <i class="fas fa-dollar-sign"></i>
                            <div>
                                <strong>${pagos.length}</strong>
                                <span>Pagos realizados</span>
                            </div>
                        </div>
                        <div class="stat-perfil">
                            <i class="fas fa-calendar-check"></i>
                            <div>
                                <strong>${asistencias.length}</strong>
                                <span>Asistencias</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="perfil-section">
                    <h4><i class="fas fa-history"></i> Últimos Pagos</h4>
                    ${
                        pagos.length > 0
                            ? `
                        <table class="tabla-mini">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Concepto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pagos
                                    .slice(-5)
                                    .reverse()
                                    .map(
                                        (p) => `
                                    <tr>
                                        <td>${formatDate(p.fecha)}</td>
                                        <td>${formatCurrency(p.monto)}</td>
                                        <td>${p.metodoPago}</td>
                                        <td>${p.concepto}</td>
                                    </tr>
                                `,
                                    )
                                    .join("")}
                            </tbody>
                        </table>
                    `
                            : '<p class="text-center" style="color: var(--text-light);">No hay pagos registrados</p>'
                    }
                </div>
            </div>

            <div class="modal-footer-perfil">
                <button class="btn-secondary" onclick="cerrarModalPerfilSocio()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function cerrarModalPerfilSocio() {
    const modal = document.getElementById("modalPerfilSocio");
    if (modal) {
        modal.remove();
    }
}
// ============================================
// MÓDULO ASISTENCIAS

function initAsistenciasModule() {
    document.getElementById("btnRegistrarAsistencia")?.addEventListener("click", registrarAsistencia);
    updateAsistenciasTable();
}

async function registrarAsistencia() {
    const dni = document.getElementById("dniAsistencia").value;
    const mensajeDiv = document.getElementById("mensajeAsistencia");

    if (!dni) {
        showMessage(mensajeDiv, "Por favor ingrese un DNI", "error");
        return;
    }

    try {
        const response = await apiRequest('asistencias.php', {
            method: 'POST',
            body: JSON.stringify({ dni: dni })
        });

        if (response.success) {
            showMessage(mensajeDiv, response.message, "success");
            document.getElementById("dniAsistencia").value = "";
            updateAsistenciasTable();
            if (activeModule === 'dashboard') updateDashboard();
            
            setTimeout(() => {
                mensajeDiv.style.display = "none";
            }, 3000);
        } else {
            showMessage(mensajeDiv, response.message, "error");
        }
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        showMessage(mensajeDiv, "Error al registrar asistencia", "error");
    }
}

function registrarAsistencia() {
    const dni = document.getElementById("dniAsistencia").value;
    const mensajeDiv = document.getElementById("mensajeAsistencia");

    if (!dni) {
        showMessage(mensajeDiv, "Por favor ingrese un DNI", "error");
        return;
    }

    const socio = database.socios.find((s) => s.dni === dni);

    if (!socio) {
        showMessage(mensajeDiv, "Socio no encontrado", "error");
        return;
    }

    if (socio.estado === "Moroso") {
        showMessage(
            mensajeDiv,
            "El socio tiene la cuota vencida. No puede ingresar.",
            "error",
        );
        return;
    }

    const nuevaAsistencia = {
        id: database.asistencias.length + 1,
        socioId: socio.id,
        fecha: getTodayString(),
        hora: getCurrentTime(),
    };

    database.asistencias.push(nuevaAsistencia);

    showMessage(
        mensajeDiv,
        `Asistencia registrada para ${socio.nombre}`,
        "success",
    );
    document.getElementById("dniAsistencia").value = "";
    updateAsistenciasTable();
    updateDashboard();

    setTimeout(() => {
        mensajeDiv.style.display = "none";
    }, 3000);
}

async function updateAsistenciasTable() {
    const tbody = document.getElementById("tablaAsistencias");

    try {
        const response = await apiRequest('asistencias.php?action=all', { method: 'GET' });
        
        if (!response.success) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">Error al cargar asistencias</td></tr>';
            return;
        }

        const asistencias = response.data.slice(0, 50).reverse();

        tbody.innerHTML = asistencias.map(asistencia => `
            <tr>
                <td>${asistencia.nombre}</td>
                <td>${formatDate(asistencia.fecha)}</td>
                <td>${asistencia.hora}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error al cargar asistencias:', error);
    }
}

// ============================================
// MÓDULO PAGOS

function initPagosModule() {
    loadSociosForPagos();
    
    document.getElementById('btnRegistrarPago')
        .addEventListener('click', registrarPago);
    
    updatePagosTable();
}

async function loadSociosForPagos() {
    const select = document.getElementById('socioSeleccionado');
    
    try {
        const response = await apiRequest('socios.php?action=all', {
            method: 'GET'
        });
        
        if (response.success) {
            select.innerHTML = '<option value="">Seleccionar Socio</option>' +
                response.data.map(s => 
                    `<option value="${s.id}">${s.nombre} - DNI: ${s.dni}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error al cargar socios:', error);
    }
}
async function registrarPago() {
    if (!tienePermiso('pagos', 'crear')) {
        mostrarErrorPermisos();
        return;
    }

    const socioId = parseInt(document.getElementById('socioSeleccionado').value);
    const monto = parseFloat(document.getElementById('montoPago').value);
    const metodoPago = document.getElementById('metodoPago').value;

    if (!socioId || !monto) {
        alert('Por favor complete todos los campos');
        return;
    }

    try {
        const response = await apiRequest('pagos.php', {
            method: 'POST',
            body: JSON.stringify({
                socio_id: socioId,
                monto: monto,
                metodo_pago: metodoPago,
                concepto: 'Cuota Mensual'
            })
        });

        if (response.success) {
            document.getElementById('socioSeleccionado').value = '';
            document.getElementById('montoPago').value = '';
            
            alert('✅ ' + response.message);
            updatePagosTable();
            
            if (activeModule === 'dashboard') {
                updateDashboard();
            }
        } else {
            alert('❌ Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error al registrar pago:', error);
        alert('❌ Error al registrar el pago');
    }
}

async function updatePagosTable() {
    const tbody = document.getElementById('tablaPagos');
    
    try {
        const response = await apiRequest('pagos.php?action=all', {
            method: 'GET'
        });

        if (response.success && response.data.length > 0) {
            tbody.innerHTML = response.data
                .slice()
                .reverse()
                .map(pago => `
                    <tr>
                        <td>${pago.socio_nombre}</td>
                        <td style="font-weight: 600; color: var(--success-color);">
                            ${formatCurrency(pago.monto)}
                        </td>
                        <td>${formatDate(pago.fecha)}</td>
                        <td>${pago.metodo_pago}</td>
                        <td>${pago.concepto}</td>
                        <td>
                            <button class="btn-ticket" onclick="generarTicket(${pago.id})">
                                <i class="fas fa-receipt"></i> Ticket
                            </button>
                        </td>
                    </tr>
                `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: var(--text-light);">No hay pagos registrados</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color: var(--danger-color);">Error al cargar datos</td></tr>';
    }
}

async function generarTicket(pagoId) {
    try {
        const response = await apiRequest(`pagos.php?id=${pagoId}`, {
            method: 'GET'
        });

        if (!response.success) {
            alert('Error al generar el ticket');
            return;
        }

        const pago = response.data;
        const ticketContent = document.getElementById('ticketContent');

        ticketContent.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-logo">
                    <i class="fas fa-dumbbell"></i>
                </div>
                <h2>The Best Gym</h2>
                <p>Sistema de Gestión</p>
                <div class="ticket-divider"></div>
            </div>

            <div class="ticket-body">
                <div class="ticket-section">
                    <h3>Comprobante de Pago</h3>
                    <p class="ticket-number">N° ${String(pago.id).padStart(6, '0')}</p>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <div class="ticket-row">
                        <span class="ticket-label">Fecha:</span>
                        <span class="ticket-value">${formatDate(pago.fecha)}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Hora:</span>
                        <span class="ticket-value">${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <h4>Datos del Socio</h4>
                    <div class="ticket-row">
                        <span class="ticket-label">Nombre:</span>
                        <span class="ticket-value">${pago.socio_nombre}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">DNI:</span>
                        <span class="ticket-value">${pago.dni}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Plan:</span>
                        <span class="ticket-value">${pago.plan}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <h4>Detalle del Pago</h4>
                    <div class="ticket-row">
                        <span class="ticket-label">Concepto:</span>
                        <span class="ticket-value">${pago.concepto}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Método:</span>
                        <span class="ticket-value">${pago.metodo_pago}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-total">
                    <span>TOTAL ABONADO</span>
                    <span class="ticket-amount">${formatCurrency(pago.monto)}</span>
                </div>

                <div class="ticket-footer">
                    <p>¡Gracias por tu pago!</p>
                    <p class="ticket-small">Este comprobante es válido como constancia de pago</p>
                </div>
            </div>
        `;

        document.getElementById('ticketModal').style.display = 'flex';
    } catch (error) {
        console.error('Error al generar ticket:', error);
        alert('Error al generar el ticket');
    }
}
// ============================================
// MÓDULO PLANES

function initPlanesModule() {
    const btnNuevoPlan = document.getElementById('btnNuevoPlan');
    if (btnNuevoPlan) {
        if (currentUser.rol !== 'Administrador') {
            btnNuevoPlan.style.display = 'none';
        } else {
            btnNuevoPlan.style.display = 'flex';
        }
    }
    updatePlanesGrid();
}

async function updatePlanesGrid() {
    const grid = document.getElementById('planesGrid');

    try {
        const response = await apiRequest('planes.php?action=all', {
            method: 'GET'
        });

        if (!response.success || response.data.length === 0) {
            grid.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 40px;">No hay planes registrados</p>';
            return;
        }

        grid.innerHTML = response.data.map(plan => {
            const activo = plan.activo != 0;
            return `
                <div class="plan-card ${!activo ? 'plan-inactivo' : ''}">
                    ${!activo ? '<div class="plan-badge-inactivo">Inactivo</div>' : ''}
                    <div class="plan-header">
                        <h3>${plan.nombre}</h3>
                        ${currentUser.rol === 'Administrador' ? `
                            <div class="plan-actions">
                                <button class="btn-plan-action" onclick="editarPlan(${plan.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-plan-action btn-delete" onclick="eliminarPlan(${plan.id})" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <p class="plan-description">${plan.descripcion}</p>
                    <div class="plan-price">
                        <div class="price">${formatCurrency(plan.costo)}</div>
                        <div class="duration">${plan.duracion} días</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error al cargar planes:', error);
        grid.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Error al cargar planes</p>';
    }
}

function seleccionarPlan(id) {
    const plan = database.planes.find((p) => p.id === id);
    alert(`Has seleccionado el plan: ${plan.nombre}`);
}

// ============================================
// MÓDULO MI PLAN

function initMiPlanModule() {
    updateMiPlan();
}

function updateMiPlan() {
    if (currentUser.rol !== "Socio") return;

    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    if (!socio) {
        document.querySelector(".my-plan-container").innerHTML =
            '<p class="text-center">No se encontró información del socio</p>';
        return;
    }

    const plan = database.planes.find((p) => p.nombre === socio.plan);

    document.getElementById("miPlanNombre").textContent = socio.plan;
    document.getElementById("miPlanEstado").textContent = socio.estado;
    document.getElementById("miPlanFechaInicio").textContent = formatDate(
        socio.fechaAlta,
    );
    document.getElementById("miPlanVencimiento").textContent = formatDate(
        socio.vencimiento,
    );
    document.getElementById("miPlanCosto").textContent = plan
        ? formatCurrency(plan.costo)
        : "-";

    const today = new Date();
    const vencimiento = new Date(socio.vencimiento + "T00:00:00");
    const diasRestantes = Math.ceil(
        (vencimiento - today) / (1000 * 60 * 60 * 24),
    );
    document.getElementById("miPlanDiasRestantes").textContent =
        diasRestantes > 0 ? `${diasRestantes} días` : "Vencido";

    const fechaInicio = new Date(socio.fechaAlta + "T00:00:00");
    const duracionTotal = plan ? plan.duracion : 30;
    const diasTranscurridos = Math.ceil(
        (today - fechaInicio) / (1000 * 60 * 60 * 24),
    );
    const progreso = Math.min(
        100,
        Math.round((diasTranscurridos / duracionTotal) * 100),
    );

    document.getElementById("planProgressPercent").textContent = progreso + "%";
    document.getElementById("planProgressBar").style.width = progreso + "%";

    const asistenciasMes = database.asistencias.filter((a) => {
        const fechaAsistencia = new Date(a.fecha + "T00:00:00");
        return (
            a.socioId === socio.id &&
            fechaAsistencia.getMonth() === today.getMonth() &&
            fechaAsistencia.getFullYear() === today.getFullYear()
        );
    }).length;

    document.getElementById("misAsistenciasMes").textContent = asistenciasMes;

    generateAsistenciasChart(socio.id);

    document.getElementById("proximoPagoMonto").textContent = plan
        ? formatCurrency(plan.costo)
        : "$0";
    document.getElementById("proximoPagoFecha").textContent = formatDate(
        socio.vencimiento,
    );

    const pagosSocio = database.pagos.filter((p) => p.socioId === socio.id);
    const totalPagado = pagosSocio.reduce((sum, p) => sum + p.monto, 0);

    document.getElementById("ultimosPagosCount").textContent =
        pagosSocio.length;
    document.getElementById("totalPagado").textContent =
        formatCurrency(totalPagado);

    const estadoBadge = document.getElementById("estadoCuenta");
    if (socio.estado === "Activo") {
        estadoBadge.textContent = "Al día";
        estadoBadge.className = "status-badge";
    } else {
        estadoBadge.textContent = "Moroso";
        estadoBadge.className = "status-badge moroso";
    }

    updateMiHistorialAsistencias(socio.id);
}

function generateAsistenciasChart(socioId) {
    const chartContainer = document.getElementById("chartAsistencias");
    const today = new Date();
    const chart = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const count = database.asistencias.filter(
            (a) => a.socioId === socioId && a.fecha === dateStr,
        ).length;

        chart.push({
            date: dateStr,
            count: count,
        });
    }

    const maxCount = Math.max(...chart.map((c) => c.count), 1);

    chartContainer.innerHTML = chart
        .map((item) => {
            const height = (item.count / maxCount) * 100;
            return `<div class="chart-bar-item" style="height: ${height}%" title="${item.date}: ${item.count} asistencias"></div>`;
        })
        .join("");
}

function updateMiHistorialAsistencias(socioId) {
    const tbody = document.getElementById("miHistorialAsistencias");
    const asistencias = database.asistencias
        .filter((a) => a.socioId === socioId)
        .slice(-10)
        .reverse();

    if (asistencias.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="3" class="text-center">No hay asistencias registradas</td></tr>';
        return;
    }

    tbody.innerHTML = asistencias
        .map(
            (asistencia) => `
        <tr>
            <td>${formatDate(asistencia.fecha)}</td>
            <td>${asistencia.hora}</td>
            <td><span class="badge badge-active">Completado</span></td>
        </tr>
    `,
        )
        .join("");
}

function renovarPlan() {
    alert("Funcionalidad de renovación de plan. Aquí se procesaría el pago.");
}

function verHistorialPagos() {
    if (currentUser.rol === "Socio") {
        const socio = database.socios.find((s) => s.id === currentUser.socioId);
        const pagos = database.pagos.filter((p) => p.socioId === socio.id);

        let mensaje = "HISTORIAL DE PAGOS\n\n";
        pagos.forEach((pago) => {
            mensaje += `Fecha: ${formatDate(pago.fecha)}\n`;
            mensaje += `Monto: ${formatCurrency(pago.monto)}\n`;
            mensaje += `Método: ${pago.metodoPago}\n`;
            mensaje += `Concepto: ${pago.concepto}\n\n`;
        });

        alert(mensaje);
    }
}

// ============================================
// MÓDULO TURNOS

function initTurnosModule() {
    document.getElementById('filterDia').addEventListener('change', updateClasesDisponibles);
    document.getElementById('filterActividad').addEventListener('change', updateClasesDisponibles);
    
    if (currentUser.rol === 'Recepcionista') {
        agregarSelectorSocioEnTurnos();
    }
    
    updateTurnosModule();
}

function agregarSelectorSocioEnTurnos() {
    const turnosContainer = document.querySelector('#turnosModule .turnos-container');

    const selectorHTML = `
        <div class="card selector-socio-turnos">
            <h3 class="card-title">
                <i class="fas fa-user-check"></i> Seleccionar Socio
            </h3>
            <div class="form-group">
                <label>Buscar Socio por DNI o Nombre *</label>
                <input 
                    type="text" 
                    id="buscarSocioTurno" 
                    class="form-control" 
                    placeholder="Ingrese DNI o nombre del socio..."
                />
            </div>
            <div class="form-group">
                <label>Socio Seleccionado</label>
                <select id="socioSeleccionadoTurno" class="form-control">
                    <option value="">-- Seleccione un socio de la lista --</option>
                </select>
            </div>
            <div id="infoSocioSeleccionado" style="display: none;" class="info-socio-turno">
                <!-- Info del socio -->
            </div>
        </div>
    `;

    turnosContainer.insertAdjacentHTML('afterbegin', selectorHTML);

    document.getElementById('buscarSocioTurno').addEventListener('input', buscarSocioParaTurno);
    document.getElementById('socioSeleccionadoTurno').addEventListener('change', mostrarInfoSocioTurno);
}


async function buscarSocioParaTurno() {
    const busqueda = document.getElementById('buscarSocioTurno').value.toLowerCase().trim();
    const select = document.getElementById('socioSeleccionadoTurno');

    if (busqueda.length < 2) {
        select.innerHTML = '<option value="">-- Ninguno --</option>';
        document.getElementById('infoSocioSeleccionado').style.display = 'none';
        return;
    }

    try {
        // Buscar por DNI exacto primero
        let response = await apiRequest(`socios.php?dni=${busqueda}`, {
            method: 'GET'
        });

        let socios = [];
        
        if (response.success) {
            socios = [response.data];
        } else {
            // Si no encuentra por DNI, buscar por nombre
            const allResponse = await apiRequest('socios.php?action=all', {
                method: 'GET'
            });
            
            if (allResponse.success) {
                socios = allResponse.data.filter(s => 
                    s.nombre.toLowerCase().includes(busqueda) ||
                    s.dni.includes(busqueda)
                );
            }
        }

        if (socios.length > 0) {
            select.innerHTML = '<option value="">-- Seleccionar --</option>' +
                socios.map(s => 
                    `<option value="${s.id}">${s.nombre} - DNI: ${s.dni} (${s.estado})</option>`
                ).join('');
        } else {
            select.innerHTML = '<option value="">-- No se encontraron resultados --</option>';
        }
    } catch (error) {
        console.error('Error:', error);
        select.innerHTML = '<option value="">-- Error al buscar --</option>';
    }
}

async function mostrarInfoSocioTurno() {
    const socioId = parseInt(document.getElementById('socioSeleccionadoTurno').value);
    const infoDiv = document.getElementById('infoSocioSeleccionado');

    if (!socioId) {
        infoDiv.style.display = 'none';
        updateMisTurnos();
        return;
    }

    try {
        const response = await apiRequest(`socios.php?id=${socioId}`, {
            method: 'GET'
        });

        if (!response.success) {
            infoDiv.style.display = 'none';
            return;
        }

        const socio = response.data;
        const estadoClass = socio.estado === 'Activo' ? 'badge-active' : 'badge-moroso';

        infoDiv.innerHTML = `
            <div class="socio-info-header">
                <i class="fas fa-user-circle"></i>
                <div>
                    <strong>${socio.nombre}</strong>
                    <span class="badge ${estadoClass}">${socio.estado}</span>
                </div>
            </div>
            <div class="socio-info-detalles">
                <div><i class="fas fa-id-card"></i> DNI: ${socio.dni}</div>
                <div><i class="fas fa-calendar-alt"></i> Plan: ${socio.plan}</div>
                <div><i class="fas fa-clock"></i> Vence: ${formatDate(socio.vencimiento)}</div>
            </div>
        `;
        infoDiv.style.display = 'block';
        
        // Actualizar turnos del socio seleccionado
        updateMisTurnos();
    } catch (error) {
        console.error('Error:', error);
        infoDiv.style.display = 'none';
    }
}

function updateTurnosModule() {
    updateClasesDisponibles();
    updateMisTurnos();
}

async function updateClasesDisponibles() {
    const filterDia = document.getElementById('filterDia').value;
    const filterActividad = document.getElementById('filterActividad').value;
    const container = document.getElementById('clasesDisponibles');

    try {
        const response = await apiRequest('clases.php?action=all', {
            method: 'GET'
        });

        if (!response.success) {
            container.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Error al cargar clases</p>';
            return;
        }

        let clasesFiltered = response.data;

        if (filterDia) {
            clasesFiltered = clasesFiltered.filter(c => c.dia === filterDia);
        }

        if (filterActividad) {
            clasesFiltered = clasesFiltered.filter(c => c.nombre === filterActividad);
        }

        if (clasesFiltered.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">No hay clases disponibles con estos filtros</p>';
            return;
        }

        container.innerHTML = clasesFiltered.map(clase => {
            const cuposDisponibles = clase.cupos_total - clase.cupos_ocupados;
            const porcentaje = (clase.cupos_ocupados / clase.cupos_total) * 100;

            let cuposClass = 'cupos-disponible';
            let cuposText = `${cuposDisponibles} cupos disponibles`;
            let btnDisabled = false;

            if (cuposDisponibles === 0) {
                cuposClass = 'cupos-lleno';
                cuposText = 'Completo';
                btnDisabled = true;
            } else if (porcentaje >= 80) {
                cuposClass = 'cupos-limitado';
                cuposText = `Solo ${cuposDisponibles} cupos`;
            }

            return `
                <div class="clase-card">
                    <div class="clase-info">
                        <h4>${clase.nombre}</h4>
                        <div class="clase-detalles">
                            <span><i class="fas fa-calendar"></i> ${clase.dia}</span>
                            <span><i class="fas fa-clock"></i> ${clase.hora}</span>
                            <span><i class="fas fa-user"></i> ${clase.instructor}</span>
                            <span><i class="fas fa-hourglass-half"></i> ${clase.duracion} min</span>
                        </div>
                        <span class="cupos-badge ${cuposClass}">${cuposText}</span>
                    </div>
                    <button 
                        class="btn-reservar" 
                        onclick="reservarClase(${clase.id})"
                        ${btnDisabled ? 'disabled' : ''}
                    >
                        Reservar
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Error al cargar clases</p>';
    }
}

async function updateMisTurnos() {
    const container = document.getElementById('misTurnosReservados');
    let socioId;

    if (currentUser.rol === 'Recepcionista') {
        socioId = parseInt(document.getElementById('socioSeleccionadoTurno')?.value);
        if (!socioId) {
            container.innerHTML = `
                <div class="sin-turnos">
                    <i class="fas fa-info-circle"></i>
                    <p>Selecciona un socio para ver sus turnos</p>
                </div>
            `;
            return;
        }
    } else {
        socioId = currentUser.socioId;
    }

    try {
        const response = await apiRequest(`clases.php?action=mis_turnos&socio_id=${socioId}`, {
            method: 'GET'
        });

        if (!response.success || response.data.length === 0) {
            container.innerHTML = `
                <div class="sin-turnos">
                    <i class="fas fa-calendar-times"></i>
                    <p>No hay turnos reservados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = response.data.map(turno => `
            <div class="turno-item">
                ${currentUser.rol === 'Recepcionista' ? `
                    <div class="turno-socio-info">
                        <i class="fas fa-user"></i>
                        <strong>${turno.nombre}</strong>
                    </div>
                ` : ''}
                <h4>${turno.nombre}</h4>
                <p><i class="fas fa-calendar"></i> ${turno.dia} - ${formatDate(turno.fecha)}</p>
                <p><i class="fas fa-clock"></i> ${turno.hora} (${turno.duracion} min)</p>
                <p><i class="fas fa-user"></i> ${turno.instructor}</p>
                <div class="turno-actions">
                    <button class="btn-modificar-turno" onclick="modificarTurno(${turno.id})">
                        <i class="fas fa-edit"></i> Modificar
                    </button>
                    <button class="btn-cancelar" onclick="cancelarTurno(${turno.id})">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Error al cargar turnos</p>';
    }
}

async function reservarClase(claseId) {
    try {
        // Obtener información de la clase
        const claseResponse = await apiRequest('clases.php?action=all', {
            method: 'GET'
        });

        if (!claseResponse.success) {
            alert('Error al cargar clase');
            return;
        }

        const clase = claseResponse.data.find(c => c.id == claseId);
        if (!clase) {
            alert('Clase no encontrada');
            return;
        }

        let socioId;

        // Si es recepcionista, usar el socio seleccionado
        if (currentUser.rol === 'Recepcionista') {
            socioId = parseInt(document.getElementById('socioSeleccionadoTurno').value);

            if (!socioId) {
                alert('⚠️ Debes seleccionar un socio primero');
                return;
            }

            // Verificar estado del socio
            const socioResponse = await apiRequest(`socios.php?id=${socioId}`, {
                method: 'GET'
            });

            if (socioResponse.success && socioResponse.data.estado !== 'Activo') {
                alert('⚠️ El socio no tiene un plan activo.\n\nNo se puede reservar turno para socios con cuota vencida.');
                return;
            }
        } else {
            // Si es socio, usar su propio ID
            socioId = currentUser.socioId;
        }

        // Calcular próxima fecha de la clase
        const fecha = getNextClassDate(clase.dia);

        // Reservar turno
        const response = await apiRequest('clases.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'reservar',
                socio_id: socioId,
                clase_id: claseId,
                fecha: fecha
            })
        });

        if (response.success) {
            alert('✅ ' + response.message);
            updateTurnosModule();
        } else {
            alert('❌ ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al reservar turno');
    }
}

async function cancelarTurno(turnoId) {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;

    try {
        const response = await apiRequest(`clases.php?id=${turnoId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            alert('✅ ' + response.message);
            updateTurnosModule();
        } else {
            alert('❌ ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cancelar turno');
    }
}

function modificarTurno(turnoId) {
    const turno = database.turnos.find((t) => t.id === turnoId);
    if (!turno) return;

    const claseActual = database.clases.find((c) => c.id === turno.claseId);
    const socio = database.socios.find((s) => s.id === turno.socioId);

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalModificarTurno";
    modal.style.display = "flex";

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalModificarTurno()"></div>
        <div class="modal-content modal-modificar-turno">
            <button class="modal-close" onclick="cerrarModalModificarTurno()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-socio">
                <i class="fas fa-edit"></i>
                <h3>Modificar Turno</h3>
            </div>

            <div class="modal-body-socio">
                <div class="turno-actual-info">
                    <h4><i class="fas fa-info-circle"></i> Turno Actual</h4>
                    <div class="info-box">
                        <div><strong>Socio:</strong> ${socio.nombre}</div>
                        <div><strong>Clase:</strong> ${claseActual.nombre}</div>
                        <div><strong>Día:</strong> ${claseActual.dia}</div>
                        <div><strong>Hora:</strong> ${claseActual.hora}</div>
                    </div>
                </div>

                <form id="formModificarTurno">
                    <div class="form-group">
                        <label>Seleccionar Nueva Clase *</label>
                        <select id="nuevaClaseTurno" class="form-control" required>
                            <option value="">-- Seleccionar --</option>
                            ${database.clases
                                .map((c) => {
                                    const disponible =
                                        c.cuposTotal - c.cuposOcupados > 0;
                                    return `<option value="${c.id}" ${!disponible ? "disabled" : ""}>
                                    ${c.nombre} - ${c.dia} ${c.hora} 
                                    ${!disponible ? "(Sin cupos)" : `(${c.cuposTotal - c.cuposOcupados} cupos)`}
                                </option>`;
                                })
                                .join("")}
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="cerrarModalModificarTurno()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-check"></i> Confirmar Cambio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("formModificarTurno")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            confirmarModificacionTurno(turnoId);
        });
}

function cerrarModalModificarTurno() {
    const modal = document.getElementById("modalModificarTurno");
    if (modal) modal.remove();
}

function confirmarModificacionTurno(turnoId) {
    const turno = database.turnos.find((t) => t.id === turnoId);
    const nuevaClaseId = parseInt(
        document.getElementById("nuevaClaseTurno").value,
    );

    if (!nuevaClaseId) {
        alert("⚠️ Debes seleccionar una nueva clase");
        return;
    }

    const claseAnterior = database.clases.find((c) => c.id === turno.claseId);
    const claseNueva = database.clases.find((c) => c.id === nuevaClaseId);

    // Liberar cupo de la clase anterior
    claseAnterior.cuposOcupados -= 1;

    // Ocupar cupo de la clase nueva
    claseNueva.cuposOcupados += 1;

    // Actualizar turno
    turno.claseId = nuevaClaseId;
    turno.fecha = getNextClassDate(claseNueva.dia);

    alert(
        `✅ Turno modificado exitosamente\n\nNueva clase: ${claseNueva.nombre}\nDía: ${claseNueva.dia}\nHora: ${claseNueva.hora}`,
    );

    cerrarModalModificarTurno();
    updateTurnosModule();
}

function getNextClassDate(dia) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date();
    const targetDay = dias.indexOf(dia);
    const currentDay = today.getDay();

    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);

    return nextDate.toISOString().split('T')[0];
}

// ============================================
// MÓDULO PERFIL

function initPerfilModule() {
    document
        .getElementById("formDatosPersonales")
        .addEventListener("submit", guardarDatosPersonales);
    document
        .getElementById("formEmergencia")
        .addEventListener("submit", guardarContactoEmergencia);
    document
        .getElementById("formMedico")
        .addEventListener("submit", guardarInformacionMedica);
    document
        .getElementById("formCambiarPassword")
        .addEventListener("submit", cambiarPassword);

    updatePerfilModule();
}

function updatePerfilModule() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    if (!socio) return;

    document.getElementById("perfilNombreCompleto").textContent = socio.nombre;
    document.getElementById("perfilEmail").textContent = socio.email;
    document.getElementById("perfilMiembroDesde").textContent = formatDate(
        socio.fechaAlta,
    );
    document.getElementById("perfilEstado").textContent = socio.estado;
    document.getElementById("perfilPlan").textContent = socio.plan;

    document.getElementById("editNombre").value = socio.nombre;
    document.getElementById("editDni").value = socio.dni;
    document.getElementById("editEmail").value = socio.email;
    document.getElementById("editTelefono").value = socio.telefono;
    document.getElementById("editFechaNacimiento").value =
        socio.fechaNacimiento || "";
    document.getElementById("editGenero").value = socio.genero || "";

    if (socio.contactoEmergencia) {
        document.getElementById("emergenciaNombre").value =
            socio.contactoEmergencia.nombre || "";
        document.getElementById("emergenciaRelacion").value =
            socio.contactoEmergencia.relacion || "";
        document.getElementById("emergenciaTelefono").value =
            socio.contactoEmergencia.telefono || "";
    }

    if (socio.informacionMedica) {
        document.getElementById("grupoSanguineo").value =
            socio.informacionMedica.grupoSanguineo || "";
        document.getElementById("alergias").value =
            socio.informacionMedica.alergias || "";
        document.getElementById("lesiones").value =
            socio.informacionMedica.lesiones || "";
    }
}

function guardarDatosPersonales(e) {
    e.preventDefault();

    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    if (!socio) return;

    socio.nombre = document.getElementById("editNombre").value;
    socio.email = document.getElementById("editEmail").value;
    socio.telefono = document.getElementById("editTelefono").value;
    socio.fechaNacimiento = document.getElementById(
        "editFechaNacimiento",
    ).value;
    socio.genero = document.getElementById("editGenero").value;

    currentUser.nombre = socio.nombre;
    database.usuarios.find((u) => u.id === currentUser.id).nombre =
        socio.nombre;

    alert("Datos personales actualizados correctamente");
    updatePerfilModule();
    document.getElementById("welcomeText").textContent =
        `Bienvenido, ${currentUser.nombre}`;
}

function guardarContactoEmergencia(e) {
    e.preventDefault();

    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    if (!socio) return;

    socio.contactoEmergencia = {
        nombre: document.getElementById("emergenciaNombre").value,
        relacion: document.getElementById("emergenciaRelacion").value,
        telefono: document.getElementById("emergenciaTelefono").value,
    };

    alert("Contacto de emergencia guardado correctamente");
}

function guardarInformacionMedica(e) {
    e.preventDefault();

    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    if (!socio) return;

    socio.informacionMedica = {
        grupoSanguineo: document.getElementById("grupoSanguineo").value,
        alergias: document.getElementById("alergias").value,
        lesiones: document.getElementById("lesiones").value,
    };

    alert("Información médica guardada correctamente");
}

function cambiarPassword(e) {
    e.preventDefault();

    const actual = document.getElementById("passwordActual").value;
    const nueva = document.getElementById("passwordNueva").value;
    const confirmar = document.getElementById("passwordConfirmar").value;

    const usuario = database.usuarios.find((u) => u.id === currentUser.id);

    if (usuario.password !== actual) {
        alert("La contraseña actual es incorrecta");
        return;
    }

    if (nueva !== confirmar) {
        alert("Las contraseñas no coinciden");
        return;
    }

    if (nueva.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    usuario.password = nueva;

    alert("Contraseña cambiada correctamente");
    document.getElementById("passwordActual").value = "";
    document.getElementById("passwordNueva").value = "";
    document.getElementById("passwordConfirmar").value = "";
}

function cambiarFoto() {
    alert(
        "Funcionalidad de cambio de foto. Aquí se implementaría la carga de imagen.",
    );
}

// ============================================
// MÓDULO CLASES E INSTRUCTORES

let claseSeleccionadaId = null;

function initClasesInstructoresModule() {
    updateClasesTable();
    updateInstructoresGrid();
}

async function updateClasesTable() {
    const tbody = document.getElementById('tablaClasesGym');

    try {
        const response = await apiRequest('clases.php?action=gym', {
            method: 'GET'
        });

        if (response.success && response.data.length > 0) {
            tbody.innerHTML = response.data.map(clase => {
                const instructor = clase.instructor_nombre || null;

                return `
                    <tr>
                        <td>
                            <div>
                                <div style="font-weight: 500; color: var(--text-dark);">${clase.nombre}</div>
                            </div>
                        </td>
                        <td>
                            <span class="badge-tipo badge-tipo-${clase.tipo.toLowerCase().replace(/\s/g, '')}">${clase.tipo}</span>
                        </td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-calendar-alt" style="color: var(--text-light); font-size: 12px;"></i>
                                ${clase.horario}
                            </div>
                        </td>
                        <td>${clase.duracion}</td>
                        <td>
                            <span class="cupo-badge-instructor">
                                <i class="fas fa-users"></i> ${clase.cupo_maximo}
                            </span>
                        </td>
                        <td>
                            ${instructor ? 
                                `<div class="instructor-assigned">
                                    <i class="fas fa-user-check"></i>
                                    <span>${instructor}</span>
                                </div>` : 
                                `<span class="no-instructor">Sin asignar</span>`
                            }
                        </td>
                        <td>
                            ${currentUser.rol === 'Administrador' ? `
                                <button class="btn-asignar-instructor" onclick="abrirModalAsignar(${clase.id})">
                                    <i class="fas fa-user-plus"></i>
                                    ${instructor ? 'Reasignar' : 'Asignar'}
                                </button>
                            ` : '<span style="color: var(--text-light); font-size: 13px;">-</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--text-light);">No hay clases registradas</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar clases:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--danger-color);">Error al cargar datos</td></tr>';
    }
}

async function updateInstructoresGrid() {
    const grid = document.getElementById('instructoresGrid');

    try {
        const response = await apiRequest('instructores.php?action=all', {
            method: 'GET'
        });

        if (response.success && response.data.length > 0) {
            grid.innerHTML = response.data.map(instructor => `
                <div class="instructor-card">
                    <div class="instructor-avatar-custom">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="instructor-info-custom">
                        <h4>${instructor.nombre}</h4>
                        <p class="instructor-especialidad-custom">
                            <i class="fas fa-star"></i> ${instructor.especialidad}
                        </p>
                        <p class="instructor-contacto-custom">
                            <i class="fas fa-envelope"></i> ${instructor.email}
                        </p>
                        <p class="instructor-contacto-custom">
                            <i class="fas fa-phone"></i> ${instructor.telefono}
                        </p>
                    </div>
                    <div class="instructor-stats-custom">
                        <div class="stat-item-instructor">
                            <span class="stat-number-instructor">${instructor.clases_asignadas}</span>
                            <span class="stat-label-instructor">Clases</span>
                        </div>
                        <div class="stat-status-instructor ${instructor.activo == 1 ? 'status-active-instructor' : 'status-inactive-instructor'}">
                            <i class="fas fa-circle"></i> ${instructor.activo == 1 ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay instructores registrados</p>';
        }
    } catch (error) {
        console.error('Error al cargar instructores:', error);
        grid.innerHTML = '<p class="text-center" style="color: var(--danger-color);">Error al cargar instructores</p>';
    }
}

async function abrirModalAsignar(claseId) {
    if (!tienePermiso('clases', 'asignarInstructor')) {
        mostrarErrorPermisos();
        return;
    }

    claseSeleccionadaId = claseId;

    try {
        // Cargar clase
        const claseResponse = await apiRequest('clases.php?action=gym', {
            method: 'GET'
        });

        if (!claseResponse.success) {
            alert('Error al cargar clase');
            return;
        }

        const clase = claseResponse.data.find(c => c.id == claseId);
        if (!clase) {
            alert('Clase no encontrada');
            return;
        }

        document.getElementById('claseSeleccionadaNombre').textContent = clase.nombre;
        document.getElementById('claseSeleccionadaHorario').textContent = clase.horario;
        document.getElementById('claseSeleccionadaTipo').textContent = clase.tipo;

        // Cargar instructores
        const instResponse = await apiRequest('instructores.php?action=all', {
            method: 'GET'
        });

        if (instResponse.success) {
            const select = document.getElementById('instructorSelect');
            select.innerHTML = '<option value="">-- Sin instructor asignado --</option>' +
                instResponse.data
                    .filter(i => i.activo == 1)
                    .map(i => `
                        <option value="${i.id}" ${clase.instructor_id == i.id ? 'selected' : ''}>
                            ${i.nombre} - ${i.especialidad}
                        </option>
                    `).join('');

            select.onchange = mostrarPreviewInstructor;

            if (clase.instructor_id) {
                mostrarPreviewInstructor();
            }
        }

        document.getElementById('asignarInstructorModal').style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al abrir modal de asignación');
    }
}

async function mostrarPreviewInstructor() {
    const instructorId = parseInt(document.getElementById('instructorSelect').value);
    const preview = document.getElementById('instructorPreview');

    if (!instructorId) {
        preview.style.display = 'none';
        return;
    }

    try {
        const response = await apiRequest(`instructores.php?id=${instructorId}`, {
            method: 'GET'
        });

        if (!response.success) {
            preview.style.display = 'none';
            return;
        }

        const instructor = response.data;
        
        preview.innerHTML = `
            <div class="preview-header-instructor">
                <i class="fas fa-info-circle"></i>
                <span>Vista previa del instructor</span>
            </div>
            <div class="preview-content-instructor">
                <div class="preview-avatar-instructor">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="preview-details-instructor">
                    <h4>${instructor.nombre}</h4>
                    <p><strong>Especialidad:</strong> ${instructor.especialidad}</p>
                    <p><strong>Email:</strong> ${instructor.email}</p>
                    <p><strong>Clases actuales:</strong> ${instructor.clases_asignadas}</p>
                </div>
            </div>
        `;

        preview.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        preview.style.display = 'none';
    }
}

async function confirmarAsignacion() {
    if (!claseSeleccionadaId) return;

    const instructorId = document.getElementById('instructorSelect').value;

    try {
        const response = await apiRequest('clases.php', {
            method: 'PUT',
            body: JSON.stringify({
                action: 'asignar_instructor',
                clase_id: claseSeleccionadaId,
                instructor_id: instructorId || null
            })
        });

        if (response.success) {
            alert('✅ ' + response.message);
            updateClasesTable();
            updateInstructoresGrid();
            cerrarModalAsignar();
        } else {
            alert('❌ Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al asignar instructor');
    }
}

function cerrarModalAsignar() {
    document.getElementById('asignarInstructorModal').style.display = 'none';
    document.getElementById('instructorPreview').style.display = 'none';
    claseSeleccionadaId = null;
}

// ============================================
// TICKETS

async function generarTicket(pagoId) {
    try {
        const response = await apiRequest(`pagos.php?id=${pagoId}`, {
            method: 'GET'
        });

        if (!response.success) {
            alert('❌ Error al generar el ticket: ' + (response.message || 'No se pudo obtener la información'));
            return;
        }

        const pago = response.data;
        
        // Validar que tengamos los datos necesarios
        if (!pago || !pago.id) {
            alert('❌ Error: Datos del pago incompletos');
            console.error('Datos del pago:', pago);
            return;
        }

        const ticketContent = document.getElementById('ticketContent');

        ticketContent.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-logo">
                    <i class="fas fa-dumbbell"></i>
                </div>
                <h2>The Best Gym</h2>
                <p>Sistema de Gestión</p>
                <div class="ticket-divider"></div>
            </div>

            <div class="ticket-body">
                <div class="ticket-section">
                    <h3>Comprobante de Pago</h3>
                    <p class="ticket-number">N° ${String(pago.id).padStart(6, '0')}</p>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <div class="ticket-row">
                        <span class="ticket-label">Fecha:</span>
                        <span class="ticket-value">${formatDate(pago.fecha)}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Hora:</span>
                        <span class="ticket-value">${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <h4>Datos del Socio</h4>
                    <div class="ticket-row">
                        <span class="ticket-label">Nombre:</span>
                        <span class="ticket-value">${pago.socio_nombre || 'N/A'}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">DNI:</span>
                        <span class="ticket-value">${pago.dni || 'N/A'}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Plan:</span>
                        <span class="ticket-value">${pago.plan || 'N/A'}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-section">
                    <h4>Detalle del Pago</h4>
                    <div class="ticket-row">
                        <span class="ticket-label">Concepto:</span>
                        <span class="ticket-value">${pago.concepto || 'N/A'}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">Método:</span>
                        <span class="ticket-value">${pago.metodo_pago || 'N/A'}</span>
                    </div>
                </div>

                <div class="ticket-divider"></div>

                <div class="ticket-total">
                    <span>TOTAL ABONADO</span>
                    <span class="ticket-amount">${formatCurrency(pago.monto)}</span>
                </div>

                <div class="ticket-footer">
                    <p>¡Gracias por tu pago!</p>
                    <p class="ticket-small">Este comprobante es válido como constancia de pago</p>
                </div>
            </div>
        `;

        document.getElementById('ticketModal').style.display = 'flex';
    } catch (error) {
        console.error('Error al generar ticket:', error);
        alert('❌ Error al generar el ticket: ' + error.message);
    }
}

function cerrarTicket() {
    document.getElementById("ticketModal").style.display = "none";
}

function imprimirTicket() {
    window.print();
}

function descargarTicket() {
    alert(
        'Funcionalidad de descarga PDF próximamente.\nPor ahora usa "Imprimir" y selecciona "Guardar como PDF"',
    );
}

// ============================================
// FUNCIONES AUXILIARES

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "flex";
}

// ============================================
// INICIALIZACIÓN

document.addEventListener("DOMContentLoaded", () => {
    initLogin();
});
// ============================================
// MÓDULO DE REPORTES
// ============================================

function initReportesModule() {
    // Listeners para cambios en filtros de período
    document
        .getElementById("filtroPeriodoPagos")
        .addEventListener("change", function () {
            const valor = this.value;
            const rangoFechas = document.getElementById("rangoFechasPagos");
            const rangoFechas2 = document.getElementById("rangoFechasPagos2");

            if (valor === "personalizado") {
                rangoFechas.style.display = "block";
                rangoFechas2.style.display = "block";
            } else {
                rangoFechas.style.display = "none";
                rangoFechas2.style.display = "none";
            }
        });

    document
        .getElementById("filtroPeriodoAsistencias")
        .addEventListener("change", function () {
            const valor = this.value;
            const rangoFechas = document.getElementById(
                "rangoFechasAsistencias",
            );
            const rangoFechas2 = document.getElementById(
                "rangoFechasAsistencias2",
            );

            if (valor === "personalizado") {
                rangoFechas.style.display = "block";
                rangoFechas2.style.display = "block";
            } else {
                rangoFechas.style.display = "none";
                rangoFechas2.style.display = "none";
            }
        });

    // Cargar reporte inicial
    aplicarFiltrosPagos();
}

function cambiarTipoReporte(tipo) {
    // Cambiar tabs activos
    document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));
    event.target.closest(".tab-btn").classList.add("active");

    // Mostrar/ocultar secciones
    if (tipo === "pagos") {
        document.getElementById("reportePagos").style.display = "block";
        document.getElementById("reporteAsistencias").style.display = "none";
        aplicarFiltrosPagos();
    } else {
        document.getElementById("reportePagos").style.display = "none";
        document.getElementById("reporteAsistencias").style.display = "block";
        aplicarFiltrosAsistencias();
    }
}

// ============================================
// REPORTES DE PAGOS
// ============================================

function aplicarFiltrosPagos() {
    const periodo = document.getElementById("filtroPeriodoPagos").value;
    const plan = document.getElementById("filtroPlanPagos").value;
    const metodo = document.getElementById("filtroMetodoPagos").value;

    let fechaDesde, fechaHasta;
    const hoy = new Date();

    switch (periodo) {
        case "mes-actual":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaHasta = hoy;
            break;
        case "mes-anterior":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            break;
        case "trimestre":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
            fechaHasta = hoy;
            break;
        case "año":
            fechaDesde = new Date(hoy.getFullYear(), 0, 1);
            fechaHasta = hoy;
            break;
        case "personalizado":
            fechaDesde = new Date(
                document.getElementById("fechaDesdePagos").value + "T00:00:00",
            );
            fechaHasta = new Date(
                document.getElementById("fechaHastaPagos").value + "T23:59:59",
            );
            break;
    }

    // Filtrar pagos
    let pagosFiltrados = database.pagos.filter((pago) => {
        const fechaPago = new Date(pago.fecha + "T00:00:00");
        const socio = database.socios.find((s) => s.id === pago.socioId);

        const cumpleFecha = fechaPago >= fechaDesde && fechaPago <= fechaHasta;
        const cumplePlan = plan === "todos" || (socio && socio.plan === plan);
        const cumpleMetodo = metodo === "todos" || pago.metodoPago === metodo;

        return cumpleFecha && cumplePlan && cumpleMetodo;
    });

    // Actualizar estadísticas
    const totalIngresos = pagosFiltrados.reduce((sum, p) => sum + p.monto, 0);
    const cantidadPagos = pagosFiltrados.length;
    const promedio = cantidadPagos > 0 ? totalIngresos / cantidadPagos : 0;

    document.getElementById("totalIngresosPagos").textContent =
        formatCurrency(totalIngresos);
    document.getElementById("cantidadPagos").textContent = cantidadPagos;
    document.getElementById("promedioPagos").textContent =
        formatCurrency(promedio);

    // Actualizar tabla
    const tbody = document.getElementById("tablaReportePagos");
    tbody.innerHTML =
        pagosFiltrados.length > 0
            ? pagosFiltrados
                  .map((pago) => {
                      const socio = database.socios.find(
                          (s) => s.id === pago.socioId,
                      );
                      return `
                <tr>
                    <td>${formatDate(pago.fecha)}</td>
                    <td>${socio ? socio.nombre : "-"}</td>
                    <td>${pago.concepto}</td>
                    <td>${socio ? socio.plan : "-"}</td>
                    <td>${pago.metodoPago}</td>
                    <td style="font-weight: 600; color: var(--success-color);">${formatCurrency(pago.monto)}</td>
                </tr>
            `;
                  })
                  .join("")
            : '<tr><td colspan="6" class="text-center" style="color: var(--text-light); padding: 20px;">No hay pagos en este período</td></tr>';
}

function exportarPagosExcel() {
    alert(
        "📊 Exportando a Excel...\n\nEsta funcionalidad requiere una librería adicional.\nPor ahora se descargará como CSV.",
    );
    exportarPagosCSV();
}

function exportarPagosCSV() {
    const periodo = document.getElementById("filtroPeriodoPagos").value;
    const pagos = obtenerPagosFiltrados();

    let csv = "Fecha,Socio,DNI,Concepto,Plan,Método de Pago,Monto\n";

    pagos.forEach((pago) => {
        const socio = database.socios.find((s) => s.id === pago.socioId);
        csv += `${pago.fecha},${socio?.nombre || "-"},${socio?.dni || "-"},${pago.concepto},${socio?.plan || "-"},${pago.metodoPago},${pago.monto}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_pagos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarPagosPDF() {
    alert(
        "📄 Funcionalidad de exportación a PDF\n\nEsta característica requiere una librería adicional (jsPDF).\nActualmente puedes usar la opción de imprimir del navegador.",
    );
    window.print();
}

function obtenerPagosFiltrados() {
    const periodo = document.getElementById("filtroPeriodoPagos").value;
    const plan = document.getElementById("filtroPlanPagos").value;
    const metodo = document.getElementById("filtroMetodoPagos").value;

    let fechaDesde, fechaHasta;
    const hoy = new Date();

    switch (periodo) {
        case "mes-actual":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaHasta = hoy;
            break;
        case "mes-anterior":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            break;
        case "trimestre":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
            fechaHasta = hoy;
            break;
        case "año":
            fechaDesde = new Date(hoy.getFullYear(), 0, 1);
            fechaHasta = hoy;
            break;
        case "personalizado":
            fechaDesde = new Date(
                document.getElementById("fechaDesdePagos").value + "T00:00:00",
            );
            fechaHasta = new Date(
                document.getElementById("fechaHastaPagos").value + "T23:59:59",
            );
            break;
    }

    return database.pagos.filter((pago) => {
        const fechaPago = new Date(pago.fecha + "T00:00:00");
        const socio = database.socios.find((s) => s.id === pago.socioId);

        const cumpleFecha = fechaPago >= fechaDesde && fechaPago <= fechaHasta;
        const cumplePlan = plan === "todos" || (socio && socio.plan === plan);
        const cumpleMetodo = metodo === "todos" || pago.metodoPago === metodo;

        return cumpleFecha && cumplePlan && cumpleMetodo;
    });
}

// ============================================
// REPORTES DE ASISTENCIAS
// ============================================

function aplicarFiltrosAsistencias() {
    const periodo = document.getElementById("filtroPeriodoAsistencias").value;

    let fechaDesde, fechaHasta;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (periodo) {
        case "hoy":
            fechaDesde = hoy;
            fechaHasta = hoy;
            break;
        case "semana":
            fechaDesde = new Date(hoy);
            fechaDesde.setDate(hoy.getDate() - hoy.getDay());
            fechaHasta = hoy;
            break;
        case "mes-actual":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaHasta = hoy;
            break;
        case "mes-anterior":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            break;
        case "personalizado":
            fechaDesde = new Date(
                document.getElementById("fechaDesdeAsistencias").value +
                    "T00:00:00",
            );
            fechaHasta = new Date(
                document.getElementById("fechaHastaAsistencias").value +
                    "T23:59:59",
            );
            break;
    }

    // Filtrar asistencias
    let asistenciasFiltradas = database.asistencias.filter((asist) => {
        const fechaAsist = new Date(asist.fecha + "T00:00:00");
        return fechaAsist >= fechaDesde && fechaAsist <= fechaHasta;
    });

    // Calcular estadísticas
    const totalAsistencias = asistenciasFiltradas.length;
    const dias =
        Math.ceil((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24)) + 1;
    const promedioDiario = Math.round(totalAsistencias / dias);

    // Encontrar día con más asistencias
    const asistenciasPorDia = {};
    asistenciasFiltradas.forEach((a) => {
        asistenciasPorDia[a.fecha] = (asistenciasPorDia[a.fecha] || 0) + 1;
    });

    let diaMasAsistencias = "-";
    let maxAsistencias = 0;
    Object.entries(asistenciasPorDia).forEach(([fecha, cant]) => {
        if (cant > maxAsistencias) {
            maxAsistencias = cant;
            diaMasAsistencias = `${formatDate(fecha)} (${cant})`;
        }
    });

    // Actualizar estadísticas
    document.getElementById("totalAsistencias").textContent = totalAsistencias;
    document.getElementById("promedioDiarioAsistencias").textContent =
        promedioDiario;
    document.getElementById("diaMasAsistencias").textContent =
        diaMasAsistencias;

    // Actualizar tabla
    const tbody = document.getElementById("tablaReporteAsistencias");
    tbody.innerHTML =
        asistenciasFiltradas.length > 0
            ? asistenciasFiltradas
                  .map((asist) => {
                      const socio = database.socios.find(
                          (s) => s.id === asist.socioId,
                      );
                      return `
                <tr>
                    <td>${formatDate(asist.fecha)}</td>
                    <td>${asist.hora}</td>
                    <td>${socio ? socio.nombre : "-"}</td>
                    <td>${socio ? socio.plan : "-"}</td>
                </tr>
            `;
                  })
                  .join("")
            : '<tr><td colspan="4" class="text-center" style="color: var(--text-light); padding: 20px;">No hay asistencias en este período</td></tr>';

    // Generar gráfico
    generarGraficoAsistencias(asistenciasPorDia);
}

function generarGraficoAsistencias(asistenciasPorDia) {
    const container = document.getElementById("graficoAsistencias");

    const fechas = Object.keys(asistenciasPorDia).sort();
    const maxValue = Math.max(...Object.values(asistenciasPorDia));

    if (fechas.length === 0) {
        container.innerHTML =
            '<p class="text-center" style="color: var(--text-light); padding: 40px;">No hay datos para mostrar</p>';
        return;
    }

    container.innerHTML = `
        <div class="grafico-barras">
            ${fechas
                .map((fecha) => {
                    const cantidad = asistenciasPorDia[fecha];
                    const altura = (cantidad / maxValue) * 100;
                    return `
                    <div class="barra-container">
                        <div class="barra-valor">${cantidad}</div>
                        <div class="barra" style="height: ${altura}%" title="${formatDate(fecha)}: ${cantidad} asistencias"></div>
                        <div class="barra-label">${new Date(fecha + "T00:00:00").getDate()}/${new Date(fecha + "T00:00:00").getMonth() + 1}</div>
                    </div>
                `;
                })
                .join("")}
        </div>
    `;
}

function exportarAsistenciasExcel() {
    alert(
        "📊 Exportando a Excel...\n\nEsta funcionalidad requiere una librería adicional.\nPor ahora se descargará como CSV.",
    );
    exportarAsistenciasCSV();
}

function exportarAsistenciasCSV() {
    const asistencias = obtenerAsistenciasFiltradas();

    let csv = "Fecha,Hora,Socio,DNI,Plan\n";

    asistencias.forEach((asist) => {
        const socio = database.socios.find((s) => s.id === asist.socioId);
        csv += `${asist.fecha},${asist.hora},${socio?.nombre || "-"},${socio?.dni || "-"},${socio?.plan || "-"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_asistencias_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarAsistenciasPDF() {
    alert(
        "📄 Funcionalidad de exportación a PDF\n\nEsta característica requiere una librería adicional (jsPDF).\nActualmente puedes usar la opción de imprimir del navegador.",
    );
    window.print();
}

function obtenerAsistenciasFiltradas() {
    const periodo = document.getElementById("filtroPeriodoAsistencias").value;

    let fechaDesde, fechaHasta;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (periodo) {
        case "hoy":
            fechaDesde = hoy;
            fechaHasta = hoy;
            break;
        case "semana":
            fechaDesde = new Date(hoy);
            fechaDesde.setDate(hoy.getDate() - hoy.getDay());
            fechaHasta = hoy;
            break;
        case "mes-actual":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            fechaHasta = hoy;
            break;
        case "mes-anterior":
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            break;
        case "personalizado":
            fechaDesde = new Date(
                document.getElementById("fechaDesdeAsistencias").value +
                    "T00:00:00",
            );
            fechaHasta = new Date(
                document.getElementById("fechaHastaAsistencias").value +
                    "T23:59:59",
            );
            break;
    }

    return database.asistencias.filter((asist) => {
        const fechaAsist = new Date(asist.fecha + "T00:00:00");
        return fechaAsist >= fechaDesde && fechaAsist <= fechaHasta;
    });
}
// ============================================
// SISTEMA DE NOTIFICACIONES
// ============================================

/**
 * Envía una notificación a un socio
 */
function enviarNotificacion(socioId, tipo, asunto, mensaje, canal = "email") {
    const socio = database.socios.find((s) => s.id === socioId);

    if (!socio) {
        console.error("Socio no encontrado");
        return false;
    }

    // Simular envío (en producción aquí iría la llamada a API de email/SMS)
    const exito = Math.random() > 0.1; // 90% de éxito

    const notificacion = {
        id: database.notificaciones.length + 1,
        socioId: socioId,
        tipo: tipo, // 'turno', 'clase', 'vencimiento', 'pago', 'general'
        canal: canal, // 'email', 'sms', 'ambos'
        asunto: asunto,
        mensaje: mensaje,
        fecha: new Date().toISOString(),
        envioPor: currentUser.id,
        estado: exito ? "enviado" : "fallido",
        intentos: 1,
    };

    database.notificaciones.push(notificacion);

    // Registrar en log
    const log = {
        id: database.logNotificaciones.length + 1,
        notificacionId: notificacion.id,
        fecha: new Date().toISOString(),
        estado: exito ? "exitoso" : "error",
        mensaje: exito
            ? `Notificación enviada a ${socio.nombre} (${canal})`
            : `Error al enviar notificación a ${socio.nombre}`,
        detalles: {
            socio: socio.nombre,
            email: socio.email,
            telefono: socio.telefono,
            canal: canal,
        },
    };

    database.logNotificaciones.push(log);

    return exito;
}

/**
 * Notificar sobre reserva de turno
 */
function notificarReservaTurno(socioId, claseId) {
    const socio = database.socios.find((s) => s.id === socioId);
    const clase = database.clases.find((c) => c.id === claseId);

    if (!socio || !clase) return false;

    const asunto = "Confirmación de Turno - The Best Gym";
    const mensaje =
        `Hola ${socio.nombre},\n\nTu turno ha sido confirmado:\n\n` +
        `Clase: ${clase.nombre}\n` +
        `Día: ${clase.dia}\n` +
        `Hora: ${clase.hora}\n` +
        `Instructor: ${clase.instructor}\n\n` +
        `Te esperamos!\n\nThe Best Gym`;

    return enviarNotificacion(socioId, "turno", asunto, mensaje, "email");
}

/**
 * Notificar cancelación de turno
 */
function notificarCancelacionTurno(socioId, claseId) {
    const socio = database.socios.find((s) => s.id === socioId);
    const clase = database.clases.find((c) => c.id === claseId);

    if (!socio || !clase) return false;

    const asunto = "Turno Cancelado - The Best Gym";
    const mensaje =
        `Hola ${socio.nombre},\n\nTu turno ha sido cancelado:\n\n` +
        `Clase: ${clase.nombre}\n` +
        `Día: ${clase.dia}\n` +
        `Hora: ${clase.hora}\n\n` +
        `Puedes reservar otro turno cuando desees.\n\nThe Best Gym`;

    return enviarNotificacion(socioId, "turno", asunto, mensaje, "email");
}

/**
 * Notificar cambio de clase
 */
function notificarCambioClase(claseId, cambios) {
    const clase = database.clasesGym.find((c) => c.id === claseId);
    if (!clase) return;

    // Encontrar todos los turnos de esta clase
    const turnosClase = database.turnos.filter(
        (t) => t.claseId === claseId && t.estado === "Confirmado",
    );

    turnosClase.forEach((turno) => {
        const socio = database.socios.find((s) => s.id === turno.socioId);
        if (!socio) return;

        const asunto = "Cambio en tu Clase - The Best Gym";
        const mensaje =
            `Hola ${socio.nombre},\n\nHay cambios en tu clase:\n\n` +
            `Clase: ${clase.nombre}\n` +
            `Cambios: ${cambios}\n\n` +
            `Disculpa las molestias.\n\nThe Best Gym`;

        enviarNotificacion(socio.id, "clase", asunto, mensaje, "email");
    });
}

/**
 * Notificar vencimiento próximo
 */
function notificarVencimientoProximo(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) return false;

    const fechaVenc = new Date(socio.vencimiento + "T00:00:00");
    const diasRestantes = Math.ceil(
        (fechaVenc - new Date()) / (1000 * 60 * 60 * 24),
    );

    const asunto = "Tu Plan está por Vencer - The Best Gym";
    const mensaje =
        `Hola ${socio.nombre},\n\nTu plan ${socio.plan} vence en ${diasRestantes} días.\n\n` +
        `Fecha de vencimiento: ${formatDate(socio.vencimiento)}\n\n` +
        `Renueva tu membresía para seguir disfrutando del gimnasio.\n\nThe Best Gym`;

    return enviarNotificacion(
        socio.id,
        "vencimiento",
        asunto,
        mensaje,
        "ambos",
    );
}

/**
 * Notificar pago registrado
 */
function notificarPagoRegistrado(pagoId) {
    const pago = database.pagos.find((p) => p.id === pagoId);
    if (!pago) return false;

    const socio = database.socios.find((s) => s.id === pago.socioId);
    if (!socio) return false;

    const asunto = "Pago Registrado - The Best Gym";
    const mensaje =
        `Hola ${socio.nombre},\n\nHemos registrado tu pago:\n\n` +
        `Monto: ${formatCurrency(pago.monto)}\n` +
        `Concepto: ${pago.concepto}\n` +
        `Método: ${pago.metodoPago}\n` +
        `Fecha: ${formatDate(pago.fecha)}\n\n` +
        `Gracias por tu pago!\n\nThe Best Gym`;

    return enviarNotificacion(socio.id, "pago", asunto, mensaje, "email");
}

/**
 * Panel de gestión de notificaciones
 */
function abrirPanelNotificaciones() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "modalNotificaciones";
    modal.style.display = "flex";

    modal.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalNotificaciones()"></div>
        <div class="modal-content modal-notificaciones">
            <button class="modal-close" onclick="cerrarModalNotificaciones()">
                <i class="fas fa-times"></i>
            </button>

            <div class="modal-header-notificaciones">
                <i class="fas fa-bell"></i>
                <h3>Gestión de Notificaciones</h3>
            </div>

            <div class="modal-body-notificaciones">
                <div class="notif-tabs">
                    <button class="notif-tab active" onclick="cambiarTabNotif('enviar')">
                        <i class="fas fa-paper-plane"></i> Enviar Notificación
                    </button>
                    <button class="notif-tab" onclick="cambiarTabNotif('historial')">
                        <i class="fas fa-history"></i> Historial
                    </button>
                    <button class="notif-tab" onclick="cambiarTabNotif('log')">
                        <i class="fas fa-list"></i> Log de Errores
                    </button>
                </div>

                <!-- Tab: Enviar Notificación -->
                <div id="tabEnviarNotif" class="notif-tab-content">
                    <form id="formEnviarNotif">
                        <div class="form-group">
                            <label>Destinatarios *</label>
                            <select id="notifDestinatario" class="form-control" required onchange="actualizarDestinatarios()">
                                <option value="">Seleccionar...</option>
                                <option value="todos">Todos los socios activos</option>
                                <option value="morosos">Socios morosos</option>
                                <option value="proximos-vencer">Próximos a vencer (7 días)</option>
                                <option value="individual">Socio individual</option>
                            </select>
                        </div>

                        <div class="form-group" id="selectSocioIndividual" style="display: none;">
                            <label>Seleccionar Socio *</label>
                            <select id="notifSocioId" class="form-control">
                                <option value="">Seleccionar...</option>
                                ${database.socios.map((s) => `<option value="${s.id}">${s.nombre} - ${s.dni}</option>`).join("")}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Canal de Envío *</label>
                            <select id="notifCanal" class="form-control" required>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="ambos">Ambos (Email + SMS)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Tipo de Notificación *</label>
                            <select id="notifTipo" class="form-control" required>
                                <option value="general">General</option>
                                <option value="vencimiento">Vencimiento</option>
                                <option value="clase">Cambio de Clase</option>
                                <option value="turno">Turno</option>
                                <option value="promocion">Promoción</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Asunto *</label>
                            <input type="text" id="notifAsunto" class="form-control" required 
                                   placeholder="Ej: Cambio de horario - Spinning" />
                        </div>

                        <div class="form-group">
                            <label>Mensaje *</label>
                            <textarea id="notifMensaje" class="form-control" rows="6" required 
                                      placeholder="Escribe el mensaje que recibirán los socios..."></textarea>
                            <small class="form-hint">
                                <i class="fas fa-info-circle"></i>
                                El mensaje se personalizará con el nombre de cada socio
                            </small>
                        </div>

                        <div id="previstaDestinatarios" class="prevista-dest">
                            <!-- Se llena dinámicamente -->
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="cerrarModalNotificaciones()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> Enviar Notificación
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Tab: Historial -->
                <div id="tabHistorialNotif" class="notif-tab-content" style="display: none;">
                    <div class="historial-stats">
                        <div class="stat-notif">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <strong>${database.notificaciones.filter((n) => n.estado === "enviado").length}</strong>
                                <span>Enviadas</span>
                            </div>
                        </div>
                        <div class="stat-notif">
                            <i class="fas fa-times-circle"></i>
                            <div>
                                <strong>${database.notificaciones.filter((n) => n.estado === "fallido").length}</strong>
                                <span>Fallidas</span>
                            </div>
                        </div>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Socio</th>
                                    <th>Tipo</th>
                                    <th>Canal</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    database.notificaciones
                                        .slice()
                                        .reverse()
                                        .map((n) => {
                                            const socio = database.socios.find(
                                                (s) => s.id === n.socioId,
                                            );
                                            return `
                                        <tr>
                                            <td>${new Date(n.fecha).toLocaleString("es-AR")}</td>
                                            <td>${socio ? socio.nombre : "-"}</td>
                                            <td><span class="badge-tipo-notif">${n.tipo}</span></td>
                                            <td>${n.canal}</td>
                                            <td>
                                                <span class="badge ${n.estado === "enviado" ? "badge-active" : "badge-moroso"}">
                                                    ${n.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                        })
                                        .join("") ||
                                    '<tr><td colspan="5" class="text-center">No hay notificaciones</td></tr>'
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Tab: Log -->
                <div id="tabLogNotif" class="notif-tab-content" style="display: none;">
                    <div class="log-container">
                        ${
                            database.logNotificaciones
                                .slice()
                                .reverse()
                                .map(
                                    (log) => `
                            <div class="log-item ${log.estado}">
                                <div class="log-icon">
                                    <i class="fas fa-${log.estado === "exitoso" ? "check-circle" : "exclamation-triangle"}"></i>
                                </div>
                                <div class="log-info">
                                    <div class="log-mensaje">${log.mensaje}</div>
                                    <div class="log-fecha">${new Date(log.fecha).toLocaleString("es-AR")}</div>
                                    ${
                                        log.detalles
                                            ? `
                                        <div class="log-detalles">
                                            Email: ${log.detalles.email || "-"} | 
                                            Tel: ${log.detalles.telefono || "-"} | 
                                            Canal: ${log.detalles.canal}
                                        </div>
                                    `
                                            : ""
                                    }
                                </div>
                            </div>
                        `,
                                )
                                .join("") ||
                            '<p class="text-center" style="padding: 40px; color: var(--text-light);">No hay registros</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listener para el formulario
    document
        .getElementById("formEnviarNotif")
        .addEventListener("submit", (e) => {
            e.preventDefault();
            enviarNotificacionMasiva();
        });
}

function cerrarModalNotificaciones() {
    const modal = document.getElementById("modalNotificaciones");
    if (modal) modal.remove();
}

function cambiarTabNotif(tab) {
    // Cambiar tabs activos
    document
        .querySelectorAll(".notif-tab")
        .forEach((btn) => btn.classList.remove("active"));
    event.target.closest(".notif-tab").classList.add("active");

    // Mostrar contenido
    document
        .querySelectorAll(".notif-tab-content")
        .forEach((content) => (content.style.display = "none"));

    if (tab === "enviar") {
        document.getElementById("tabEnviarNotif").style.display = "block";
    } else if (tab === "historial") {
        document.getElementById("tabHistorialNotif").style.display = "block";
    } else if (tab === "log") {
        document.getElementById("tabLogNotif").style.display = "block";
    }
}

function actualizarDestinatarios() {
    const tipo = document.getElementById("notifDestinatario").value;
    const selectIndividual = document.getElementById("selectSocioIndividual");
    const prevista = document.getElementById("previstaDestinatarios");

    if (tipo === "individual") {
        selectIndividual.style.display = "block";
        prevista.innerHTML = "";
    } else {
        selectIndividual.style.display = "none";

        let socios = [];
        switch (tipo) {
            case "todos":
                socios = database.socios.filter((s) => s.estado === "Activo");
                break;
            case "morosos":
                socios = database.socios.filter((s) => s.estado === "Moroso");
                break;
            case "proximos-vencer":
                socios = obtenerSociosProximosVencer(7);
                break;
        }

        if (socios.length > 0) {
            prevista.innerHTML = `
                <div class="prevista-info">
                    <i class="fas fa-users"></i>
                    <span>Se enviará a <strong>${socios.length}</strong> ${socios.length === 1 ? "socio" : "socios"}</span>
                </div>
            `;
        }
    }
}

function enviarNotificacionMasiva() {
    const destinatario = document.getElementById("notifDestinatario").value;
    const canal = document.getElementById("notifCanal").value;
    const tipo = document.getElementById("notifTipo").value;
    const asunto = document.getElementById("notifAsunto").value;
    const mensaje = document.getElementById("notifMensaje").value;

    let sociosDestino = [];

    if (destinatario === "individual") {
        const socioId = parseInt(document.getElementById("notifSocioId").value);
        if (!socioId) {
            alert("⚠️ Debes seleccionar un socio");
            return;
        }
        sociosDestino = [database.socios.find((s) => s.id === socioId)];
    } else {
        switch (destinatario) {
            case "todos":
                sociosDestino = database.socios.filter(
                    (s) => s.estado === "Activo",
                );
                break;
            case "morosos":
                sociosDestino = database.socios.filter(
                    (s) => s.estado === "Moroso",
                );
                break;
            case "proximos-vencer":
                sociosDestino = obtenerSociosProximosVencer(7);
                break;
        }
    }

    if (sociosDestino.length === 0) {
        alert("⚠️ No hay destinatarios para enviar");
        return;
    }

    if (
        !confirm(
            `¿Enviar notificación a ${sociosDestino.length} ${sociosDestino.length === 1 ? "socio" : "socios"}?`,
        )
    ) {
        return;
    }

    let exitosos = 0;
    let fallidos = 0;

    sociosDestino.forEach((socio) => {
        const exito = enviarNotificacion(
            socio.id,
            tipo,
            asunto,
            mensaje,
            canal,
        );
        if (exito) exitosos++;
        else fallidos++;
    });

    alert(
        `✅ Notificaciones enviadas\n\nExitosas: ${exitosos}\nFallidas: ${fallidos}`,
    );
    cerrarModalNotificaciones();
}

// Integrar notificaciones en funciones existentes
const reservarClaseOriginal = reservarClase;
window.reservarClase = function (claseId) {
    const resultado = reservarClaseOriginal(claseId);

    // Enviar notificación después de reservar
    if (currentUser.rol === "Recepcionista") {
        const socioId = parseInt(
            document.getElementById("socioSeleccionadoTurno").value,
        );
        if (socioId) {
            notificarReservaTurno(socioId, claseId);
        }
    } else {
        notificarReservaTurno(currentUser.socioId, claseId);
    }

    return resultado;
};

const cancelarTurnoOriginal = cancelarTurno;
window.cancelarTurno = function (turnoId) {
    const turno = database.turnos.find((t) => t.id === turnoId);
    if (turno) {
        notificarCancelacionTurno(turno.socioId, turno.claseId);
    }

    return cancelarTurnoOriginal(turnoId);
};
// ============================================
// GESTIÓN DE PLANES
// ============================================

let planEnEdicion = null;

async function editarPlan(planId) {
    if (currentUser.rol !== 'Administrador') {
        mostrarErrorPermisos();
        return;
    }

    try {
        const response = await apiRequest(`planes.php?id=${planId}`, {
            method: 'GET'
        });

        if (!response.success) {
            alert('❌ Plan no encontrado');
            return;
        }

        const plan = response.data;
        planEnEdicion = plan;

        document.getElementById('tituloModalPlan').textContent = 'Editar Plan';
        document.getElementById('planNombre').value = plan.nombre;
        document.getElementById('planDuracion').value = plan.duracion;
        document.getElementById('planCosto').value = plan.costo;
        document.getElementById('planDescripcion').value = plan.descripcion;
        document.getElementById('planActivo').checked = plan.activo != 0;
        document.getElementById('errorPlan').style.display = 'none';
        document.getElementById('modalPlan').style.display = 'flex';

        document.getElementById('formPlan').onsubmit = (e) => {
            e.preventDefault();
            guardarPlan();
        };
    } catch (error) {
        console.error('Error al cargar plan:', error);
        alert('❌ Error al cargar el plan');
    }
}


async function guardarPlan() {
    const nombre = document.getElementById('planNombre').value.trim();
    const duracion = parseInt(document.getElementById('planDuracion').value);
    const costo = parseFloat(document.getElementById('planCosto').value);
    const descripcion = document.getElementById('planDescripcion').value.trim();
    const activo = document.getElementById('planActivo').checked;
    const errorDiv = document.getElementById('errorPlan');

    if (duracion < 1) {
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Duración inválida</strong>
                <p>La duración debe ser al menos 1 día.</p>
            </div>
        `;
        errorDiv.style.display = 'flex';
        return;
    }

    if (costo < 0) {
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>Costo inválido</strong>
                <p>El costo no puede ser negativo.</p>
            </div>
        `;
        errorDiv.style.display = 'flex';
        return;
    }

    try {
        const data = {
            nombre: nombre,
            duracion: duracion,
            costo: costo,
            descripcion: descripcion,
            activo: activo ? 1 : 0
        };

        let response;
        
        if (planEnEdicion) {
            // Editar plan existente
            data.id = planEnEdicion.id;
            response = await apiRequest('planes.php', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            // Crear nuevo plan
            response = await apiRequest('planes.php', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.success) {
            alert('✅ ' + response.message);
            cerrarModalPlan();
            updatePlanesGrid();
        } else {
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Error</strong>
                    <p>${response.message}</p>
                </div>
            `;
            errorDiv.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al guardar plan:', error);
        alert('❌ Error al guardar el plan');
    }
}

async function eliminarPlan(planId) {
    if (currentUser.rol !== 'Administrador') {
        mostrarErrorPermisos();
        return;
    }

    if (!confirm('¿Estás seguro de eliminar este plan?\n\nEsta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await apiRequest(`planes.php?id=${planId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            alert('✅ ' + response.message);
            updatePlanesGrid();
        } else {
            alert('❌ Error: ' + response.message);
        }
    } catch (error) {
        console.error('Error al eliminar plan:', error);
        alert('❌ Error al eliminar el plan');
    }
}

function cerrarModalPlan() {
    document.getElementById('modalPlan').style.display = 'none';
    document.getElementById('formPlan').reset();
    planEnEdicion = null;
}
// ============================================
// VERIFICACIÓN AUTOMÁTICA PERIÓDICA
// Verificar vencimientos cada 5 minutos
setInterval(
    () => {
        if (currentUser) {
            verificarVencimientos();
            if (activeModule === "dashboard") {
                updateDashboard();
            }
        }
    },
    5 * 60 * 1000,
); // 5 minutos

// ============================================
// RF25: CANCELAR PLAN
// ============================================

function abrirModalCancelarPlan() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);

    if (!socio) {
        alert("⚠️ Error: No se encontró información del socio");
        return;
    }

    if (socio.estadoPlan && socio.estadoPlan.estado === "cancelado") {
        alert("❌ Tu plan ya está cancelado");
        return;
    }

    if (socio.estadoPlan && socio.estadoPlan.estado === "pausado") {
        alert("⚠️ Debes reactivar tu plan antes de cancelarlo");
        return;
    }

    const modal = document.getElementById("modalCancelarPlan");
    if (!modal) {
        alert("⚠️ Error: No se pudo abrir el modal");
        return;
    }

    modal.style.display = "flex";

    const errorDiv = document.getElementById("errorCancelarPlan");
    if (errorDiv) errorDiv.style.display = "none";

    const form = document.getElementById("formCancelarPlan");
    if (form) form.reset();

    const motivoOtro = document.getElementById("motivoOtroGroup");
    if (motivoOtro) motivoOtro.style.display = "none";

    // Verificar pagos pendientes
    const infoPagos = document.getElementById("infoPagosPendientes");
    if (infoPagos) {
        if (socio.estado === "Moroso") {
            infoPagos.style.display = "flex";
        } else {
            infoPagos.style.display = "none";
        }
    }

    // Event listener para cambio de motivo
    const selectMotivo = document.getElementById("motivoCancelacion");
    if (selectMotivo) {
        selectMotivo.onchange = function () {
            const motivoOtroGroup = document.getElementById("motivoOtroGroup");
            if (motivoOtroGroup) {
                if (this.value === "otro") {
                    motivoOtroGroup.style.display = "block";
                } else {
                    motivoOtroGroup.style.display = "none";
                }
            }
        };
    }

    // Event listener para el formulario
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            confirmarCancelacionPlan();
        };
    }
}

function cerrarModalCancelarPlan() {
    const modal = document.getElementById("modalCancelarPlan");
    if (modal) {
        modal.style.display = "none";
    }
}

function confirmarCancelacionPlan() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);

    if (!socio) return;

    const motivoSelect = document.getElementById("motivoCancelacion");
    const motivoTexto = document.getElementById("motivoOtroTexto");
    const confirmarCheck = document.getElementById("confirmarCancelacion");

    if (!motivoSelect || !confirmarCheck) {
        alert("⚠️ Error en el formulario");
        return;
    }

    const motivo = motivoSelect.value;
    const motivoDetalle =
        motivo === "otro" && motivoTexto ? motivoTexto.value : motivo;
    const confirmado = confirmarCheck.checked;

    if (!confirmado) {
        alert(
            "⚠️ Debes confirmar que entiendes las consecuencias de cancelar tu plan",
        );
        return;
    }

    if (motivo === "otro" && (!motivoDetalle || !motivoDetalle.trim())) {
        alert("⚠️ Debes especificar el motivo de cancelación");
        return;
    }

    // Actualizar estado del socio
    socio.estado = "Cancelado";
    if (!socio.estadoPlan) {
        socio.estadoPlan = { estado: "cancelado", historial: [] };
    } else {
        socio.estadoPlan.estado = "cancelado";
    }

    // Registrar en historial
    socio.estadoPlan.historial = socio.estadoPlan.historial || [];
    socio.estadoPlan.historial.push({
        accion: "cancelacion",
        fecha: new Date().toISOString(),
        motivo: motivoDetalle,
        usuarioId: currentUser.id,
    });

    socio.estadoPlan.fechaCancelacion = new Date().toISOString().split("T")[0];
    socio.estadoPlan.motivoCancelacion = motivoDetalle;

    // Cancelar turnos activos
    database.turnos.forEach((t) => {
        if (t.socioId === socio.id && t.estado === "Confirmado") {
            t.estado = "Cancelado";
        }
    });

    alert(
        "✅ Plan cancelado correctamente\n\nLamentamos que te vayas. Esperamos verte pronto de vuelta.",
    );

    cerrarModalCancelarPlan();
    updateMiPlan();

    // Actualizar dashboard si estamos en él
    if (activeModule === "dashboard") {
        updateDashboard();
    }
}

// ============================================
// RF26: PAUSAR / CONGELAR PLAN
// ============================================

function abrirModalPausarPlan() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);

    if (!socio) {
        alert("⚠️ Error: No se encontró información del socio");
        return;
    }

    if (socio.estadoPlan && socio.estadoPlan.estado === "cancelado") {
        alert("❌ No puedes pausar un plan cancelado");
        return;
    }

    if (socio.estadoPlan && socio.estadoPlan.estado === "pausado") {
        alert("⚠️ Tu plan ya está pausado");
        return;
    }

    if (socio.estado === "Moroso") {
        alert("⚠️ No puedes pausar tu plan si tienes pagos pendientes");
        return;
    }

    // Verificar días pausados en el año
    const diasPausadosEsteAno = calcularDiasPausadosEnAno(socio);
    if (diasPausadosEsteAno >= 60) {
        alert("❌ Has alcanzado el límite máximo de 60 días de pausa por año");
        return;
    }

    const modal = document.getElementById("modalPausarPlan");
    if (!modal) {
        alert("⚠️ Error: No se pudo abrir el modal");
        return;
    }

    modal.style.display = "flex";

    const errorDiv = document.getElementById("errorPausarPlan");
    if (errorDiv) errorDiv.style.display = "none";

    const form = document.getElementById("formPausarPlan");
    if (form) form.reset();

    const preview = document.getElementById("previsualizacionPausa");
    if (preview) preview.style.display = "none";

    // Establecer fecha mínima (mañana)
    const fechaInput = document.getElementById("fechaInicioPausaPlan");
    if (fechaInput) {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        fechaInput.min = manana.toISOString().split("T")[0];
        fechaInput.onchange = actualizarPrevisualizacionPausa;
    }

    const duracionSelect = document.getElementById("duracionPausa");
    if (duracionSelect) {
        duracionSelect.onchange = actualizarPrevisualizacionPausa;
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            confirmarPausaPlan();
        };
    }
}

function cerrarModalPausarPlan() {
    const modal = document.getElementById("modalPausarPlan");
    if (modal) {
        modal.style.display = "none";
    }
}

function calcularDiasPausadosEnAno(socio) {
    if (!socio.estadoPlan || !socio.estadoPlan.historial) return 0;

    const anoActual = new Date().getFullYear();
    let totalDias = 0;

    socio.estadoPlan.historial.forEach((h) => {
        if (h.accion === "pausa") {
            const fechaPausa = new Date(h.fecha);
            if (fechaPausa.getFullYear() === anoActual) {
                totalDias += h.duracionDias || 0;
            }
        }
    });

    return totalDias;
}

function actualizarPrevisualizacionPausa() {
    const fechaInput = document.getElementById("fechaInicioPausaPlan");
    const duracionSelect = document.getElementById("duracionPausa");

    if (!fechaInput || !duracionSelect) return;

    const fechaInicio = fechaInput.value;
    const duracion = parseInt(duracionSelect.value);

    if (!fechaInicio || !duracion) {
        const preview = document.getElementById("previsualizacionPausa");
        if (preview) preview.style.display = "none";
        return;
    }

    const socio = database.socios.find((s) => s.id === currentUser.socioId);
    const diasYaUsados = calcularDiasPausadosEnAno(socio);

    if (diasYaUsados + duracion > 60) {
        const errorDiv = document.getElementById("errorPausarPlan");
        if (errorDiv) {
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Duración excedida</strong>
                    <p>Has usado ${diasYaUsados} días de pausa este año. Solo puedes pausar ${60 - diasYaUsados} días más.</p>
                </div>
            `;
            errorDiv.style.display = "flex";
        }
        const preview = document.getElementById("previsualizacionPausa");
        if (preview) preview.style.display = "none";
        return;
    }

    const errorDiv = document.getElementById("errorPausarPlan");
    if (errorDiv) errorDiv.style.display = "none";

    const inicio = new Date(fechaInicio + "T00:00:00");
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + duracion);

    const vencimientoActual = new Date(socio.vencimiento + "T00:00:00");
    const nuevoVencimiento = new Date(vencimientoActual);
    nuevoVencimiento.setDate(nuevoVencimiento.getDate() + duracion);

    const prevInicio = document.getElementById("prevInicioPausa");
    const prevFin = document.getElementById("prevFinPausa");
    const prevVencimiento = document.getElementById("prevNuevoVencimiento");

    if (prevInicio) prevInicio.textContent = formatDate(fechaInicio);
    if (prevFin)
        prevFin.textContent = formatDate(fin.toISOString().split("T")[0]);
    if (prevVencimiento)
        prevVencimiento.textContent = formatDate(
            nuevoVencimiento.toISOString().split("T")[0],
        );

    const preview = document.getElementById("previsualizacionPausa");
    if (preview) preview.style.display = "block";
}

function confirmarPausaPlan() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);

    if (!socio) return;

    const fechaInput = document.getElementById("fechaInicioPausaPlan");
    const duracionSelect = document.getElementById("duracionPausa");

    if (!fechaInput || !duracionSelect) return;

    const fechaInicio = fechaInput.value;
    const duracion = parseInt(duracionSelect.value);

    const inicio = new Date(fechaInicio + "T00:00:00");
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + duracion);

    const vencimientoActual = new Date(socio.vencimiento + "T00:00:00");
    const nuevoVencimiento = new Date(vencimientoActual);
    nuevoVencimiento.setDate(nuevoVencimiento.getDate() + duracion);

    // Actualizar estado del socio
    if (!socio.estadoPlan) {
        socio.estadoPlan = { estado: "pausado", historial: [] };
    } else {
        socio.estadoPlan.estado = "pausado";
    }

    socio.estadoPlan.fechaInicioPausa = fechaInicio;
    socio.estadoPlan.fechaFinPausa = fin.toISOString().split("T")[0];
    socio.estadoPlan.duracionPausa = duracion;
    socio.vencimiento = nuevoVencimiento.toISOString().split("T")[0];

    // Registrar en historial
    socio.estadoPlan.historial = socio.estadoPlan.historial || [];
    socio.estadoPlan.historial.push({
        accion: "pausa",
        fecha: new Date().toISOString(),
        fechaInicio: fechaInicio,
        fechaFin: fin.toISOString().split("T")[0],
        duracionDias: duracion,
        usuarioId: currentUser.id,
    });

    alert(
        `✅ Plan pausado correctamente\n\nTu plan estará pausado desde el ${formatDate(fechaInicio)} hasta el ${formatDate(fin.toISOString().split("T")[0])}\n\nNuevo vencimiento: ${formatDate(nuevoVencimiento.toISOString().split("T")[0])}`,
    );

    cerrarModalPausarPlan();
    updateMiPlan();
}

function reactivarPlan() {
    const socio = database.socios.find((s) => s.id === currentUser.socioId);

    if (!socio || !socio.estadoPlan || socio.estadoPlan.estado !== "pausado") {
        alert("⚠️ Tu plan no está pausado");
        return;
    }

    if (
        !confirm(
            "¿Estás seguro de reactivar tu plan antes de tiempo?\n\nPodrás volver a acceder al gimnasio inmediatamente.",
        )
    ) {
        return;
    }

    // Calcular días no utilizados de la pausa
    const hoy = new Date();
    const fechaFinPausa = new Date(
        socio.estadoPlan.fechaFinPausa + "T00:00:00",
    );
    const diasNoUtilizados = Math.max(
        0,
        Math.ceil((fechaFinPausa - hoy) / (1000 * 60 * 60 * 24)),
    );

    // Ajustar vencimiento (restar días no utilizados)
    if (diasNoUtilizados > 0) {
        const vencimientoActual = new Date(socio.vencimiento + "T00:00:00");
        vencimientoActual.setDate(
            vencimientoActual.getDate() - diasNoUtilizados,
        );
        socio.vencimiento = vencimientoActual.toISOString().split("T")[0];
    }

    socio.estadoPlan.estado = "activo";
    socio.estadoPlan.fechaReactivacion = new Date().toISOString().split("T")[0];

    // Registrar en historial
    socio.estadoPlan.historial.push({
        accion: "reactivacion",
        fecha: new Date().toISOString(),
        diasNoUtilizados: diasNoUtilizados,
        usuarioId: currentUser.id,
    });

    alert(
        `✅ Plan reactivado correctamente\n\n${diasNoUtilizados > 0 ? `Se han restado ${diasNoUtilizados} días no utilizados de tu vencimiento.` : ""}\n\nNuevo vencimiento: ${formatDate(socio.vencimiento)}`,
    );

    updateMiPlan();
}

// ============================================
// RF27: VER ESTADO DEL PLAN
// ============================================

function verEstadoPlan(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);

    if (!socio) {
        alert("❌ Socio no encontrado");
        return;
    }

    const modal = document.getElementById("modalVerEstadoPlan");
    if (!modal) {
        alert("⚠️ Error: No se pudo abrir el modal");
        return;
    }

    modal.style.display = "flex";

    const nombreElem = document.getElementById("estadoSocioNombre");
    const dniElem = document.getElementById("estadoSocioDni");
    const planElem = document.getElementById("estadoPlanNombre");
    const vencElem = document.getElementById("estadoVencimiento");
    const altaElem = document.getElementById("estadoFechaAlta");

    if (nombreElem) nombreElem.textContent = socio.nombre;
    if (dniElem) dniElem.textContent = `DNI: ${socio.dni}`;
    if (planElem) planElem.textContent = socio.plan;
    if (vencElem) vencElem.textContent = formatDate(socio.vencimiento);
    if (altaElem) altaElem.textContent = formatDate(socio.fechaAlta);

    // Determinar estado actual
    let estadoActual = socio.estadoPlan ? socio.estadoPlan.estado : "activo";
    if (socio.estado === "Moroso") estadoActual = "moroso";

    const badgeLarge = document.getElementById("estadoBadgeLarge");
    if (badgeLarge) {
        badgeLarge.className = `estado-badge-large ${estadoActual}`;

        let estadoTexto = "";
        let estadoIcono = "";

        switch (estadoActual) {
            case "activo":
                estadoTexto = "ACTIVO";
                estadoIcono = "fa-check-circle";
                break;
            case "moroso":
                estadoTexto = "MOROSO";
                estadoIcono = "fa-exclamation-circle";
                break;
            case "pausado":
                estadoTexto = "PAUSADO";
                estadoIcono = "fa-pause-circle";
                break;
            case "cancelado":
                estadoTexto = "CANCELADO";
                estadoIcono = "fa-ban";
                break;
        }

        badgeLarge.innerHTML = `<i class="fas ${estadoIcono}"></i><span>${estadoTexto}</span>`;
    }

    // Mostrar información de pausa si corresponde
    const timelinePausa = document.getElementById("timelinePausa");
    if (timelinePausa) {
        if (socio.estadoPlan && socio.estadoPlan.estado === "pausado") {
            const periodoPausa = document.getElementById("estadoPeriodoPausa");
            if (periodoPausa) {
                periodoPausa.textContent = `Desde ${formatDate(socio.estadoPlan.fechaInicioPausa)} hasta ${formatDate(socio.estadoPlan.fechaFinPausa)}`;
            }
            timelinePausa.style.display = "flex";
        } else {
            timelinePausa.style.display = "none";
        }
    }

    // Mostrar información de cancelación si corresponde
    const timelineCancelacion = document.getElementById("timelineCancelacion");
    if (timelineCancelacion) {
        if (socio.estadoPlan && socio.estadoPlan.fechaCancelacion) {
            const fechaCancel = document.getElementById(
                "estadoFechaCancelacion",
            );
            if (fechaCancel) {
                fechaCancel.textContent = `${formatDate(socio.estadoPlan.fechaCancelacion)} - Motivo: ${socio.estadoPlan.motivoCancelacion || "No especificado"}`;
            }
            timelineCancelacion.style.display = "flex";
        } else {
            timelineCancelacion.style.display = "none";
        }
    }

    // Generar historial
    const listaHistorial = document.getElementById("listaHistorialEstados");
    if (listaHistorial) {
        if (
            socio.estadoPlan &&
            socio.estadoPlan.historial &&
            socio.estadoPlan.historial.length > 0
        ) {
            listaHistorial.innerHTML = socio.estadoPlan.historial
                .slice()
                .reverse()
                .map((h) => {
                    let texto = "";
                    switch (h.accion) {
                        case "pausa":
                            texto = `Plan pausado por ${h.duracionDias} días`;
                            break;
                        case "reactivacion":
                            texto = `Plan reactivado${h.diasNoUtilizados > 0 ? ` (${h.diasNoUtilizados} días no utilizados)` : ""}`;
                            break;
                        case "cancelacion":
                            texto = `Plan cancelado - ${h.motivo}`;
                            break;
                    }
                    return `
                    <div class="historial-item">
                        <strong>${texto}</strong>
                        <span>${new Date(h.fecha).toLocaleDateString("es-AR")}</span>
                    </div>
                `;
                })
                .join("");
        } else {
            listaHistorial.innerHTML =
                '<p style="color: var(--text-light); font-size: 13px;">No hay historial de cambios</p>';
        }
    }
}

function cerrarModalVerEstadoPlan() {
    const modal = document.getElementById("modalVerEstadoPlan");
    if (modal) {
        modal.style.display = "none";
    }
}

// ============================================
// EXTENDER updateMiPlan para mostrar alertas
// ============================================
(function () {
    const originalUpdateMiPlan = window.updateMiPlan;

    window.updateMiPlan = function () {
        // Llamar a la función original
        if (originalUpdateMiPlan) {
            originalUpdateMiPlan();
        }

        if (currentUser.rol !== "Socio") return;

        const socio = database.socios.find((s) => s.id === currentUser.socioId);
        if (!socio) return;

        // Mostrar/ocultar botones según estado
        const btnPausar = document.querySelector(".btn-pause");
        const btnCancelar = document.querySelector(".btn-cancel");

        if (socio.estadoPlan) {
            if (
                socio.estadoPlan.estado === "pausado" ||
                socio.estadoPlan.estado === "cancelado"
            ) {
                if (btnPausar) btnPausar.style.display = "none";
                if (btnCancelar) btnCancelar.style.display = "none";
            } else {
                if (btnPausar) btnPausar.style.display = "flex";
                if (btnCancelar) btnCancelar.style.display = "flex";
            }
        }

        // Mostrar alerta de plan pausado
        const alertaPausado = document.getElementById("alertaPlanPausado");
        if (alertaPausado) {
            if (socio.estadoPlan && socio.estadoPlan.estado === "pausado") {
                const fechaInicio = document.getElementById("fechaInicioPausa");
                const fechaFin = document.getElementById("fechaFinPausa");

                if (fechaInicio)
                    fechaInicio.textContent = formatDate(
                        socio.estadoPlan.fechaInicioPausa,
                    );
                if (fechaFin)
                    fechaFin.textContent = formatDate(
                        socio.estadoPlan.fechaFinPausa,
                    );

                alertaPausado.style.display = "flex";
            } else {
                alertaPausado.style.display = "none";
            }
        }

        // Mostrar alerta de plan cancelado
        const alertaCancelado = document.getElementById("alertaPlanCancelado");
        if (alertaCancelado) {
            if (socio.estadoPlan && socio.estadoPlan.estado === "cancelado") {
                const fechaCancel = document.getElementById("fechaCancelacion");
                if (fechaCancel)
                    fechaCancel.textContent = formatDate(
                        socio.estadoPlan.fechaCancelacion,
                    );
                alertaCancelado.style.display = "flex";
            } else {
                alertaCancelado.style.display = "none";
            }
        }
    };
})();

// ============================================
// EXTENDER updateSociosTable para mostrar estado
// ============================================
(function () {
    const originalUpdateSociosTable = window.updateSociosTable;

    window.updateSociosTable = function () {
        const searchTerm = document
            .getElementById("searchSocios")
            .value.toLowerCase();
        const tbody = document.getElementById("tablaSocios");

        const filteredSocios = database.socios.filter(
            (socio) =>
                socio.nombre.toLowerCase().includes(searchTerm) ||
                socio.dni.includes(searchTerm),
        );

        tbody.innerHTML = filteredSocios
            .map((socio) => {
                // Determinar estado real
                let estadoMostrar = socio.estado;
                if (socio.estadoPlan) {
                    if (socio.estadoPlan.estado === "pausado")
                        estadoMostrar = "Pausado";
                    if (socio.estadoPlan.estado === "cancelado")
                        estadoMostrar = "Cancelado";
                }

                return `
            <tr>
                <td>
                    <div>
                        <div style="font-weight: 500; color: var(--text-dark);">${socio.nombre}</div>
                        <div style="font-size: 13px; color: var(--text-light);">${socio.email}</div>
                    </div>
                </td>
                <td>${socio.dni}</td>
                <td>${socio.plan}</td>
                <td>${formatDate(socio.vencimiento)}</td>
                <td>
                    <span class="badge ${
                        estadoMostrar === "Activo"
                            ? "badge-active"
                            : estadoMostrar === "Pausado"
                              ? "badge"
                              : "badge-moroso"
                    }" style="${estadoMostrar === "Pausado" ? "background: #fef3c7; color: #92400e;" : ""}">
                        ${estadoMostrar}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-table btn-ver-estado" onclick="verEstadoPlan(${socio.id})" title="Ver estado del plan">
                            <i class="fas fa-chart-line"></i> Estado
                        </button>
                        ${
                            typeof tienePermiso === "function" &&
                            tienePermiso("socios", "editar")
                                ? `
                            <button class="btn-table btn-edit" onclick="editarSocio(${socio.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        `
                                : ""
                        }
                        ${
                            typeof tienePermiso === "function" &&
                            tienePermiso("socios", "eliminar")
                                ? `
                            <button class="btn-table btn-delete" onclick="eliminarSocio(${socio.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        `
                                : ""
                        }
                    </div>
                </td>
            </tr>
        `;
            })
            .join("");
    };
})();

console.log("✅ Funciones RF25, RF26 y RF27 cargadas correctamente");

// ============================================
// GESTIÓN DE PLANES DESDE ADMIN/RECEPCIONISTA
// (Funciones con nombres únicos para evitar conflictos)
// ============================================

let socioSeleccionadoPlanAdmin = null;

// MODAL: VER ESTADO DEL PLAN (Admin/Recep)
function abrirModalEstadoPlan(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) {
        alert("Socio no encontrado");
        return;
    }

    socioSeleccionadoPlanAdmin = socio;

    // Calcular días restantes
    const hoy = new Date();
    const vencimiento = new Date(socio.vencimiento);
    const diasRestantes = Math.ceil(
        (vencimiento - hoy) / (1000 * 60 * 60 * 24),
    );
    const estado = diasRestantes > 0 ? "Activo" : "Vencido";

    // Llenar datos
    document.getElementById("estadoPlanNombre").textContent = socio.nombre;
    document.getElementById("estadoPlanDni").textContent = socio.dni;
    document.getElementById("estadoPlanNombrePlan").textContent = socio.plan;
    document.getElementById("estadoPlanInicio").textContent = formatDate(
        socio.fechaAlta,
    );
    document.getElementById("estadoPlanVencimiento").textContent = formatDate(
        socio.vencimiento,
    );
    document.getElementById("estadoPlanDiasRestantes").textContent =
        diasRestantes > 0 ? `${diasRestantes} días` : "Vencido";

    const estadoBadge = document.getElementById("estadoPlanEstado");
    estadoBadge.textContent = estado;
    estadoBadge.className =
        diasRestantes > 0 ? "badge badge-active" : "badge badge-moroso";

    // Estado de congelamiento
    const congeladoBadge = document.getElementById("estadoPlanCongelado");
    if (socio.congelado) {
        congeladoBadge.textContent = `Congelado (${socio.diasCongelados || 0} días)`;
        congeladoBadge.className = "badge";
        congeladoBadge.style.background = "#d1ecf1";
        congeladoBadge.style.color = "#0c5460";
    } else {
        congeladoBadge.textContent = "No congelado";
        congeladoBadge.className = "badge badge-active";
    }

    // Obtener precio del plan
    const planInfo = database.planes.find((p) => p.nombre === socio.plan);
    document.getElementById("estadoPlanPrecio").textContent = planInfo
        ? planInfo.precio
        : "-";

    document.getElementById("modalEstadoPlan").style.display = "flex";
}

function cerrarModalEstadoPlan() {
    document.getElementById("modalEstadoPlan").style.display = "none";
    socioSeleccionadoPlanAdmin = null;
}

// MODAL: CONGELAR PLAN (Admin/Recep)
function abrirModalCongelarPlanAdmin(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) {
        alert("Socio no encontrado");
        return;
    }

    if (socio.congelado) {
        alert("Este plan ya está congelado.");
        return;
    }

    socioSeleccionadoPlanAdmin = socio;

    document.getElementById("congelarPlanNombre").textContent = socio.nombre;
    document.getElementById("congelarPlanDni").textContent = socio.dni;
    document.getElementById("congelarPlanNombrePlan").textContent = socio.plan;
    document.getElementById("congelarPlanVencimiento").textContent = formatDate(
        socio.vencimiento,
    );
    document.getElementById("congelarPlanSocioId").value = socio.id;

    document.getElementById("congelarPlanDias").value = "";
    document.getElementById("congelarPlanMotivo").value = "";
    document.getElementById("congelarPlanNuevaFecha").value = "";

    document.getElementById("modalCongelarPlan").style.display = "flex";
}

function cerrarModalCongelarPlan() {
    document.getElementById("modalCongelarPlan").style.display = "none";
    socioSeleccionadoPlanAdmin = null;
}

// Calcular nueva fecha al escribir días
if (!window.congelarDiasListenerAdded) {
    window.congelarDiasListenerAdded = true;

    document.addEventListener("DOMContentLoaded", function () {
        const inputDias = document.getElementById("congelarPlanDias");
        if (inputDias) {
            inputDias.addEventListener("input", function () {
                const dias = parseInt(this.value);
                if (dias > 0 && dias <= 90 && socioSeleccionadoPlanAdmin) {
                    const fechaActual = new Date(
                        socioSeleccionadoPlanAdmin.vencimiento,
                    );
                    fechaActual.setDate(fechaActual.getDate() + dias);
                    document.getElementById("congelarPlanNuevaFecha").value =
                        fechaActual.toISOString().split("T")[0];
                } else {
                    document.getElementById("congelarPlanNuevaFecha").value =
                        "";
                }
            });
        }

        const formCongelar = document.getElementById("formCongelarPlan");
        if (formCongelar && !formCongelar.dataset.listenerAdded) {
            formCongelar.dataset.listenerAdded = "true";
            formCongelar.addEventListener("submit", function (e) {
                e.preventDefault();
                confirmarCongelamientoPlanAdmin();
            });
        }

        const formCancelar = document.getElementById("formCancelarPlan");
        if (formCancelar && !formCancelar.dataset.listenerAdded) {
            formCancelar.dataset.listenerAdded = "true";
            formCancelar.addEventListener("submit", function (e) {
                e.preventDefault();
                confirmarCancelacionPlanAdmin();
            });
        }
    });
}

function confirmarCongelamientoPlanAdmin() {
    const socioId = parseInt(
        document.getElementById("congelarPlanSocioId").value,
    );
    const diasCongelar = parseInt(
        document.getElementById("congelarPlanDias").value,
    );
    const motivo = document.getElementById("congelarPlanMotivo").value;
    const nuevaFecha = document.getElementById("congelarPlanNuevaFecha").value;

    if (!diasCongelar || diasCongelar < 1 || diasCongelar > 90) {
        alert("Por favor ingresa un número válido de días (1-90)");
        return;
    }

    const socio = database.socios.find((s) => s.id === socioId);

    if (socio) {
        socio.congelado = true;
        socio.diasCongelados = diasCongelar;
        socio.vencimiento = nuevaFecha;
        socio.fechaCongelamiento = new Date().toISOString().split("T")[0];

        if (motivo) {
            socio.motivoCongelamiento = motivo;
        }

        cerrarModalCongelarPlan();
        alert(
            `✅ Plan congelado exitosamente por ${diasCongelar} días.\nNueva fecha de vencimiento: ${formatDate(nuevaFecha)}`,
        );

        if (typeof updateSociosTable === "function") {
            updateSociosTable();
        }
    }
}

// MODAL: CANCELAR PLAN (Admin/Recep)
function abrirModalCancelarPlanAdmin(socioId) {
    const socio = database.socios.find((s) => s.id === socioId);
    if (!socio) {
        alert("Socio no encontrado");
        return;
    }

    socioSeleccionadoPlanAdmin = socio;

    document.getElementById("cancelPlanNombre").textContent = socio.nombre;
    document.getElementById("cancelPlanDni").textContent = socio.dni;
    document.getElementById("cancelPlanNombrePlan").textContent = socio.plan;
    document.getElementById("cancelPlanVencimiento").textContent = formatDate(
        socio.vencimiento,
    );
    document.getElementById("cancelPlanSocioId").value = socio.id;
    document.getElementById("cancelPlanMotivo").value = "";

    document.getElementById("modalCancelarPlan").style.display = "flex";
}

function cerrarModalCancelarPlanAdmin() {
    document.getElementById("modalCancelarPlan").style.display = "none";
    socioSeleccionadoPlanAdmin = null;
}

function confirmarCancelacionPlanAdmin() {
    const socioId = parseInt(
        document.getElementById("cancelPlanSocioId").value,
    );
    const motivo = document.getElementById("cancelPlanMotivo").value;

    const confirmacion = confirm(
        "¿Estás seguro de cancelar este plan?\nEsta acción cambiará el estado del socio a Inactivo.",
    );

    if (!confirmacion) return;

    const socio = database.socios.find((s) => s.id === socioId);

    if (socio) {
        socio.estado = "Moroso";
        socio.planCancelado = true;
        socio.fechaCancelacion = new Date().toISOString().split("T")[0];

        if (motivo) {
            socio.motivoCancelacion = motivo;
        }

        cerrarModalCancelarPlanAdmin();
        alert(
            `✅ Plan cancelado para ${socio.nombre}.\nEl socio ha sido marcado como inactivo.`,
        );

        if (typeof updateSociosTable === "function") {
            updateSociosTable();
        }
    }
}

console.log(
    "✅ Funciones de gestión de planes (Admin/Recep) cargadas correctamente",
);

