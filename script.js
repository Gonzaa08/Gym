function generateMenu() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', roles: ['Administrador', 'Recepcionista'] },
        { id: 'socios', label: 'Socios', icon: 'fa-users', roles: ['Administrador', 'Recepcionista'] },
        { id: 'asistencias', label: 'Asistencias', icon: 'fa-calendar-check', roles: ['Administrador', 'Recepcionista'] },
        { id: 'pagos', label: 'Pagos', icon: 'fa-dollar-sign', roles: ['Administrador', 'Recepcionista'] },
        { id: 'planes', label: 'Planes', icon: 'fa-file-alt', roles: ['Administrador', 'Recepcionista'] },
        { id: 'miPlan', label: 'Mi Plan', icon: 'fa-id-card', roles: ['Socio'] },
        { id: 'turnos', label: 'Mis Turnos', icon: 'fa-calendar-alt', roles: ['Socio'] },
        { id: 'objetivos', label: 'Objetivos', icon: 'fa-bullseye', roles: ['Socio'] },
        { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-circle', roles: ['Socio'] }
    ];
    
    menuItems
    .filter(item => item.roles.includes(currentUser.rol))
    .forEach(item => {
      const button = document.createElement('button');
      button.className = 'nav-item';
      button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
      button.addEventListener('click', () => showModule(item.id));
      nav.appendChild(button);
    });
}
            
// ============================================
// DATOS INICIALES
// ============================================

let currentUser = null;
let activeModule = 'dashboard';

// Base de datos en memoria
const database = {
    usuarios: [
        { id: 1, username: 'admin', password: 'admin123', nombre: 'Administrador', rol: 'Administrador' },
        { id: 2, username: 'recep', password: 'recep123', nombre: 'Ana Martínez', rol: 'Recepcionista' },
        { id: 3, username: 'socio1', password: 'socio123', nombre: 'Juan Pérez', rol: 'Socio', socioId: 1 }
    ],
    
    socios: [
        { 
            id: 1, 
            nombre: 'Juan Pérez', 
            dni: '12345678', 
            email: 'juan@email.com', 
            telefono: '261-1234567', 
            plan: 'Mensual', 
            estado: 'Activo', 
            vencimiento: '2025-10-20', 
            fechaAlta: '2025-01-15',
            fechaNacimiento: '1990-05-15',
            genero: 'Masculino',
            contactoEmergencia: { nombre: 'María Pérez', relacion: 'Madre', telefono: '261-9999999' },
            informacionMedica: { grupoSanguineo: 'O+', alergias: 'Ninguna', lesiones: 'Lesión de rodilla en 2023' }
        },
        { 
            id: 2, 
            nombre: 'María García', 
            dni: '87654321', 
            email: 'maria@email.com', 
            telefono: '261-7654321', 
            plan: 'Trimestral', 
            estado: 'Moroso', 
            vencimiento: '2025-10-05', 
            fechaAlta: '2025-02-10' 
        },
        { 
            id: 3, 
            nombre: 'Carlos López', 
            dni: '11223344', 
            email: 'carlos@email.com', 
            telefono: '261-1122334', 
            plan: 'Anual', 
            estado: 'Activo', 
            vencimiento: '2025-12-15', 
            fechaAlta: '2024-12-15' 
        },
        { 
            id: 4, 
            nombre: 'Laura Fernández', 
            dni: '22334455', 
            email: 'laura@email.com', 
            telefono: '261-2233445', 
            plan: 'Mensual', 
            estado: 'Activo', 
            vencimiento: '2025-11-01', 
            fechaAlta: '2025-03-20' 
        }
    ],
    
    planes: [
        { id: 1, nombre: 'Mensual', duracion: 30, costo: 15000, descripcion: 'Acceso completo por 1 mes' },
        { id: 2, nombre: 'Trimestral', duracion: 90, costo: 40000, descripcion: 'Acceso completo por 3 meses' },
        { id: 3, nombre: 'Anual', duracion: 365, costo: 150000, descripcion: 'Acceso completo por 1 año' }
    ],
    
    asistencias: [
        { id: 1, socioId: 1, fecha: '2025-10-14', hora: '08:30' },
        { id: 2, socioId: 3, fecha: '2025-10-14', hora: '09:15' },
        { id: 3, socioId: 1, fecha: '2025-10-13', hora: '18:45' },
        { id: 4, socioId: 4, fecha: '2025-10-14', hora: '07:00' },
        { id: 5, socioId: 3, fecha: '2025-10-13', hora: '19:30' },
        { id: 6, socioId: 1, fecha: '2025-10-12', hora: '08:15' },
        { id: 7, socioId: 1, fecha: '2025-10-11', hora: '18:00' },
        { id: 8, socioId: 1, fecha: '2025-10-10', hora: '08:30' }
    ],
    
    pagos: [
        { id: 1, socioId: 1, monto: 15000, fecha: '2025-09-20', metodoPago: 'Efectivo', concepto: 'Cuota Mensual' },
        { id: 2, socioId: 3, monto: 150000, fecha: '2024-12-15', metodoPago: 'Transferencia', concepto: 'Plan Anual' },
        { id: 3, socioId: 4, monto: 15000, fecha: '2025-10-01', metodoPago: 'Tarjeta', concepto: 'Cuota Mensual' }
    ],
    
    clases: [
        { id: 1, nombre: 'Spinning', dia: 'Lunes', hora: '08:00', instructor: 'Carlos Ruiz', duracion: 60, cuposTotal: 20, cuposOcupados: 15 },
        { id: 2, nombre: 'Yoga', dia: 'Lunes', hora: '10:00', instructor: 'Ana López', duracion: 60, cuposTotal: 15, cuposOcupados: 10 },
        { id: 3, nombre: 'Crossfit', dia: 'Martes', hora: '18:00', instructor: 'Miguel Ángel', duracion: 60, cuposTotal: 12, cuposOcupados: 12 },
        { id: 4, nombre: 'Funcional', dia: 'Miércoles', hora: '07:00', instructor: 'Laura Torres', duracion: 45, cuposTotal: 15, cuposOcupados: 8 },
        { id: 5, nombre: 'Zumba', dia: 'Jueves', hora: '19:00', instructor: 'Sofia Morales', duracion: 60, cuposTotal: 25, cuposOcupados: 20 },
        { id: 6, nombre: 'Spinning', dia: 'Viernes', hora: '08:00', instructor: 'Carlos Ruiz', duracion: 60, cuposTotal: 20, cuposOcupados: 5 }
    ],
    
    turnos: [
        { id: 1, socioId: 1, claseId: 1, fecha: '2025-10-21', estado: 'Confirmado' },
        { id: 2, socioId: 1, claseId: 4, fecha: '2025-10-23', estado: 'Confirmado' }
    ],
    
    objetivos: [
        { socioId: 1, tipo: 'perder_peso', fechaInicio: '2025-01-15' }
    ],
    
    medidas: [
        { id: 1, socioId: 1, fecha: '2025-01-15', peso: 82.5, altura: 175 },
        { id: 2, socioId: 1, fecha: '2025-02-15', peso: 80.0, altura: 175 },
        { id: 3, socioId: 1, fecha: '2025-03-15', peso: 78.5, altura: 175 },
        { id: 4, socioId: 1, fecha: '2025-10-14', peso: 75.0, altura: 175 }
    ]
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function formatCurrency(amount) {
    return '$' + amount.toLocaleString('es-AR');
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-AR');
}

function getCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-AR', options);
}

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0].substring(0, 5);
}

// ============================================
// SISTEMA DE LOGIN
// ============================================

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        const user = database.usuarios.find(u => u.username === username && u.password === password);
        
        if (user) {
            currentUser = user;
            errorDiv.style.display = 'none';
            showMainSystem();
        } else {
            errorDiv.style.display = 'flex';
        }
    });
}

function showMainSystem() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'flex';
    
    initMainSystem();
}

function logout() {
    currentUser = null;
    document.getElementById('mainSystem').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// ============================================
// SISTEMA PRINCIPAL
// ============================================

function initMainSystem() {
    // Actualizar información del usuario
    document.getElementById('userRole').textContent = currentUser.rol;
    document.getElementById('welcomeText').textContent = `Bienvenido, ${currentUser.nombre}`;
    document.getElementById('currentDate').textContent = getCurrentDate();
    
    // Generar menú según rol
    generateMenu();
    
    // Inicializar módulos
    initDashboard();
    initSociosModule();
    initAsistenciasModule();
    initPagosModule();
    initPlanesModule();
    initMiPlanModule();
    initTurnosModule();
    initObjetivosModule();
    initPerfilModule();
    
    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    
    // Mostrar módulo por defecto según rol
    if (currentUser.rol === 'Socio') {
        showModule('miPlan');
    } else {
        showModule('dashboard');
    }
}

function generateMenu() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', roles: ['Administrador', 'Recepcionista'] },
        { id: 'socios', label: 'Socios', icon: 'fa-users', roles: ['Administrador', 'Recepcionista'] },
        { id: 'asistencias', label: 'Asistencias', icon: 'fa-calendar-check', roles: ['Administrador', 'Recepcionista'] },
        { id: 'pagos', label: 'Pagos', icon: 'fa-dollar-sign', roles: ['Administrador', 'Recepcionista'] },
        { id: 'planes', label: 'Planes', icon: 'fa-file-alt', roles: ['Administrador', 'Recepcionista'] },
        { id: 'miPlan', label: 'Mi Plan', icon: 'fa-id-card', roles: ['Socio'] },
        { id: 'turnos', label: 'Mis Turnos', icon: 'fa-calendar-alt', roles: ['Socio'] },
        { id: 'objetivos', label: 'Objetivos', icon: 'fa-bullseye', roles: ['Socio'] },
        { id: 'perfil', label: 'Mi Perfil', icon: 'fa-user-circle', roles: ['Socio'] }
    ];
    
    // Evitar error si currentUser no está definido
    if (!currentUser) return;
    
    menuItems
        .filter(item => item.roles.includes(currentUser.rol))
        .forEach(item => {
            const button = document.createElement('button');
            button.className = 'nav-item';
            button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
            button.addEventListener('click', () => showModule(item.id));
            nav.appendChild(button);
        });
}

function showModule(moduleName) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module').forEach(module => {
        module.style.display = 'none';
    });
    
    // Mostrar módulo seleccionado
    document.getElementById(moduleName + 'Module').style.display = 'block';
    
    // Actualizar menú activo
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    activeModule = moduleName;
    
    // Actualizar datos del módulo
    switch(moduleName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'socios':
            updateSociosTable();
            break;
        case 'asistencias':
            updateAsistenciasTable();
            break;
        case 'pagos':
            updatePagosTable();
            break;
        case 'planes':
            updatePlanesGrid();
            break;
        case 'miPlan':
            updateMiPlan();
            break;
        case 'turnos':
            updateTurnosModule();
            break;
        case 'objetivos':
            updateObjetivosModule();
            break;
        case 'perfil':
            updatePerfilModule();
            break;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// ============================================
// MÓDULO DASHBOARD
// ============================================

function initDashboard() {
    updateDashboard();
}

function updateDashboard() {
    // Calcular estadísticas
    const sociosActivos = database.socios.filter(s => s.estado === 'Activo').length;
    const sociosMorosos = database.socios.filter(s => s.estado === 'Moroso').length;
    const asistenciasHoy = database.asistencias.filter(a => a.fecha === getTodayString()).length;
    const ingresosDelMes = database.pagos
        .filter(p => p.fecha.startsWith('2025-10'))
        .reduce((sum, p) => sum + p.monto, 0);
    
    // Actualizar valores
    document.getElementById('sociosActivos').textContent = sociosActivos;
    document.getElementById('sociosMorosos').textContent = sociosMorosos;
    document.getElementById('asistenciasHoy').textContent = asistenciasHoy;
    document.getElementById('ingresosDelMes').textContent = formatCurrency(ingresosDelMes);
    
    // Actualizar alertas de vencimiento
    updateAlertasVencimiento();
    
    // Actualizar últimas asistencias
    updateUltimasAsistencias();
}

function updateAlertasVencimiento() {
    const container = document.getElementById('alertasVencimiento');
    const morosos = database.socios.filter(s => s.estado === 'Moroso');
    
    if (morosos.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay alertas de vencimiento</p>';
        return;
    }
    
    container.innerHTML = morosos.map(socio => `
        <div class="alert-item">
            <div class="alert-item-info">
                <p>${socio.nombre}</p>
                <p>Vencimiento: ${formatDate(socio.vencimiento)}</p>
            </div>
            <i class="fas fa-exclamation-circle"></i>
        </div>
    `).join('');
}

function updateUltimasAsistencias() {
    const container = document.getElementById('ultimasAsistencias');
    const ultimasAsistencias = database.asistencias.slice(-5).reverse();
    
    if (ultimasAsistencias.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay asistencias registradas</p>';
        return;
    }
    
    container.innerHTML = ultimasAsistencias.map(asistencia => {
        const socio = database.socios.find(s => s.id === asistencia.socioId);
        return `
            <div class="attendance-item">
                <div class="attendance-item-info">
                    <p>${socio.nombre}</p>
                    <p>${formatDate(asistencia.fecha)} - ${asistencia.hora}</p>
                </div>
                <i class="fas fa-check-circle"></i>
            </div>
        `;
    }).join('');
}

// ============================================
// MÓDULO SOCIOS
// ============================================

function initSociosModule() {
    const searchInput = document.getElementById('searchSocios');
    searchInput.addEventListener('input', updateSociosTable);
    
    updateSociosTable();
}

function updateSociosTable() {
    const searchTerm = document.getElementById('searchSocios').value.toLowerCase();
    const tbody = document.getElementById('tablaSocios');
    
    const filteredSocios = database.socios.filter(socio => 
        socio.nombre.toLowerCase().includes(searchTerm) ||
        socio.dni.includes(searchTerm)
    );
    
    tbody.innerHTML = filteredSocios.map(socio => `
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
                <span class="badge ${socio.estado === 'Activo' ? 'badge-active' : 'badge-moroso'}">
                    ${socio.estado}
                </span>
            </td>
            <td>
                <button class="btn-table" onclick="editarSocio(${socio.id})">Editar</button>
            </td>
        </tr>
    `).join('');
}

function editarSocio(id) {
    alert('Funcionalidad de edición: Socio ID ' + id);
    // Aquí puedes implementar un modal o formulario de edición
}

// ============================================
// MÓDULO ASISTENCIAS
// ============================================

function initAsistenciasModule() {
    document.getElementById('btnRegistrarAsistencia').addEventListener('click', registrarAsistencia);
    updateAsistenciasTable();
}

function registrarAsistencia() {
    const dni = document.getElementById('dniAsistencia').value;
    const mensajeDiv = document.getElementById('mensajeAsistencia');
    
    if (!dni) {
        showMessage(mensajeDiv, 'Por favor ingrese un DNI', 'error');
        return;
    }
    
    const socio = database.socios.find(s => s.dni === dni);
    
    if (!socio) {
        showMessage(mensajeDiv, 'Socio no encontrado', 'error');
        return;
    }
    
    if (socio.estado === 'Moroso') {
        showMessage(mensajeDiv, 'El socio tiene la cuota vencida. No puede ingresar.', 'error');
        return;
    }
    
    // Registrar asistencia
    const nuevaAsistencia = {
        id: database.asistencias.length + 1,
        socioId: socio.id,
        fecha: getTodayString(),
        hora: getCurrentTime()
    };
    
    database.asistencias.push(nuevaAsistencia);
    
    showMessage(mensajeDiv, `Asistencia registrada para ${socio.nombre}`, 'success');
    document.getElementById('dniAsistencia').value = '';
    updateAsistenciasTable();
    updateDashboard();
    
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 3000);
}

function updateAsistenciasTable() {
    const tbody = document.getElementById('tablaAsistencias');
    const asistencias = database.asistencias.slice().reverse();
    
    tbody.innerHTML = asistencias.map(asistencia => {
        const socio = database.socios.find(s => s.id === asistencia.socioId);
        return `
            <tr>
                <td>${socio.nombre}</td>
                <td>${formatDate(asistencia.fecha)}</td>
                <td>${asistencia.hora}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MÓDULO PAGOS
// ============================================

function initPagosModule() {
    // Llenar select de socios
    const select = document.getElementById('socioSeleccionado');
    select.innerHTML = '<option value="">Seleccionar Socio</option>' + 
        database.socios.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
    
    document.getElementById('btnRegistrarPago').addEventListener('click', registrarPago);
    updatePagosTable();
}

function registrarPago() {
    const socioId = parseInt(document.getElementById('socioSeleccionado').value);
    const monto = parseFloat(document.getElementById('montoPago').value);
    const metodoPago = document.getElementById('metodoPago').value;
    
    if (!socioId || !monto) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    // Registrar pago
    const nuevoPago = {
        id: database.pagos.length + 1,
        socioId: socioId,
        monto: monto,
        fecha: getTodayString(),
        metodoPago: metodoPago,
        concepto: 'Cuota Mensual'
    };
    
    database.pagos.push(nuevoPago);
    
    // Actualizar estado del socio
    const socio = database.socios.find(s => s.id === socioId);
    if (socio) {
        socio.estado = 'Activo';
        const nuevaFecha = new Date();
        nuevaFecha.setDate(nuevaFecha.getDate() + 30);
        socio.vencimiento = nuevaFecha.toISOString().split('T')[0];
    }
    
    // Limpiar formulario
    document.getElementById('socioSeleccionado').value = '';
    document.getElementById('montoPago').value = '';
    
    alert('Pago registrado correctamente');
    updatePagosTable();
    updateDashboard();
    updateSociosTable();
}

function updatePagosTable() {
    const tbody = document.getElementById('tablaPagos');
    const pagos = database.pagos.slice().reverse();
    
    tbody.innerHTML = pagos.map(pago => {
        const socio = database.socios.find(s => s.id === pago.socioId);
        return `
            <tr>
                <td>${socio.nombre}</td>
                <td style="font-weight: 600; color: var(--success-color);">${formatCurrency(pago.monto)}</td>
                <td>${formatDate(pago.fecha)}</td>
                <td>${pago.metodoPago}</td>
                <td>${pago.concepto}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MÓDULO PLANES
// ============================================

function initPlanesModule() {
    updatePlanesGrid();
}

function updatePlanesGrid() {
    const grid = document.getElementById('planesGrid');
    
    grid.innerHTML = database.planes.map(plan => `
        <div class="plan-card">
            <h3>${plan.nombre}</h3>
            <p class="plan-description">${plan.descripcion}</p>
            <div class="plan-price">
                <div class="price">${formatCurrency(plan.costo)}</div>
                <div class="duration">${plan.duracion} días</div>
            </div>
            <button class="btn-primary" onclick="seleccionarPlan(${plan.id})">
                Seleccionar Plan
            </button>
        </div>
    `).join('');
}

function seleccionarPlan(id) {
    const plan = database.planes.find(p => p.id === id);
    alert(`Has seleccionado el plan: ${plan.nombre}`);
}

// ============================================
// MÓDULO MI PLAN
// ============================================

function initMiPlanModule() {
    updateMiPlan();
}

function updateMiPlan() {
    if (currentUser.rol !== 'Socio') return;
    
    // Obtener datos del socio
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) {
        document.querySelector('.my-plan-container').innerHTML = '<p class="text-center">No se encontró información del socio</p>';
        return;
    }
    
    // Obtener plan del socio
    const plan = database.planes.find(p => p.nombre === socio.plan);
    
    // Actualizar información del plan
    document.getElementById('miPlanNombre').textContent = socio.plan;
    document.getElementById('miPlanEstado').textContent = socio.estado;
    document.getElementById('miPlanFechaInicio').textContent = formatDate(socio.fechaAlta);
    document.getElementById('miPlanVencimiento').textContent = formatDate(socio.vencimiento);
    document.getElementById('miPlanCosto').textContent = plan ? formatCurrency(plan.costo) : '-';
    
    // Calcular días restantes
    const today = new Date();
    const vencimiento = new Date(socio.vencimiento + 'T00:00:00');
    const diasRestantes = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));
    document.getElementById('miPlanDiasRestantes').textContent = diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido';
    
    // Calcular progreso del plan
    const fechaInicio = new Date(socio.fechaAlta + 'T00:00:00');
    const duracionTotal = plan ? plan.duracion : 30;
    const diasTranscurridos = Math.ceil((today - fechaInicio) / (1000 * 60 * 60 * 24));
    const progreso = Math.min(100, Math.round((diasTranscurridos / duracionTotal) * 100));
    
    document.getElementById('planProgressPercent').textContent = progreso + '%';
    document.getElementById('planProgressBar').style.width = progreso + '%';
    
    // Actualizar asistencias del mes
    const asistenciasMes = database.asistencias.filter(a => {
        const fechaAsistencia = new Date(a.fecha + 'T00:00:00');
        return a.socioId === socio.id && 
               fechaAsistencia.getMonth() === today.getMonth() &&
               fechaAsistencia.getFullYear() === today.getFullYear();
    }).length;
    
    document.getElementById('misAsistenciasMes').textContent = asistenciasMes;
    
    // Generar gráfico de asistencias (últimos 7 días)
    generateAsistenciasChart(socio.id);
    
    // Próximo pago
    document.getElementById('proximoPagoMonto').textContent = plan ? formatCurrency(plan.costo) : '$0';
    document.getElementById('proximoPagoFecha').textContent = formatDate(socio.vencimiento);
    
    // Estado de cuenta
    const pagosSocio = database.pagos.filter(p => p.socioId === socio.id);
    const totalPagado = pagosSocio.reduce((sum, p) => sum + p.monto, 0);
    
    document.getElementById('ultimosPagosCount').textContent = pagosSocio.length;
    document.getElementById('totalPagado').textContent = formatCurrency(totalPagado);
    
    const estadoBadge = document.getElementById('estadoCuenta');
    if (socio.estado === 'Activo') {
        estadoBadge.textContent = 'Al día';
        estadoBadge.className = 'status-badge';
    } else {
        estadoBadge.textContent = 'Moroso';
        estadoBadge.className = 'status-badge moroso';
    }
    
    // Historial de asistencias
    updateMiHistorialAsistencias(socio.id);
}

function generateAsistenciasChart(socioId) {
    const chartContainer = document.getElementById('chartAsistencias');
    const today = new Date();
    const chart = [];
    
    // Generar últimos 7 días
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = database.asistencias.filter(a => 
            a.socioId === socioId && a.fecha === dateStr
        ).length;
        
        chart.push({
            date: dateStr,
            count: count
        });
    }
    
    // Encontrar máximo para escalar
    const maxCount = Math.max(...chart.map(c => c.count), 1);
    
    chartContainer.innerHTML = chart.map(item => {
        const height = (item.count / maxCount) * 100;
        return `<div class="chart-bar-item" style="height: ${height}%" title="${item.date}: ${item.count} asistencias"></div>`;
    }).join('');
}

function updateMiHistorialAsistencias(socioId) {
    const tbody = document.getElementById('miHistorialAsistencias');
    const asistencias = database.asistencias
        .filter(a => a.socioId === socioId)
        .slice(-10)
        .reverse();
    
    if (asistencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay asistencias registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = asistencias.map(asistencia => `
        <tr>
            <td>${formatDate(asistencia.fecha)}</td>
            <td>${asistencia.hora}</td>
            <td><span class="badge badge-active">Completado</span></td>
        </tr>
    `).join('');
}

function renovarPlan() {
    alert('Funcionalidad de renovación de plan. Aquí se procesaría el pago.');
}

function verHistorialPagos() {
    if (currentUser.rol === 'Socio') {
        const socio = database.socios.find(s => s.id === currentUser.socioId);
        const pagos = database.pagos.filter(p => p.socioId === socio.id);
        
        let mensaje = 'HISTORIAL DE PAGOS\n\n';
        pagos.forEach(pago => {
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
// ============================================

function initTurnosModule() {
    document.getElementById('filterDia').addEventListener('change', updateClasesDisponibles);
    document.getElementById('filterActividad').addEventListener('change', updateClasesDisponibles);
    updateTurnosModule();
}

function updateTurnosModule() {
    updateClasesDisponibles();
    updateMisTurnos();
}

function updateClasesDisponibles() {
    const filterDia = document.getElementById('filterDia').value;
    const filterActividad = document.getElementById('filterActividad').value;
    const container = document.getElementById('clasesDisponibles');
    
    let clasesFiltered = database.clases;
    
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
        const cuposDisponibles = clase.cuposTotal - clase.cuposOcupados;
        const porcentaje = (clase.cuposOcupados / clase.cuposTotal) * 100;
        
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
        
        const yaReservado = database.turnos.some(t => 
            t.socioId === currentUser.socioId && t.claseId === clase.id && t.estado === 'Confirmado'
        );
        
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
                    ${btnDisabled || yaReservado ? 'disabled' : ''}
                >
                    ${yaReservado ? 'Ya Reservado' : 'Reservar'}
                </button>
            </div>
        `;
    }).join('');
}

function updateMisTurnos() {
    const container = document.getElementById('misTurnosReservados');
    const misTurnos = database.turnos.filter(t => t.socioId === currentUser.socioId && t.estado === 'Confirmado');
    
    if (misTurnos.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">No tienes turnos reservados</p>';
        return;
    }
    
    container.innerHTML = misTurnos.map(turno => {
        const clase = database.clases.find(c => c.id === turno.claseId);
        return `
            <div class="turno-item">
                <h4>${clase.nombre}</h4>
                <p><i class="fas fa-calendar"></i> ${clase.dia} - ${formatDate(turno.fecha)}</p>
                <p><i class="fas fa-clock"></i> ${clase.hora} (${clase.duracion} min)</p>
                <p><i class="fas fa-user"></i> ${clase.instructor}</p>
                <button class="btn-cancelar" onclick="cancelarTurno(${turno.id})">
                    <i class="fas fa-times"></i> Cancelar Turno
                </button>
            </div>
        `;
    }).join('');
}

function reservarClase(claseId) {
    const clase = database.clases.find(c => c.id === claseId);
    
    if (!clase) return;
    
    const nuevoTurno = {
        id: database.turnos.length + 1,
        socioId: currentUser.socioId,
        claseId: claseId,
        fecha: getNextClassDate(clase.dia),
        estado: 'Confirmado'
    };
    
    database.turnos.push(nuevoTurno);
    clase.cuposOcupados += 1;
    
    alert(`¡Turno reservado exitosamente!\n\nClase: ${clase.nombre}\nDía: ${clase.dia}\nHora: ${clase.hora}`);
    
    updateTurnosModule();
}

function cancelarTurno(turnoId) {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;
    
    const turno = database.turnos.find(t => t.id === turnoId);
    if (!turno) return;
    
    const clase = database.clases.find(c => c.id === turno.claseId);
    if (clase) {
        clase.cuposOcupados -= 1;
    }
    
    turno.estado = 'Cancelado';
    
    alert('Turno cancelado exitosamente');
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
// MÓDULO TURNOS
// ============================================

function initTurnosModule() {
    document.getElementById('filterDia').addEventListener('change', updateClasesDisponibles);
    document.getElementById('filterActividad').addEventListener('change', updateClasesDisponibles);
    updateTurnosModule();
}

function updateTurnosModule() {
    updateClasesDisponibles();
    updateMisTurnos();
}

function updateClasesDisponibles() {
    const filterDia = document.getElementById('filterDia').value;
    const filterActividad = document.getElementById('filterActividad').value;
    const container = document.getElementById('clasesDisponibles');
    
    let clasesFiltered = database.clases;
    
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
        const cuposDisponibles = clase.cuposTotal - clase.cuposOcupados;
        const porcentaje = (clase.cuposOcupados / clase.cuposTotal) * 100;
        
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
        
        // Verificar si el socio ya reservó esta clase
        const yaReservado = database.turnos.some(t => 
            t.socioId === currentUser.socioId && t.claseId === clase.id && t.estado === 'Confirmado'
        );
        
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
                    ${btnDisabled || yaReservado ? 'disabled' : ''}
                >
                    ${yaReservado ? 'Ya Reservado' : 'Reservar'}
                </button>
            </div>
        `;
    }).join('');
}

function updateMisTurnos() {
    const container = document.getElementById('misTurnosReservados');
    const misTurnos = database.turnos.filter(t => t.socioId === currentUser.socioId && t.estado === 'Confirmado');
    
    if (misTurnos.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">No tienes turnos reservados</p>';
        return;
    }
    
    container.innerHTML = misTurnos.map(turno => {
        const clase = database.clases.find(c => c.id === turno.claseId);
        return `
            <div class="turno-item">
                <h4>${clase.nombre}</h4>
                <p><i class="fas fa-calendar"></i> ${clase.dia} - ${formatDate(turno.fecha)}</p>
                <p><i class="fas fa-clock"></i> ${clase.hora} (${clase.duracion} min)</p>
                <p><i class="fas fa-user"></i> ${clase.instructor}</p>
                <button class="btn-cancelar" onclick="cancelarTurno(${turno.id})">
                    <i class="fas fa-times"></i> Cancelar Turno
                </button>
            </div>
        `;
    }).join('');
}

function reservarClase(claseId) {
    const clase = database.clases.find(c => c.id === claseId);
    
    if (!clase) return;
    
    // Crear nueva reserva
    const nuevoTurno = {
        id: database.turnos.length + 1,
        socioId: currentUser.socioId,
        claseId: claseId,
        fecha: getNextClassDate(clase.dia),
        estado: 'Confirmado'
    };
    
    database.turnos.push(nuevoTurno);
    clase.cuposOcupados += 1;
    
    alert(`¡Turno reservado exitosamente!\n\nClase: ${clase.nombre}\nDía: ${clase.dia}\nHora: ${clase.hora}`);
    
    updateTurnosModule();
}

function cancelarTurno(turnoId) {
    if (!confirm('¿Estás seguro de cancelar este turno?')) return;
    
    const turno = database.turnos.find(t => t.id === turnoId);
    if (!turno) return;
    
    const clase = database.clases.find(c => c.id === turno.claseId);
    if (clase) {
        clase.cuposOcupados -= 1;
    }
    
    turno.estado = 'Cancelado';
    
    alert('Turno cancelado exitosamente');
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
// MÓDULO OBJETIVOS Y SEGUIMIENTO
// ============================================

function initObjetivosModule() {
    document.getElementById('selectObjetivo').addEventListener('change', function() {
        if (this.value) {
            establecerObjetivo(this.value);
        }
    });
    
    updateObjetivosModule();
}

function updateObjetivosModule() {
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) return;
    
    // Verificar si tiene objetivo
    const objetivo = database.objetivos.find(o => o.socioId === currentUser.socioId);
    
    if (objetivo) {
        document.getElementById('selectObjetivo').style.display = 'none';
        document.getElementById('objetivoMeta').style.display = 'block';
        
        const objetivos = {
            'perder_peso': { titulo: 'Perder Peso', desc: 'Reducir grasa corporal y mejorar tu composición física' },
            'ganar_masa': { titulo: 'Ganar Masa Muscular', desc: 'Aumentar masa muscular y fuerza' },
            'tonificar': { titulo: 'Tonificar', desc: 'Definir músculos y mejorar apariencia física' },
            'resistencia': { titulo: 'Mejorar Resistencia', desc: 'Aumentar capacidad cardiovascular' },
            'flexibilidad': { titulo: 'Mejorar Flexibilidad', desc: 'Aumentar rango de movimiento' }
        };
        
        const obj = objetivos[objetivo.tipo];
        document.getElementById('metaTitulo').textContent = obj.titulo;
        document.getElementById('metaDescripcion').textContent = obj.desc;
    }
    
    // Actualizar medidas
    updateMedidasDisplay();
    
    // Actualizar racha
    updateRacha();
    
    // Actualizar logros
    updateLogros();
    
    // Actualizar historial de medidas
    updateHistorialMedidas();
}

function establecerObjetivo(tipo) {
    const objetivo = {
        socioId: currentUser.socioId,
        tipo: tipo,
        fechaInicio: getTodayString()
    };
    
    const index = database.objetivos.findIndex(o => o.socioId === currentUser.socioId);
    if (index >= 0) {
        database.objetivos[index] = objetivo;
    } else {
        database.objetivos.push(objetivo);
    }
    
    updateObjetivosModule();
}

function cambiarObjetivo() {
    document.getElementById('objetivoMeta').style.display = 'none';
    document.getElementById('selectObjetivo').style.display = 'block';
    document.getElementById('selectObjetivo').value = '';
}

function updateMedidasDisplay() {
    const ultimaMedida = database.medidas
        .filter(m => m.socioId === currentUser.socioId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
    
    if (ultimaMedida) {
        const imc = (ultimaMedida.peso / ((ultimaMedida.altura / 100) ** 2)).toFixed(1);
        document.getElementById('imcValor').textContent = imc;
        
        let categoria = '';
        if (imc < 18.5) categoria = 'Bajo peso';
        else if (imc < 25) categoria = 'Normal';
        else if (imc < 30) categoria = 'Sobrepeso';
        else categoria = 'Obesidad';
        
        document.getElementById('imcCategoria').textContent = categoria;
        
        // Llenar campos
        document.getElementById('inputPeso').value = ultimaMedida.peso;
        document.getElementById('inputAltura').value = ultimaMedida.altura;
    }
    
    // Generar gráfico de peso
    generatePesoChart();
}

function registrarMedida() {
    const peso = parseFloat(document.getElementById('inputPeso').value);
    const altura = parseFloat(document.getElementById('inputAltura').value);
    
    if (!peso || !altura) {
        alert('Por favor completa peso y altura');
        return;
    }
    
    const nuevaMedida = {
        id: database.medidas.length + 1,
        socioId: currentUser.socioId,
        fecha: getTodayString(),
        peso: peso,
        altura: altura
    };
    
    database.medidas.push(nuevaMedida);
    
    alert('Medida registrada correctamente');
    updateMedidasDisplay();
    updateHistorialMedidas();
}

function generatePesoChart() {
    const container = document.getElementById('pesoChartSimple');
    const medidas = database.medidas
        .filter(m => m.socioId === currentUser.socioId)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(-6);
    
    if (medidas.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay datos registrados</p>';
        return;
    }
    
    const maxPeso = Math.max(...medidas.map(m => m.peso));
    const minPeso = Math.min(...medidas.map(m => m.peso));
    const range = maxPeso - minPeso || 1;
    
    container.innerHTML = medidas.map(m => {
        const height = ((m.peso - minPeso) / range) * 80 + 20;
        const fecha = new Date(m.fecha + 'T00:00:00');
        const fechaCorta = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
        
        return `
            <div class="chart-column" style="height: ${height}%">
                <span class="chart-label">${fechaCorta}<br>${m.peso}kg</span>
            </div>
        `;
    }).join('');
}

function updateRacha() {
    const asistencias = database.asistencias
        .filter(a => a.socioId === currentUser.socioId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    let racha = 0;
    const today = new Date();
    
    for (let i = 0; i < asistencias.length; i++) {
        const fechaAsist = new Date(asistencias[i].fecha + 'T00:00:00');
        const diffDays = Math.floor((today - fechaAsist) / (1000 * 60 * 60 * 24));
        
        if (diffDays === racha || (racha === 0 && diffDays <= 1)) {
            racha++;
        } else {
            break;
        }
    }
    
    document.getElementById('rachaActual').textContent = racha;
    
    // Generar calendario mini
    generateCalendarioRacha();
}

function generateCalendarioRacha() {
    const container = document.getElementById('calendarioRacha');
    const today = new Date();
    const dias = [];
    
    for (let i = 20; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dias.push(date);
    }
    
    container.innerHTML = dias.map(dia => {
        const dateStr = dia.toISOString().split('T')[0];
        const tieneAsistencia = database.asistencias.some(a => 
            a.socioId === currentUser.socioId && a.fecha === dateStr
        );
        
        return `<div class="calendar-day ${tieneAsistencia ? 'active' : ''}">${dia.getDate()}</div>`;
    }).join('');
}

function updateLogros() {
    const container = document.getElementById('logrosGrid');
    const asistencias = database.asistencias.filter(a => a.socioId === currentUser.socioId);
    
    const logros = [
        { id: 1, nombre: 'Primera Vez', icon: 'fa-star', requisito: 1 },
        { id: 2, nombre: '10 Días', icon: 'fa-medal', requisito: 10 },
        { id: 3, nombre: '30 Días', icon: 'fa-trophy', requisito: 30 },
        { id: 4, nombre: '50 Días', icon: 'fa-crown', requisito: 50 },
        { id: 5, nombre: '100 Días', icon: 'fa-fire', requisito: 100 },
        { id: 6, nombre: 'Constante', icon: 'fa-check-circle', requisito: 20 }
    ];
    
    container.innerHTML = logros.map(logro => {
        const desbloqueado = asistencias.length >= logro.requisito;
        return `
            <div class="logro-item ${desbloqueado ? 'desbloqueado' : 'bloqueado'}">
                <div class="logro-icon">
                    <i class="fas ${logro.icon}"></i>
                </div>
                <p class="logro-name">${logro.nombre}</p>
            </div>
        `;
    }).join('');
}

function updateHistorialMedidas() {
    const tbody = document.getElementById('tablaMedidas');
    const medidas = database.medidas
        .filter(m => m.socioId === currentUser.socioId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    if (medidas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay medidas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = medidas.map(m => {
        const imc = (m.peso / ((m.altura / 100) ** 2)).toFixed(1);
        return `
            <tr>
                <td>${formatDate(m.fecha)}</td>
                <td>${m.peso}</td>
                <td>${m.altura}</td>
                <td>${imc}</td>
            </tr>
        `;
    }).join('');
}

// ============================================
// MÓDULO PERFIL
// ============================================

function initPerfilModule() {
    document.getElementById('formDatosPersonales').addEventListener('submit', guardarDatosPersonales);
    document.getElementById('formEmergencia').addEventListener('submit', guardarContactoEmergencia);
    document.getElementById('formMedico').addEventListener('submit', guardarInformacionMedica);
    document.getElementById('formCambiarPassword').addEventListener('submit', cambiarPassword);
    
    updatePerfilModule();
}

function updatePerfilModule() {
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) return;
    
    // Información del header
    document.getElementById('perfilNombreCompleto').textContent = socio.nombre;
    document.getElementById('perfilEmail').textContent = socio.email;
    document.getElementById('perfilMiembroDesde').textContent = formatDate(socio.fechaAlta);
    document.getElementById('perfilEstado').textContent = socio.estado;
    document.getElementById('perfilPlan').textContent = socio.plan;
    
    // Formulario de datos personales
    document.getElementById('editNombre').value = socio.nombre;
    document.getElementById('editDni').value = socio.dni;
    document.getElementById('editEmail').value = socio.email;
    document.getElementById('editTelefono').value = socio.telefono;
    document.getElementById('editFechaNacimiento').value = socio.fechaNacimiento || '';
    document.getElementById('editGenero').value = socio.genero || '';
    
    // Contacto de emergencia
    if (socio.contactoEmergencia) {
        document.getElementById('emergenciaNombre').value = socio.contactoEmergencia.nombre || '';
        document.getElementById('emergenciaRelacion').value = socio.contactoEmergencia.relacion || '';
        document.getElementById('emergenciaTelefono').value = socio.contactoEmergencia.telefono || '';
    }
    
    // Información médica
    if (socio.informacionMedica) {
        document.getElementById('grupoSanguineo').value = socio.informacionMedica.grupoSanguineo || '';
        document.getElementById('alergias').value = socio.informacionMedica.alergias || '';
        document.getElementById('lesiones').value = socio.informacionMedica.lesiones || '';
    }
}

function guardarDatosPersonales(e) {
    e.preventDefault();
    
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) return;
    
    socio.nombre = document.getElementById('editNombre').value;
    socio.email = document.getElementById('editEmail').value;
    socio.telefono = document.getElementById('editTelefono').value;
    socio.fechaNacimiento = document.getElementById('editFechaNacimiento').value;
    socio.genero = document.getElementById('editGenero').value;
    
    // Actualizar también el nombre en el usuario
    currentUser.nombre = socio.nombre;
    database.usuarios.find(u => u.id === currentUser.id).nombre = socio.nombre;
    
    alert('Datos personales actualizados correctamente');
    updatePerfilModule();
    document.getElementById('welcomeText').textContent = `Bienvenido, ${currentUser.nombre}`;
}

function guardarContactoEmergencia(e) {
    e.preventDefault();
    
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) return;
    
    socio.contactoEmergencia = {
        nombre: document.getElementById('emergenciaNombre').value,
        relacion: document.getElementById('emergenciaRelacion').value,
        telefono: document.getElementById('emergenciaTelefono').value
    };
    
    alert('Contacto de emergencia guardado correctamente');
}

function guardarInformacionMedica(e) {
    e.preventDefault();
    
    const socio = database.socios.find(s => s.id === currentUser.socioId);
    if (!socio) return;
    
    socio.informacionMedica = {
        grupoSanguineo: document.getElementById('grupoSanguineo').value,
        alergias: document.getElementById('alergias').value,
        lesiones: document.getElementById('lesiones').value
    };
    
    alert('Información médica guardada correctamente');
}

function cambiarPassword(e) {
    e.preventDefault();
    
    const actual = document.getElementById('passwordActual').value;
    const nueva = document.getElementById('passwordNueva').value;
    const confirmar = document.getElementById('passwordConfirmar').value;
    
    const usuario = database.usuarios.find(u => u.id === currentUser.id);
    
    if (usuario.password !== actual) {
        alert('La contraseña actual es incorrecta');
        return;
    }
    
    if (nueva !== confirmar) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    if (nueva.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    usuario.password = nueva;
    
    alert('Contraseña cambiada correctamente');
    
    // Limpiar campos
    document.getElementById('passwordActual').value = '';
    document.getElementById('passwordNueva').value = '';
    document.getElementById('passwordConfirmar').value = '';
}

function cambiarFoto() {
    alert('Funcionalidad de cambio de foto. Aquí se implementaría la carga de imagen.');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'flex';
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
});pagos.forEach(pago => {
            mensaje += `Fecha: ${formatDate(pago.fecha)}\n`;
            mensaje += `Monto: ${formatCurrency(pago.monto)}\n`;
            mensaje += `Método: ${pago.metodoPago}\n`;
            mensaje += `Concepto: ${pago.concepto}\n\n`;
        });
        
        alert(mensaje);

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'flex';
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
});