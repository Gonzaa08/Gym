document.getElementById("btnRegistrarPago").addEventListener("click", registrarPago);
    updatePagosTable();

async function registrarPago() {
    const socio_id = parseInt(document.getElementById("socioSeleccionado").value);
    const monto = parseFloat(document.getElementById("montoPago").value);
    const metodo_pago = document.getElementById("metodoPago").value;

    if (!socio_id || !monto) {
        alert("Por favor complete todos los campos");
        return;
    }

    const btn = document.getElementById("btnRegistrarPago");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    const data = await apiRequest('pagos.php', {
        method: 'POST',
        body: JSON.stringify({ socio_id, monto, metodo_pago, concepto: 'Cuota Mensual' })
    });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (data.success) {
        document.getElementById("socioSeleccionado").value = "";
        document.getElementById("montoPago").value = "";
        alert("Pago registrado correctamente");
        updatePagosTable();
        updateDashboard();
        if (activeModule === "socios") updateSociosTable();
    } else {
        alert(data.message || "Error al registrar pago");
    }
}

async function updatePagosTable() {
    const tbody = document.getElementById("tablaPagos");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    const data = await apiRequest('pagos.php?action=all');
    if (!data.success) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar pagos</td></tr>';
        return;
    }

    if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pagos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = data.data.map(pago => `
        <tr>
            <td>${pago.socio_nombre}</td>
            <td style="font-weight: 600; color: var(--success-color);">${formatCurrency(pago.monto)}</td>
            <td>${formatDate(pago.fecha)}</td>
            <td>${pago.metodo_pago}</td>
            <td>${pago.concepto}</td>
            <td>
                <button class="btn-ticket" onclick="generarTicket(${pago.id})">
                    <i class="fas fa-receipt"></i> Ticket
                </button>
            </td>
        </tr>
    `).join("");
}

async function generarTicket(pagoId) {
    const data = await apiRequest(`pagos.php?id=${pagoId}`);
    if (!data.success) {
        alert("Error al generar el ticket");
        return;
    }

    const pago = data.data;
    const ticketContent = document.getElementById("ticketContent");
    ticketContent.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-logo"><i class="fas fa-dumbbell"></i></div>
            <h2>The Best Gym</h2>
            <p>Sistema de Gestión</p>
            <div class="ticket-divider"></div>
        </div>
        <div class="ticket-body">
            <div class="ticket-section">
                <h3>Comprobante de Pago</h3>
                <p class="ticket-number">N° ${String(pago.id).padStart(6, "0")}</p>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-section">
                <div class="ticket-row"><span class="ticket-label">Fecha:</span><span class="ticket-value">${formatDate(pago.fecha)}</span></div>
                <div class="ticket-row"><span class="ticket-label">Hora:</span><span class="ticket-value">${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span></div>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-section">
                <h4>Datos del Socio</h4>
                <div class="ticket-row"><span class="ticket-label">Nombre:</span><span class="ticket-value">${pago.socio_nombre}</span></div>
                <div class="ticket-row"><span class="ticket-label">DNI:</span><span class="ticket-value">${pago.dni}</span></div>
                <div class="ticket-row"><span class="ticket-label">Plan:</span><span class="ticket-value">${pago.plan}</span></div>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-section">
                <h4>Detalle del Pago</h4>
                <div class="ticket-row"><span class="ticket-label">Concepto:</span><span class="ticket-value">${pago.concepto}</span></div>
                <div class="ticket-row"><span class="ticket-label">Método:</span><span class="ticket-value">${pago.metodo_pago}</span></div>
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
    document.getElementById("ticketModal").style.display = "flex";
}

function cerrarTicket() {
    document.getElementById("ticketModal").style.display = "none";
}

function imprimirTicket() {
    window.print();
}

function descargarTicket() {
    alert('Funcionalidad de descarga PDF próximamente.\nPor ahora usa "Imprimir" y selecciona "Guardar como PDF"');
}

// MÓDULO PLANES
function initPlanesModule() {
    updatePlanesGrid();
}

async function updatePlanesGrid() {
    const grid = document.getElementById("planesGrid");
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Cargando planes...</div>';

    const data = await apiRequest('planes.php?action=all');
    if (!data.success) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Error al cargar planes</div>';
        return;
    }

    cache.planes = data.data;
    if (data.data.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay planes disponibles</div>';
        return;
    }

    grid.innerHTML = data.data.map(plan => `
        <div class="plan-card">
            <h3>${plan.nombre}</h3>
            <p class="plan-description">${plan.descripcion}</p>
            <div class="plan-price">
                <div class="price">${formatCurrency(plan.costo)}</div>
                <div class="duration">${plan.duracion} días</div>
            </div>
            <button class="btn-primary" onclick="seleccionarPlan(${plan.id})">Seleccionar Plan</button>
        </div>
    `).join("");
}

function seleccionarPlan(id) {
    const plan = cache.planes?.find(p => p.id === id);
    if (plan) {
        alert(`Has seleccionado el plan: ${plan.nombre}\n\nCosto: ${formatCurrency(plan.costo)}\nDuración: ${plan.duracion} días`);
    }
}

// MÓDULO CLASES E INSTRUCTORES
let claseSeleccionadaId = null;

function initClasesInstructoresModule() {
    updateClasesTable();
    updateInstructoresGrid();
}

async function updateClasesTable() {
    const tbody = document.getElementById("tablaClasesGym");
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';

    const data = await apiRequest('clases.php?action=gym');
    if (!data.success) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar clases</td></tr>';
        return;
    }

    cache.clasesGym = data.data;
    tbody.innerHTML = data.data.map(clase => {
        const instructorNombre = clase.instructor_nombre || null;
        return `
            <tr>
                <td><div style="font-weight: 500; color: var(--text-dark);">${clase.nombre}</div></td>
                <td><span class="badge-tipo badge-tipo-${clase.tipo.toLowerCase().replace(/\s/g, "")}">${clase.tipo}</span></td>
                <td><div style="display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-calendar-alt" style="color: var(--text-light); font-size: 12px;"></i>${clase.horario}
                </div></td>
                <td>${clase.duracion}</td>
                <td><span class="cupo-badge-instructor"><i class="fas fa-users"></i> ${clase.cupo_maximo}</span></td>
                <td>${instructorNombre ? 
                    `<div class="instructor-assigned"><i class="fas fa-user-check"></i><span>${instructorNombre}</span></div>` : 
                    `<span class="no-instructor">Sin asignar</span>`}
                </td>
                <td>${currentUser.rol === "Administrador" ? `
                    <button class="btn-asignar-instructor" onclick="abrirModalAsignar(${clase.id})">
                        <i class="fas fa-user-plus"></i> ${instructorNombre ? "Reasignar" : "Asignar"}
                    </button>
                ` : '<span style="color: var(--text-light); font-size: 13px;">-</span>'}
                </td>
            </tr>
        `;
    }).join("");
}

async function updateInstructoresGrid() {
    const grid = document.getElementById("instructoresGrid");
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Cargando instructores...</div>';

    const data = await apiRequest('instructores.php?action=all');
    if (!data.success) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Error al cargar instructores</div>';
        return;
    }

    cache.instructores = data.data;
    grid.innerHTML = data.data.map(instructor => `
        <div class="instructor-card">
            <div class="instructor-avatar-custom"><i class="fas fa-user-tie"></i></div>
            <div class="instructor-info-custom">
                <h4>${instructor.nombre}</h4>
                <p class="instructor-especialidad-custom"><i class="fas fa-star"></i> ${instructor.especialidad}</p>
                <p class="instructor-contacto-custom"><i class="fas fa-envelope"></i> ${instructor.email}</p>
                <p class="instructor-contacto-custom"><i class="fas fa-phone"></i> ${instructor.telefono}</p>
            </div>
            <div class="instructor-stats-custom">
                <div class="stat-item-instructor">
                    <span class="stat-number-instructor">${instructor.clases_asignadas || 0}</span>
                    <span class="stat-label-instructor">Clases</span>
                </div>
                <div class="stat-status-instructor ${instructor.activo ? "status-active-instructor" : "status-inactive-instructor"}">
                    <i class="fas fa-circle"></i> ${instructor.activo ? "Activo" : "Inactivo"}
                </div>
            </div>
        </div>
    `).join("");
}

async function abrirModalAsignar(claseId) {
    if (currentUser.rol !== "Administrador") {
        alert("Solo el administrador puede asignar instructores");
        return;
    }

    claseSeleccionadaId = claseId;
    const clase = cache.clasesGym?.find(c => c.id === claseId);
    if (!clase) {
        alert("Clase no encontrada");
        return;
    }

    document.getElementById("claseSeleccionadaNombre").textContent = clase.nombre;
    document.getElementById("claseSeleccionadaHorario").textContent = clase.horario;
    document.getElementById("claseSeleccionadaTipo").textContent = clase.tipo;

    const select = document.getElementById("instructorSelect");
    select.innerHTML = '<option value="">-- Sin instructor asignado --</option>';
    
    if (cache.instructores) {
        select.innerHTML += cache.instructores.filter(i => i.activo).map(i => `
            <option value="${i.id}" ${clase.instructor_id === i.id ? "selected" : ""}>
                ${i.nombre} - ${i.especialidad}
            </option>
        `).join("");
    }

    select.onchange = mostrarPreviewInstructor;
    if (clase.instructor_id) mostrarPreviewInstructor();
    document.getElementById("asignarInstructorModal").style.display = "flex";
}

function mostrarPreviewInstructor() {
    const instructorId = parseInt(document.getElementById("instructorSelect").value);
    const preview = document.getElementById("instructorPreview");

    if (!instructorId) {
        preview.style.display = "none";
        return;
    }

    const instructor = cache.instructores?.find(i => i.id === instructorId);
    if (!instructor) {
        preview.style.display = "none";
        return;
    }

    preview.innerHTML = `
        <div class="preview-header-instructor"><i class="fas fa-info-circle"></i><span>Vista previa del instructor</span></div>
        <div class="preview-content-instructor">
            <div class="preview-avatar-instructor"><i class="fas fa-user-tie"></i></div>
            <div class="preview-details-instructor">
                <h4>${instructor.nombre}</h4>
                <p><strong>Especialidad:</strong> ${instructor.especialidad}</p>
                <p><strong>Email:</strong> ${instructor.email}</p>
                <p><strong>Clases actuales:</strong> ${instructor.clases_asignadas || 0}</p>
            </div>
        </div>
    `;
    preview.style.display = "block";
}

async function confirmarAsignacion() {
    if (!claseSeleccionadaId) return;

    const instructorId = document.getElementById("instructorSelect").value;
    const instructorIdNum = instructorId ? parseInt(instructorId) : null;

    const data = await apiRequest('clases.php', {
        method: 'PUT',
        body: JSON.stringify({
            action: 'asignar_instructor',
            clase_id: claseSeleccionadaId,
            instructor_id: instructorIdNum
        })
    });

    if (data.success) {
        alert(data.message);
        updateClasesTable();
        updateInstructoresGrid();
        cerrarModalAsignar();
    } else {
        alert(data.message || "Error al asignar instructor");
    }
}

function cerrarModalAsignar() {
    document.getElementById("asignarInstructorModal").style.display = "none";
    document.getElementById("instructorPreview").style.display = "none";
    claseSeleccionadaId = null;
}

// MÓDULO TURNOS
function initTurnosModule() {
    document.getElementById("filterDia").addEventListener("change", updateClasesDisponibles);
    document.getElementById("filterActividad").addEventListener("change", updateClasesDisponibles);
    updateTurnosModule();
}

async function updateTurnosModule() {
    await updateClasesDisponibles();
    await updateMisTurnos();
}

async function updateClasesDisponibles() {
    const filterDia = document.getElementById("filterDia").value;
    const filterActividad = document.getElementById("filterActividad").value;
    const container = document.getElementById("clasesDisponibles");

    container.innerHTML = '<p class="text-center" style="padding: 20px;">Cargando clases...</p>';

    const data = await apiRequest('clases.php?action=all');
    if (!data.success) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">Error al cargar clases</p>';
        return;
    }

    let clasesFiltered = data.data;
    if (filterDia) clasesFiltered = clasesFiltered.filter(c => c.dia === filterDia);
    if (filterActividad) clasesFiltered = clasesFiltered.filter(c => c.nombre === filterActividad);

    if (clasesFiltered.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">No hay clases disponibles con estos filtros</p>';
        return;
    }

    const turnosData = await apiRequest(`clases.php?action=mis_turnos&socio_id=${currentUser.socioId}`);
    const misTurnosIds = turnosData.success ? turnosData.data.map(t => t.clase_id) : [];

    container.innerHTML = clasesFiltered.map(clase => {
        const cuposDisponibles = clase.cupos_total - clase.cupos_ocupados;
        const porcentaje = (clase.cupos_ocupados / clase.cupos_total) * 100;
        let cuposClass = "cupos-disponible";
        let cuposText = `${cuposDisponibles} cupos disponibles`;
        let btnDisabled = false;

        if (cuposDisponibles === 0) {
            cuposClass = "cupos-lleno";
            cuposText = "Completo";
            btnDisabled = true;
        } else if (porcentaje >= 80) {
            cuposClass = "cupos-limitado";
            cuposText = `Solo ${cuposDisponibles} cupos`;
        }

        const yaReservado = misTurnosIds.includes(clase.id);

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
                <button class="btn-reservar" onclick="reservarClase(${clase.id})" ${btnDisabled || yaReservado ? "disabled" : ""}>
                    ${yaReservado ? "Ya Reservado" : "Reservar"}
                </button>
            </div>
        `;
    }).join("");
}

async function updateMisTurnos() {
    const container = document.getElementById("misTurnosReservados");
    container.innerHTML = '<p class="text-center" style="padding: 20px;">Cargando turnos...</p>';

    const data = await apiRequest(`clases.php?action=mis_turnos&socio_id=${currentUser.socioId}`);
    if (!data.success || data.data.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light); padding: 20px;">No tienes turnos reservados</p>';
        return;
    }

    container.innerHTML = data.data.map(turno => `
        <div class="turno-item">
            <h4>${turno.nombre}</h4>
            <p><i class="fas fa-calendar"></i> ${turno.dia} - ${formatDate(turno.fecha)}</p>
            <p><i class="fas fa-clock"></i> ${turno.hora} (${turno.duracion} min)</p>
            <p><i class="fas fa-user"></i> ${turno.instructor}</p>
            <button class="btn-cancelar" onclick="cancelarTurno(${turno.id})">
                <i class="fas fa-times"></i> Cancelar Turno
            </button>
        </div>
    `).join("");
}

async function reservarClase(claseId) {
    const fecha = getNextClassDate("Lunes");
    const data = await apiRequest('clases.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'reservar',
            socio_id: currentUser.socioId,
            clase_id: claseId,
            fecha: fecha
        })
    });

    if (data.success) {
        alert(data.message);
        updateTurnosModule();
    } else {
        alert(data.message || "Error al reservar turno");
    }
}

async function cancelarTurno(turnoId) {
    if (!confirm("¿Estás seguro de cancelar este turno?")) return;

    const data = await apiRequest(`clases.php?id=${turnoId}`, { method: 'DELETE' });
    if (data.success) {
        alert("Turno cancelado exitosamente");
        updateTurnosModule();
    } else {
        alert(data.message || "Error al cancelar turno");
    }
}

function getNextClassDate(dia) {
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const today = new Date();
    const targetDay = dias.indexOf(dia);
    const currentDay = today.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);
    return nextDate.toISOString().split("T")[0];
}

// MÓDULO MI PLAN
function initMiPlanModule() {
    updateMiPlan();
}

async function updateMiPlan() {
    if (currentUser.rol !== "Socio") return;

    const socioData = await apiRequest(`socios.php?id=${currentUser.socioId}`);
    if (!socioData.success) {
        document.querySelector(".my-plan-container").innerHTML = '<p class="text-center">No se encontró información del socio</p>';
        return;
    }

    const socio = socioData.data;
    const planData = await apiRequest(`planes.php?nombre=${encodeURIComponent(socio.plan)}`);
    const plan = planData.success ? planData.data : null;

    document.getElementById("miPlanNombre").textContent = socio.plan;
    document.getElementById("miPlanEstado").textContent = socio.estado;
    document.getElementById("miPlanFechaInicio").textContent = formatDate(socio.fecha_alta);
    document.getElementById("miPlanVencimiento").textContent = formatDate(socio.vencimiento);
    document.getElementById("miPlanCosto").textContent = plan ? formatCurrency(plan.costo) : "-";

    const today = new Date();
    const vencimiento = new Date(socio.vencimiento + "T00:00:00");
    const diasRestantes = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));
    document.getElementById("miPlanDiasRestantes").textContent = diasRestantes > 0 ? `${diasRestantes} días` : "Vencido";

    const fechaInicio = new Date(socio.fecha_alta + "T00:00:00");
    const duracionTotal = plan ? plan.duracion : 30;
    const diasTranscurridos = Math.ceil((today - fechaInicio) / (1000 * 60 * 60 * 24));
    const progreso = Math.min(100, Math.round((diasTranscurridos / duracionTotal) * 100));

    document.getElementById("planProgressPercent").textContent = progreso + "%";
    document.getElementById("planProgressBar").style.width = progreso + "%";

    const asistenciasData = await apiRequest(`asistencias.php?socio_id_mes=${currentUser.socioId}`);
    if (asistenciasData.success) {
        document.getElementById("misAsistenciasMes").textContent = asistenciasData.data.total;
    }

    document.getElementById("proximoPagoMonto").textContent = plan ? formatCurrency(plan.costo) : "$0";
    document.getElementById("proximoPagoFecha").textContent = formatDate(socio.vencimiento);

    const pagosData = await apiRequest(`pagos.php?action=total_socio&socio_id=${currentUser.socioId}`);
    if (pagosData.success) {
        document.getElementById("ultimosPagosCount").textContent = pagosData.data.cantidad;
        document.getElementById("totalPagado").textContent = formatCurrency(pagosData.data.total);
    }

    const estadoBadge = document.getElementById("estadoCuenta");
    if (socio.estado === "Activo") {
        estadoBadge.textContent = "Al día";
        estadoBadge.className = "status-badge";
    } else {
        estadoBadge.textContent = "Moroso";
        estadoBadge.className = "status-badge moroso";
    }

    await updateMiHistorialAsistencias(currentUser.socioId);
}

async function updateMiHistorialAsistencias(socioId) {
    const tbody = document.getElementById("miHistorialAsistencias");
    const data = await apiRequest(`asistencias.php?socio_id=${socioId}`);

    if (!data.success || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay asistencias registradas</td></tr>';
        return;
    }

    tbody.innerHTML = data.data.slice(0, 10).map(asistencia => `
        <tr>
            <td>${formatDate(asistencia.fecha)}</td>
            <td>${asistencia.hora}</td>
            <td><span class="badge badge-active">Completado</span></td>
        </tr>
    `).join("");
}

function renovarPlan() {
    alert("Funcionalidad de renovación de plan. Aquí se procesaría el pago.");
}

async function verHistorialPagos() {
    if (currentUser.rol === "Socio") {
        const data = await apiRequest(`pagos.php?socio_id=${currentUser.socioId}`);
        if (!data.success || data.data.length === 0) {
            alert("No hay pagos registrados");
            return;
        }

        let mensaje = "HISTORIAL DE PAGOS\n\n";
        data.data.forEach(pago => {
            mensaje += `Fecha: ${formatDate(pago.fecha)}\nMonto: ${formatCurrency(pago.monto)}\nMétodo: ${pago.metodo_pago}\nConcepto: ${pago.concepto}\n\n`;
        });
        alert(mensaje);
    }
}

// MÓDULO PERFIL
function initPerfilModule() {
    document.getElementById("formDatosPersonales").addEventListener("submit", guardarDatosPersonales);
    document.getElementById("formEmergencia").addEventListener("submit", guardarContactoEmergencia);
    document.getElementById("formMedico").addEventListener("submit", guardarInformacionMedica);
    document.getElementById("formCambiarPassword").addEventListener("submit", cambiarPassword);
    updatePerfilModule();
}

async function updatePerfilModule() {
    const socioData = await apiRequest(`socios.php?id=${currentUser.socioId}`);
    if (!socioData.success) return;
    
    const socio = socioData.data;
    document.getElementById("perfilNombreCompleto").textContent = socio.nombre;
    document.getElementById("perfilEmail").textContent = socio.email;
    document.getElementById("perfilMiembroDesde").textContent = formatDate(socio.fecha_alta);
    document.getElementById("perfilEstado").textContent = socio.estado;
    document.getElementById("perfilPlan").textContent = socio.plan;

    document.getElementById("editNombre").value = socio.nombre;
    document.getElementById("editDni").value = socio.dni;
    document.getElementById("editEmail").value = socio.email;
    document.getElementById("editTelefono").value = socio.telefono || '';
    document.getElementById("editFechaNacimiento").value = socio.fecha_nacimiento || "";
    document.getElementById("editGenero").value = socio.genero || "";

    document.getElementById("emergenciaNombre").value = socio.emergencia_nombre || "";
    document.getElementById("emergenciaRelacion").value = socio.emergencia_relacion || "";
    document.getElementById("emergenciaTelefono").value = socio.emergencia_telefono || "";

    document.getElementById("grupoSanguineo").value = socio.grupo_sanguineo || "";
    document.getElementById("alergias").value = socio.alergias || "";
    document.getElementById("lesiones").value = socio.lesiones || "";
}

async function guardarDatosPersonales(e) {
    e.preventDefault();
    const data = await apiRequest('socios.php', {
        method: 'PUT',
        body: JSON.stringify({
            id: currentUser.socioId,
            nombre: document.getElementById("editNombre").value,
            email: document.getElementById("editEmail").value,
            telefono: document.getElementById("editTelefono").value,
            plan: document.getElementById("perfilPlan").textContent,
            fecha_nacimiento: document.getElementById("editFechaNacimiento").value,
            genero: document.getElementById("editGenero").value,
            emergencia_nombre: document.getElementById("emergenciaNombre").value,
            emergencia_relacion: document.getElementById("emergenciaRelacion").value,
            emergencia_telefono: document.getElementById("emergenciaTelefono").value,
            grupo_sanguineo: document.getElementById("grupoSanguineo").value,
            alergias: document.getElementById("alergias").value,
            lesiones: document.getElementById("lesiones").value
        })
    });

    if (data.success) {
        alert("Datos personales actualizados correctamente");
        currentUser.nombre = document.getElementById("editNombre").value;
        document.getElementById("welcomeText").textContent = `Bienvenido, ${currentUser.nombre}`;
        updatePerfilModule();
    } else {
        alert(data.message || "Error al actualizar datos");
    }
}

async function guardarContactoEmergencia(e) {
    e.preventDefault();
    const data = await apiRequest('socios.php', {
        method: 'PUT',
        body: JSON.stringify({
            id: currentUser.socioId,
            nombre: document.getElementById("editNombre").value,
            email: document.getElementById("editEmail").value,
            telefono: document.getElementById("editTelefono").value,
            plan: document.getElementById("perfilPlan").textContent,
            emergencia_nombre: document.getElementById("emergenciaNombre").value,
            emergencia_relacion: document.getElementById("emergenciaRelacion").value,
            emergencia_telefono: document.getElementById("emergenciaTelefono").value
        })
    });

    if (data.success) {
        alert("Contacto de emergencia guardado correctamente");
    } else {
        alert(data.message || "Error al guardar contacto");
    }
}

async function guardarInformacionMedica(e) {
    e.preventDefault();
    const data = await apiRequest('socios.php', {
        method: 'PUT',
        body: JSON.stringify({
            id: currentUser.socioId,
            nombre: document.getElementById("editNombre").value,
            email: document.getElementById("editEmail").value,
            telefono: document.getElementById("editTelefono").value,
            plan: document.getElementById("perfilPlan").textContent,
            grupo_sanguineo: document.getElementById("grupoSanguineo").value,
            alergias: document.getElementById("alergias").value,
            lesiones: document.getElementById("lesiones").value
        })
    });

    if (data.success) {
        alert("Información médica guardada correctamente");
    } else {
        alert(data.message || "Error al guardar información médica");
    }
}

async function cambiarPassword(e) {
    e.preventDefault();
    const actual = document.getElementById("passwordActual").value;
    const nueva = document.getElementById("passwordNueva").value;
    const confirmar = document.getElementById("passwordConfirmar").value;

    if (nueva !== confirmar) {
        alert("Las contraseñas no coinciden");
        return;
    }

    if (nueva.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    const data = await apiRequest('usuarios.php', {
        method: 'PUT',
        body: JSON.stringify({
            id: currentUser.id,
            nombre: currentUser.nombre,
            password: nueva
        })
    });

    if (data.success) {
        alert("Contraseña cambiada correctamente");
        document.getElementById("passwordActual").value = "";
        document.getElementById("passwordNueva").value = "";
        document.getElementById("passwordConfirmar").value = "";
    } else {
        alert(data.message || "Error al cambiar contraseña");
    }
}

function cambiarFoto() {
    alert("Funcionalidad de cambio de foto. Aquí se implementaría la carga de imagen.");
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    initLogin();
});// ============================================
// THE BEST GYM - SISTEMA DE GESTIÓN
// Script.js - Versión con integración a MySQL
// ============================================

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
let currentUser = null;
let activeModule = "dashboard";
let cache = {
    socios: null,
    planes: null,
    instructores: null,
    clases: null,
    clasesGym: null,
    lastUpdate: null
};

// FUNCIONES DE UTILIDAD
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

// SISTEMA DE LOGIN
function initLogin() {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("loginError");
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
        submitBtn.disabled = true;

        const data = await apiRequest(
            `usuarios.php?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        );

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            currentUser = data.data;
            errorDiv.style.display = "none";
            showMainSystem();
        } else {
            errorDiv.style.display = "flex";
            errorDiv.querySelector('span').textContent = data.message || 'Credenciales incorrectas';
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
    cache = { socios: null, planes: null, instructores: null, clases: null, clasesGym: null, lastUpdate: null };
    document.getElementById("mainSystem").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// SISTEMA PRINCIPAL
function initMainSystem() {
    document.getElementById("userRole").textContent = currentUser.rol;
    document.getElementById("welcomeText").textContent = `Bienvenido, ${currentUser.nombre}`;
    document.getElementById("currentDate").textContent = getCurrentDate();
    
    generateMenu();
    initDashboard();
    initSociosModule();
    initAsistenciasModule();
    initPagosModule();
    initClasesInstructoresModule();
    initPlanesModule();
    initMiPlanModule();
    initTurnosModule();
    initPerfilModule();
    
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
        { id: "socios", label: "Socios", icon: "fa-users", roles: ["Administrador", "Recepcionista"] },
        { id: "asistencias", label: "Asistencias", icon: "fa-calendar-check", roles: ["Recepcionista"] },
        { id: "pagos", label: "Pagos", icon: "fa-dollar-sign", roles: ["Administrador", "Recepcionista"] },
        { id: "clasesInstructores", label: "Clases", icon: "fa-chalkboard-teacher", roles: ["Administrador"] },
        { id: "planes", label: "Planes", icon: "fa-file-alt", roles: ["Administrador", "Recepcionista"] },
        { id: "perfil", label: "Mi Perfil", icon: "fa-user-circle", roles: ["Socio"] },
        { id: "miPlan", label: "Mi Plan", icon: "fa-id-card", roles: ["Socio"] },
        { id: "turnos", label: "Mis Turnos", icon: "fa-calendar-alt", roles: ["Socio"] },
    ];

    if (!currentUser) return;
    menuItems.filter((item) => item.roles.includes(currentUser.rol)).forEach((item) => {
        const button = document.createElement("button");
        button.className = "nav-item";
        button.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
        button.addEventListener("click", (e) => showModule(item.id, e));
        nav.appendChild(button);
    });
}

function showModule(moduleName, event) {
    document.querySelectorAll(".module").forEach((module) => module.style.display = "none");
    document.getElementById(moduleName + "Module").style.display = "block";
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    
    if (event && event.target) {
        event.target.closest(".nav-item").classList.add("active");
    } else {
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach((item) => {
            if (item.querySelector("span") && item.querySelector("span").textContent === getModuleLabel(moduleName)) {
                item.classList.add("active");
            }
        });
    }
    
    activeModule = moduleName;
    switch (moduleName) {
        case "dashboard": updateDashboard(); break;
        case "socios": updateSociosTable(); break;
        case "asistencias": updateAsistenciasTable(); break;
        case "pagos": updatePagosTable(); break;
        case "clasesInstructores": updateClasesTable(); updateInstructoresGrid(); break;
        case "planes": updatePlanesGrid(); break;
        case "miPlan": updateMiPlan(); break;
        case "turnos": updateTurnosModule(); break;
        case "perfil": updatePerfilModule(); break;
    }
}

function getModuleLabel(moduleId) {
    const labels = {
        dashboard: "Dashboard", socios: "Socios", asistencias: "Asistencias",
        pagos: "Pagos", clasesInstructores: "Clases", planes: "Planes",
        miPlan: "Mi Plan", turnos: "Mis Turnos", perfil: "Mi Perfil"
    };
    return labels[moduleId] || "";
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// MÓDULO DASHBOARD
function initDashboard() {
    updateDashboard();
}

async function updateDashboard() {
    const sociosStats = await apiRequest('socios.php?action=stats');
    if (sociosStats.success) {
        document.getElementById("sociosActivos").textContent = sociosStats.data.activos;
        document.getElementById("sociosMorosos").textContent = sociosStats.data.morosos;
    }

    const asistenciasStats = await apiRequest('asistencias.php?action=stats');
    if (asistenciasStats.success) {
        document.getElementById("asistenciasHoy").textContent = asistenciasStats.data.hoy;
    }

    const ingresosData = await apiRequest('pagos.php?action=ingresos_mes');
    if (ingresosData.success) {
        document.getElementById("ingresosDelMes").textContent = formatCurrency(ingresosData.data.total);
    }

    await updateAlertasVencimiento();
    await updateUltimasAsistencias();
}

async function updateAlertasVencimiento() {
    const container = document.getElementById("alertasVencimiento");
    const data = await apiRequest('socios.php?action=morosos');
    
    if (!data.success || data.data.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay alertas de vencimiento</p>';
        return;
    }

    container.innerHTML = data.data.map(socio => `
        <div class="alert-item">
            <div class="alert-item-info">
                <p>${socio.nombre}</p>
                <p>Vencimiento: ${formatDate(socio.vencimiento)}</p>
            </div>
            <i class="fas fa-exclamation-circle"></i>
        </div>
    `).join("");
}

async function updateUltimasAsistencias() {
    const container = document.getElementById("ultimasAsistencias");
    const data = await apiRequest('asistencias.php?action=hoy');
    
    if (!data.success || data.data.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay asistencias registradas</p>';
        return;
    }

    container.innerHTML = data.data.slice(0, 5).map(asistencia => `
        <div class="attendance-item">
            <div class="attendance-item-info">
                <p>${asistencia.nombre}</p>
                <p>${formatDate(asistencia.fecha)} - ${asistencia.hora}</p>
            </div>
            <i class="fas fa-check-circle"></i>
        </div>
    `).join("");
}

// MÓDULO SOCIOS
function initSociosModule() {
    document.getElementById("searchSocios").addEventListener("input", () => updateSociosTable());
    updateSociosTable();
}

async function updateSociosTable() {
    const searchTerm = document.getElementById("searchSocios").value.toLowerCase();
    const tbody = document.getElementById("tablaSocios");
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    const data = await apiRequest('socios.php?action=all');
    if (!data.success) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar socios</td></tr>';
        return;
    }

    cache.socios = data.data;
    const filteredSocios = data.data.filter(socio =>
        socio.nombre.toLowerCase().includes(searchTerm) || socio.dni.includes(searchTerm)
    );

    if (filteredSocios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron socios</td></tr>';
        return;
    }

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
                <span class="badge ${socio.estado === "Activo" ? "badge-active" : "badge-moroso"}">
                    ${socio.estado}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-table btn-edit" onclick="editarSocio(${socio.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${currentUser.rol === "Administrador" ? `
                        <button class="btn-table btn-delete" onclick="eliminarSocio(${socio.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : ""}
                </div>
            </td>
        </tr>
    `).join("");
}

async function eliminarSocio(id) {
    if (currentUser.rol !== "Administrador") {
        alert("No tienes permisos para eliminar socios");
        return;
    }

    const socio = cache.socios?.find(s => s.id === id);
    if (!socio) {
        alert("Socio no encontrado");
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar a ${socio.nombre}?\n\nEsta acción no se puede deshacer.`)) return;

    const data = await apiRequest(`socios.php?id=${id}`, { method: 'DELETE' });
    if (data.success) {
        alert("Socio eliminado correctamente");
        updateSociosTable();
        if (activeModule === "dashboard") updateDashboard();
    } else {
        alert(data.message || "Error al eliminar socio");
    }
}

function editarSocio(id) {
    alert("Funcionalidad de edición: Socio ID " + id);
}

// MÓDULO ASISTENCIAS
function initAsistenciasModule() {
    document.getElementById("btnRegistrarAsistencia").addEventListener("click", registrarAsistencia);
    updateAsistenciasTable();
}

async function registrarAsistencia() {
    const dni = document.getElementById("dniAsistencia").value;
    const mensajeDiv = document.getElementById("mensajeAsistencia");
    const btn = document.getElementById("btnRegistrarAsistencia");

    if (!dni) {
        showMessage(mensajeDiv, "Por favor ingrese un DNI", "error");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    btn.disabled = true;

    const data = await apiRequest('asistencias.php', {
        method: 'POST',
        body: JSON.stringify({ dni: dni })
    });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (data.success) {
        showMessage(mensajeDiv, data.message, "success");
        document.getElementById("dniAsistencia").value = "";
        updateAsistenciasTable();
        if (activeModule === "dashboard") updateDashboard();
    } else {
        showMessage(mensajeDiv, data.message, "error");
    }

    setTimeout(() => mensajeDiv.style.display = "none", 3000);}

async function updateAsistenciasTable() {
    const tbody = document.getElementById("tablaAsistencias");
    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

    const data = await apiRequest('asistencias.php?action=all');
    if (!data.success) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Error al cargar asistencias</td></tr>';
        return;
    }

    if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay asistencias registradas</td></tr>';
        return;
    }

    tbody.innerHTML = data.data.map(asistencia => `
        <tr>
            <td>${asistencia.nombre}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td>${asistencia.hora}</td>
        </tr>
    `).join("");}

// MÓDULO PAGOS
async function initPagosModule() {
    const select = document.getElementById("socioSeleccionado");
    select.innerHTML = '<option value="">Seleccionar Socio</option>';
    
    const data = await apiRequest('socios.php?action=all');
    if (data.success) {
        select.innerHTML += data.data.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("");
    }

    document.getElementById("btnRegistrarPago").addEventListener  }