// API Configuration
const API_USUARIOS = 'https://apipeluqueria-1.onrender.com/api/usuarios';
const API_CITAS = 'https://apipeluqueria-1.onrender.com/api/citas';
const API_FACTURAS = 'https://apipeluqueria-1.onrender.com/api/facturas';
const API_SERVICIOS = 'https://apipeluqueria-1.onrender.com/api/servicios';
const API_REPORTES = 'https://apipeluqueria-1.onrender.com/api/reportes';

// Global State
let citas = [];
let facturas = [];
let servicios = [];
let reportes = [];
let usuarios = [];
let clientes = [];
let trabajadores = [];

const usuariosMap = new Map();
const serviciosMap = new Map();
const citasMap = new Map();

function getUserDisplayName(usuario) {
    if (!usuario) return '';
    return (usuario.nombre && usuario.nombre.trim())
        || (usuario.correo && usuario.correo.trim())
        || `Usuario #${usuario.id_usuario}`;
}

function getUsuarioNombreById(id) {
    if (id === undefined || id === null) return '-';
    const usuario = usuariosMap.get(String(id));
    return usuario ? getUserDisplayName(usuario) : `ID ${id}`;
}

function getServicioNombreById(id) {
    if (id === undefined || id === null) return '-';
    const servicio = serviciosMap.get(String(id));
    return servicio && servicio.nombre_servicio
        ? servicio.nombre_servicio
        : `Servicio #${id}`;
}

function setSelectOptions(selectElement, placeholderText, options = []) {
    if (!selectElement) return;

    const previousValue = selectElement.value;
    selectElement.innerHTML = '';

    if (placeholderText !== undefined && placeholderText !== null) {
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholderText;
        selectElement.appendChild(placeholderOption);
    }

    options.forEach(({ value, label }) => {
        const option = document.createElement('option');
        option.value = String(value);
        option.textContent = label;
        selectElement.appendChild(option);
    });

    if (previousValue) {
        const matchingOption = Array.from(selectElement.options).find(
            option => option.value === previousValue
        );
        if (matchingOption) {
            selectElement.value = previousValue;
        }
    }
}

function formatCitaOptionLabel(cita) {
    if (!cita) return '';

    const clienteNombre = getUsuarioNombreById(cita.id_cliente);
    const servicioNombre = getServicioNombreById(cita.id_servicio);

    let fechaHora = '';

    if (cita.fecha_cita) {
        const fecha = new Date(cita.fecha_cita);
        const fechaFormatted = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        fechaHora += fechaFormatted;
    }

    if (cita.hora_cita) {
        fechaHora += fechaHora ? ` ${cita.hora_cita}` : cita.hora_cita;
    }

    const partes = [`Cita #${cita.id_cita}`];

    if (clienteNombre) partes.push(clienteNombre);
    if (servicioNombre) partes.push(servicioNombre);
    if (fechaHora) partes.push(fechaHora);

    return partes.join(' • ');
}

function formatCsvValue(value) {
    if (value === undefined || value === null) return '';
    const stringValue = String(value);
    const escapedValue = stringValue.replace(/"/g, '""');
    if (/[,\n]/.test(escapedValue) || escapedValue !== stringValue) {
        return `"${escapedValue}"`;
    }
    return escapedValue;
}
let editingCitaId = null;
let deletingCitaId = null;
let editingFacturaId = null;
let deletingFacturaId = null;
let currentTab = 'citas';

// DOM Elements - Common
const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');

// DOM Elements - Citas
const newCitaBtn = document.getElementById('newCitaBtn');
const citasTableBody = document.getElementById('citasTableBody');
const citaModal = document.getElementById('citaModal');
const citaForm = document.getElementById('citaForm');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const clienteSelect = document.getElementById('id_cliente');
const trabajadorSelect = document.getElementById('id_trabajador');
const servicioSelect = document.getElementById('id_servicio');
const deleteModal = document.getElementById('deleteModal');
const deleteModalClose = document.getElementById('deleteModalClose');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// DOM Elements - Facturas
const newFacturaBtn = document.getElementById('newFacturaBtn');
const facturasTableBody = document.getElementById('facturasTableBody');
const facturaModal = document.getElementById('facturaModal');
const facturaForm = document.getElementById('facturaForm');
const facturaModalTitle = document.getElementById('facturaModalTitle');
const facturaModalClose = document.getElementById('facturaModalClose');
const cancelFacturaBtn = document.getElementById('cancelFacturaBtn');
const saveFacturaBtn = document.getElementById('saveFacturaBtn');
const facturaCitaSelect = document.getElementById('factura_id_cita');
const facturaClienteFilterSelect = document.getElementById('facturaClienteSelect');
const deleteFacturaModal = document.getElementById('deleteFacturaModal');
const deleteFacturaModalClose = document.getElementById('deleteFacturaModalClose');
const cancelDeleteFacturaBtn = document.getElementById('cancelDeleteFacturaBtn');
const confirmDeleteFacturaBtn = document.getElementById('confirmDeleteFacturaBtn');

// DOM Elements - Reportes
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const reporteFecha = document.getElementById('reporteFecha');
const generarReporteBtn = document.getElementById('generarReporteBtn');
const serviciosReportTableBody = document.getElementById('serviciosReportTableBody');
const citasDiaReportTableBody = document.getElementById('citasDiaReportTableBody');
const ventasReportTableBody = document.getElementById('ventasReportTableBody');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    checkAuthentication();
    loadUserInfo();
    setupEventListeners();
    
    try {
        await loadUsuarios();
        await loadServicios();
        await loadCitas();
        await loadFacturas();
    } catch (error) {
        console.error('Error during initialization:', error);
        showToast('Error al inicializar los datos', 'error');
    }

    initializeReportes();
});

// Check authentication
function checkAuthentication() {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
        window.location.href = 'index.html';
        return;
    }
}

// Load user info
function loadUserInfo() {
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if (adminUser) {
        userGreeting.textContent = `Bienvenido, ${adminUser.nombre}`;
    }
}

// Setup event listeners
function setupEventListeners() {
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab navigation listeners (sin usar onclick inline)
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        });
    });
    
    // Citas listeners
    newCitaBtn.addEventListener('click', () => openCitaModal());
    modalClose.addEventListener('click', closeCitaModal);
    cancelBtn.addEventListener('click', closeCitaModal);
    citaForm.addEventListener('submit', handleSaveCita);
    deleteModalClose.addEventListener('click', closeDeleteModal);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleDeleteCita);
    
    // Facturas listeners
    newFacturaBtn.addEventListener('click', () => openFacturaModal());
    facturaModalClose.addEventListener('click', closeFacturaModal);
    cancelFacturaBtn.addEventListener('click', closeFacturaModal);
    facturaForm.addEventListener('submit', handleSaveFactura);
    deleteFacturaModalClose.addEventListener('click', closeDeleteFacturaModal);
    cancelDeleteFacturaBtn.addEventListener('click', closeDeleteFacturaModal);
    confirmDeleteFacturaBtn.addEventListener('click', handleDeleteFactura);
    
    // Close modals on outside click
    citaModal.addEventListener('click', (e) => {
        if (e.target === citaModal) closeCitaModal();
    });
    
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
    
    facturaModal.addEventListener('click', (e) => {
        if (e.target === facturaModal) closeFacturaModal();
    });
    
    deleteFacturaModal.addEventListener('click', (e) => {
        if (e.target === deleteFacturaModal) closeDeleteFacturaModal();
    });
    
    // Reportes listeners
    generarReporteBtn.addEventListener('click', generateDailyReport);
    exportCsvBtn.addEventListener('click', exportToCsv);
    exportPdfBtn.addEventListener('click', exportToPdf);

    if (facturaClienteFilterSelect) {
        facturaClienteFilterSelect.addEventListener('change', () => {
            populateFacturaCitaOptions(facturaClienteFilterSelect.value);
        });
    }
    
    // Event delegation para botones de acciones en las tablas
    // Usar event delegation en el contenedor de la tabla para evitar múltiples listeners
    if (citasTableBody) {
        citasTableBody.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            const citaId = parseInt(button.getAttribute('data-cita-id'), 10);
            
            if (action === 'edit-cita' && citaId) {
                editCita(citaId);
            } else if (action === 'delete-cita' && citaId) {
                confirmDelete(citaId);
            }
        });
    }
    
    if (facturasTableBody) {
        facturasTableBody.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            
            const action = button.getAttribute('data-action');
            const facturaId = parseInt(button.getAttribute('data-factura-id'), 10);
            
            if (action === 'edit-factura' && facturaId) {
                editFactura(facturaId);
            } else if (action === 'delete-factura' && facturaId) {
                confirmDeleteFactura(facturaId);
            }
        });
    }
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Section`).classList.add('active');
}

// Logout
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    }
}

// Load usuarios
async function loadUsuarios() {
    try {
        const response = await fetch(API_USUARIOS);

        if (!response.ok) {
            throw new Error('Error al cargar los usuarios');
        }

        usuarios = await response.json();
        buildUsuariosCollections();
        populateClienteOptions();
        populateTrabajadorOptions();
        populateFacturaClienteFilterOptions();

    } catch (error) {
        console.error('Error loading usuarios:', error);
        showToast('Error al cargar los usuarios', 'error');
    }
}

function buildUsuariosCollections() {
    clientes = [];
    trabajadores = [];
    usuariosMap.clear();

    usuarios.forEach(usuario => {
        if (!usuario || usuario.id_usuario === undefined || usuario.id_usuario === null) {
            return;
        }

        const idKey = String(usuario.id_usuario);
        usuariosMap.set(idKey, usuario);

        const rol = (usuario.rol || '').toString().toLowerCase();

        if (rol === 'cliente') {
            clientes.push(usuario);
        } else if (rol === 'trabajador') {
            trabajadores.push(usuario);
        }
    });

    const sortByName = (a, b) => {
        return getUserDisplayName(a).localeCompare(
            getUserDisplayName(b),
            'es',
            { sensitivity: 'base' }
        );
    };

    clientes.sort(sortByName);
    trabajadores.sort(sortByName);
}

function populateClienteOptions() {
    if (!clienteSelect) return;

    if (!clientes.length) {
        setSelectOptions(clienteSelect, 'No hay clientes disponibles', []);
        clienteSelect.disabled = true;
        return;
    }

    const options = clientes.map(cliente => ({
        value: cliente.id_usuario,
        label: getUserDisplayName(cliente)
    }));

    setSelectOptions(clienteSelect, 'Seleccione un cliente...', options);
    clienteSelect.disabled = false;
}

function populateTrabajadorOptions() {
    if (!trabajadorSelect) return;

    if (!trabajadores.length) {
        setSelectOptions(trabajadorSelect, 'No hay trabajadores disponibles', []);
        trabajadorSelect.disabled = true;
        return;
    }

    const options = trabajadores.map(trabajador => ({
        value: trabajador.id_usuario,
        label: getUserDisplayName(trabajador)
    }));

    setSelectOptions(trabajadorSelect, 'Seleccione un trabajador...', options);
    trabajadorSelect.disabled = false;
}

function populateFacturaClienteFilterOptions() {
    if (!facturaClienteFilterSelect) return;

    const options = clientes.map(cliente => ({
        value: cliente.id_usuario,
        label: getUserDisplayName(cliente)
    }));

    setSelectOptions(facturaClienteFilterSelect, 'Ver todos los clientes', options);
    facturaClienteFilterSelect.disabled = !clientes.length;
}

// Load citas
async function loadCitas() {
    try {
        setTableLoading(true);
        
        const response = await fetch(API_CITAS);
        
        if (!response.ok) {
            throw new Error('Error al cargar las citas');
        }
        
        citas = await response.json();
        buildCitasMap();
        renderCitas();
        populateFacturaCitaOptions(
            facturaClienteFilterSelect ? facturaClienteFilterSelect.value : ''
        );
        
    } catch (error) {
        console.error('Error loading citas:', error);
        showToast('Error al cargar las citas', 'error');
        citasTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    Error al cargar los datos. Por favor, recarga la página.
                </td>
            </tr>
        `;
    }
}

function buildCitasMap() {
    citasMap.clear();
    citas.forEach(cita => {
        if (cita && cita.id_cita !== undefined && cita.id_cita !== null) {
            citasMap.set(String(cita.id_cita), cita);
        }
    });
}

function populateFacturaCitaOptions(filterClienteId = '') {
    if (!facturaCitaSelect) return;

    if (!citas.length) {
        setSelectOptions(facturaCitaSelect, 'Seleccione una cita...', []);
        return;
    }

    const normalizedFilter = filterClienteId ? String(filterClienteId) : '';

    const options = citas
        .filter(cita => {
            if (!normalizedFilter) return true;
            return String(cita.id_cliente) === normalizedFilter;
        })
        .map(cita => ({
            value: cita.id_cita,
            label: formatCitaOptionLabel(cita)
        }));

    setSelectOptions(facturaCitaSelect, 'Seleccione una cita...', options);
    facturaCitaSelect.disabled = !options.length;
}

// Render citas table
function renderCitas() {
    if (citas.length === 0) {
        citasTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-cell">
                    No hay citas registradas
                </td>
            </tr>
        `;
        return;
    }
    
    citasTableBody.innerHTML = citas.map(cita => {
        const fecha = cita.fecha_cita ? new Date(cita.fecha_cita) : null;
        const fechaFormatted = fecha
            ? fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
            : '-';

        const clienteNombre = getUsuarioNombreById(cita.id_cliente);
        const trabajadorNombre = getUsuarioNombreById(cita.id_trabajador);
        const servicioNombre = getServicioNombreById(cita.id_servicio);
        const hora = cita.hora_cita || '-';
        const estado = cita.estado || '-';
        const estadoClass = getEstadoClass(cita.estado);
        
        return `
            <tr>
                <td>${cita.id_cita}</td>
                <td>${clienteNombre}</td>
                <td>${trabajadorNombre}</td>
                <td>${servicioNombre}</td>
                <td>${fechaFormatted}</td>
                <td>${hora}</td>
                <td><span class="badge badge-${estadoClass}">${estado}</span></td>
                <td>
                    <button class="btn-action btn-edit" data-cita-id="${cita.id_cita}" data-action="edit-cita">
                        ✏️ Editar
                    </button>
                    <button class="btn-action btn-delete" data-cita-id="${cita.id_cita}" data-action="delete-cita">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Los event listeners ya están configurados en setupEventListeners() usando event delegation
    // No es necesario agregarlos aquí cada vez que se renderiza la tabla
    
    setTableLoading(false);
}

// Get estado CSS class
function getEstadoClass(estado) {
    if (!estado) return 'pendiente';
    const estadoLower = estado.toLowerCase().replace(' ', '_');
    return estadoLower;
}

// Set table loading state
function setTableLoading(loading) {
    // This is handled in renderCitas and loadCitas
}

// Open cita modal (new)
function openCitaModal(cita = null) {
    editingCitaId = cita ? cita.id_cita : null;
    
    populateClienteOptions();
    populateTrabajadorOptions();
    populateServicioOptions();

    if (cita) {
        modalTitle.textContent = 'Editar Cita';
        fillFormWithCita(cita);
    } else {
        modalTitle.textContent = 'Nueva Cita';
        citaForm.reset();
    }
    
    // Set today's date as minimum for fecha_cita
    const fechaInput = document.getElementById('fecha_cita');
    const today = new Date().toISOString().split('T')[0];
    fechaInput.min = today;
    
    citaModal.classList.add('show');
}

// Fill form with cita data
function fillFormWithCita(cita) {
    document.getElementById('citaId').value = cita.id_cita;
    if (clienteSelect) {
        const value = String(cita.id_cliente);
        clienteSelect.value = value;
        if (clienteSelect.value !== value) {
            populateClienteOptions();
            clienteSelect.value = value;
        }
    }

    if (trabajadorSelect) {
        const value = String(cita.id_trabajador);
        trabajadorSelect.value = value;
        if (trabajadorSelect.value !== value) {
            populateTrabajadorOptions();
            trabajadorSelect.value = value;
        }
    }

    if (servicioSelect) {
        const value = String(cita.id_servicio);
        servicioSelect.value = value;
        if (servicioSelect.value !== value) {
            populateServicioOptions();
            servicioSelect.value = value;
        }
    }
    document.getElementById('estado').value = cita.estado || '';
    
    // Format date and time for inputs
    // fecha_cita viene como ISO string (DateTime completo)
    // hora_cita viene en formato "HH:mm a. m." o "HH:mm p. m."
    const fechaInput = document.getElementById('fecha_cita');
    const horaInput = document.getElementById('hora_cita');
    
    // Función para convertir hora de formato 12h a 24h para el input type="time"
    function convertirHora12a24(hora12) {
        if (!hora12) return '';
        
        // Si ya está en formato 24h (HH:mm), retornarlo
        if (!hora12.includes('a. m.') && !hora12.includes('p. m.') && !hora12.includes('am') && !hora12.includes('pm')) {
            // Puede ser formato 24h, retornar solo HH:mm
            return hora12.substring(0, 5);
        }
        
        try {
            // Extraer horas, minutos y AM/PM
            const partes = hora12.trim().split(' ');
            if (partes.length < 2) return '';
            
            const horaMin = partes[0].split(':');
            if (horaMin.length < 2) return '';
            
            let horas = parseInt(horaMin[0], 10);
            const minutos = horaMin[1].padStart(2, '0');
            const ampm = partes[1].toLowerCase();
            
            if (isNaN(horas) || isNaN(parseInt(minutos, 10))) return '';
            
            // Convertir a formato 24 horas
            if (ampm.includes('p.') || ampm.includes('pm')) {
                if (horas !== 12) {
                    horas = horas + 12;
                }
            } else if (ampm.includes('a.') || ampm.includes('am')) {
                if (horas === 12) {
                    horas = 0;
                }
            }
            
            return `${String(horas).padStart(2, '0')}:${minutos}`;
        } catch (error) {
            console.error('Error convirtiendo hora:', error);
            return '';
        }
    }
    
    // Procesar fecha_cita
    if (cita.fecha_cita) {
        try {
            const fecha = new Date(cita.fecha_cita);
            if (!isNaN(fecha.getTime())) {
                // Extraer solo la fecha para el input type="date" (YYYY-MM-DD)
                const fechaValue = fecha.toISOString().split('T')[0];
                fechaInput.value = fechaValue;
                
                // Si no hay hora_cita separada, extraer la hora de fecha_cita
                if (!cita.hora_cita || !horaInput.value) {
                    const hours = String(fecha.getHours()).padStart(2, '0');
                    const minutes = String(fecha.getMinutes()).padStart(2, '0');
                    horaInput.value = `${hours}:${minutes}`;
                }
            } else {
                // Si no se puede parsear, intentar extraer fecha directamente
                if (cita.fecha_cita.includes('T')) {
                    const parts = cita.fecha_cita.split('T');
                    fechaInput.value = parts[0];
                    if (parts[1] && !cita.hora_cita) {
                        const horaPart = parts[1].substring(0, 5); // HH:mm
                        horaInput.value = horaPart;
                    }
                }
            }
        } catch (error) {
            console.error('Error parseando fecha_cita:', error);
            if (cita.fecha_cita.includes('T')) {
                const parts = cita.fecha_cita.split('T');
                fechaInput.value = parts[0];
            }
        }
    }
    
    // Procesar hora_cita (formato "HH:mm a. m." o "HH:mm p. m.")
    if (cita.hora_cita) {
        // Convertir de formato 12h a 24h para el input type="time"
        const hora24 = convertirHora12a24(cita.hora_cita);
        if (hora24) {
            horaInput.value = hora24;
        }
    }
    
    document.getElementById('observaciones').value = cita.observaciones || '';
}

// Close cita modal
function closeCitaModal() {
    citaModal.classList.remove('show');
    citaForm.reset();
    editingCitaId = null;
}

// Edit cita
function editCita(id) {
    const cita = citas.find(c => c.id_cita === id);
    if (cita) {
        openCitaModal(cita);
    }
}

// Función para convertir hora de formato 24h (HH:mm) a formato 12h (HH:mm a. m./p. m.)
// Formato exacto requerido: "09:09 a. m." o "09:09 p. m."
function formatHora12(hora24) {
    if (!hora24) return '';
    
    // Si ya está en formato 12h con "a. m." o "p. m.", retornarlo tal cual
    if (hora24.includes('a. m.') || hora24.includes('p. m.')) {
        return hora24.trim();
    }
    
    // Si tiene am/pm sin puntos, convertir al formato con puntos
    if (hora24.toLowerCase().includes('am') || hora24.toLowerCase().includes('pm')) {
        return hora24
            .replace(/am/gi, 'a. m.')
            .replace(/pm/gi, 'p. m.')
            .trim();
    }
    
    // Extraer horas y minutos del formato HH:mm (24 horas)
    const partes = hora24.trim().split(':');
    if (partes.length < 2) {
        console.warn('Formato de hora inválido:', hora24);
        return hora24;
    }
    
    let horas = parseInt(partes[0].trim(), 10);
    let minutosStr = partes[1].trim();
    
    // Limpiar minutos (puede tener segundos o espacios)
    const minutos = parseInt(minutosStr.substring(0, 2), 10);
    
    if (isNaN(horas) || isNaN(minutos) || horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
        console.warn('Valores de hora inválidos:', hora24);
        return hora24;
    }
    
    // Determinar AM/PM
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    
    // Convertir a formato 12 horas
    let horas12 = horas % 12;
    horas12 = horas12 === 0 ? 12 : horas12; // 0 horas (medianoche) se convierte en 12
    
    // Formatear minutos con 2 dígitos siempre
    const minutosFormateados = String(minutos).padStart(2, '0');
    
    // Retornar en formato exacto: "HH:mm a. m." o "HH:mm p. m."
    // Ejemplo: "09:09 a. m." o "02:30 p. m."
    return `${String(horas12).padStart(2, '0')}:${minutosFormateados} ${ampm}`;
}

// Handle save cita
async function handleSaveCita(e) {
    e.preventDefault();
    
    // Leer valores directamente de los inputs
    const clienteSelect = document.getElementById('id_cliente');
    const trabajadorSelect = document.getElementById('id_trabajador');
    const servicioSelect = document.getElementById('id_servicio');
    const fechaInput = document.getElementById('fecha_cita');
    const horaInput = document.getElementById('hora_cita');
    const estadoSelect = document.getElementById('estado');
    const observacionesTextarea = document.getElementById('observaciones');
    
    // Validar que los elementos existan
    if (!clienteSelect || !trabajadorSelect || !servicioSelect || !fechaInput || !horaInput || !estadoSelect) {
        showToast('Error: No se pueden leer los campos del formulario', 'error');
        return;
    }
    
    // Obtener valores
    const idCliente = parseInt(clienteSelect.value, 10);
    const idTrabajador = parseInt(trabajadorSelect.value, 10);
    const idServicio = parseInt(servicioSelect.value, 10);
    const fechaSeleccionada = fechaInput.value.trim();
    const horaSeleccionada = horaInput.value.trim();
    const estado = estadoSelect.value.trim();
    const observaciones = observacionesTextarea ? observacionesTextarea.value.trim() : '';

    // Validar campos requeridos
    if (!idCliente || Number.isNaN(idCliente) || idCliente <= 0) {
        showToast('Por favor selecciona un cliente válido', 'error');
        clienteSelect.focus();
        return;
    }

    if (!idTrabajador || Number.isNaN(idTrabajador) || idTrabajador <= 0) {
        showToast('Por favor selecciona un trabajador válido', 'error');
        trabajadorSelect.focus();
        return;
    }

    if (!idServicio || Number.isNaN(idServicio) || idServicio <= 0) {
        showToast('Por favor selecciona un servicio válido', 'error');
        servicioSelect.focus();
        return;
    }

    if (!fechaSeleccionada) {
        showToast('Por favor selecciona una fecha para la cita', 'error');
        fechaInput.focus();
        return;
    }

    if (!horaSeleccionada) {
        showToast('Por favor selecciona una hora para la cita', 'error');
        horaInput.focus();
        return;
    }

    if (!estado) {
        showToast('Por favor selecciona un estado para la cita', 'error');
        estadoSelect.focus();
        return;
    }

    // Formatear fecha_cita como ISO string
    // Combinar fecha (YYYY-MM-DD) y hora (HH:mm) y convertir a ISO
    let fechaCitaIso = null;
    let fechaCreacionIso = null;
    
    try {
        // Crear fecha combinando fecha y hora
        // El input type="time" devuelve formato HH:mm (24 horas)
        const fechaHoraString = `${fechaSeleccionada}T${horaSeleccionada}:00`;
        const fechaHora = new Date(fechaHoraString);
        
        if (isNaN(fechaHora.getTime())) {
            console.error('Fecha inválida:', fechaHoraString);
            showToast('Fecha u hora de la cita inválida', 'error');
            return;
        }
        
        // Convertir a ISO string
        fechaCitaIso = fechaHora.toISOString();
        fechaCreacionIso = new Date().toISOString(); // Fecha de creación es ahora
        
        console.log('Fecha cita (ISO):', fechaCitaIso);
        console.log('Fecha creación (ISO):', fechaCreacionIso);
    } catch (error) {
        console.error('Error formateando fecha:', error);
        showToast('Error al formatear la fecha de la cita', 'error');
        return;
    }

    // Formatear hora_cita en formato 12 horas con a. m./p. m.
    // Ejemplo: "09:09" -> "09:09 a. m."
    const horaFormateada = formatHora12(horaSeleccionada);

    // Construir objeto de datos
    // Según el JSON que funciona, incluye fecha_creacion incluso en POST
    const citaData = {
        id_cliente: idCliente,
        id_trabajador: idTrabajador,
        id_servicio: idServicio,
        fecha_cita: fechaCitaIso,
        hora_cita: horaFormateada,
        estado: estado,
        observaciones: observaciones || 'string',
        fecha_creacion: fechaCreacionIso
    };
    
    // Si es edición (PUT), agregar id_cita
    if (editingCitaId) {
        citaData.id_cita = editingCitaId;
        // Para edición, mantener la fecha_creacion original si existe
        const existingCita = citas.find(c => c.id_cita === editingCitaId);
        if (existingCita && existingCita.fecha_creacion) {
            citaData.fecha_creacion = existingCita.fecha_creacion;
        }
    }
    
    try {
        setSaveLoading(true);
        
        const url = editingCitaId 
            ? `${API_CITAS}/${editingCitaId}`
            : API_CITAS;
        
        const method = editingCitaId ? 'PUT' : 'POST';
        
        // Logs detallados para depuración
        console.log('========================================');
        console.log('📤 ENVIANDO CITA');
        console.log('========================================');
        console.log('URL:', url);
        console.log('Método:', method);
        console.log('Es edición:', !!editingCitaId);
        console.log('Datos a enviar:', JSON.stringify(citaData, null, 2));
        console.log('========================================');
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(citaData)
        });
        
        console.log('========================================');
        console.log('📥 RESPUESTA DEL SERVIDOR');
        console.log('========================================');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        // Leer la respuesta como texto (solo se puede leer una vez)
        const responseText = await response.text();
        console.log('Response Text (raw):', responseText);
        
        if (!response.ok) {
            let errorMessage = 'Error al guardar la cita';
            let errorDetails = null;
            
            if (responseText) {
                // Intentar parsear como JSON
                try {
                    const errorJson = JSON.parse(responseText);
                    errorDetails = errorJson;
                    console.log('Error JSON:', errorJson);
                    
                    if (errorJson.message) {
                        errorMessage = errorJson.message;
                    } else if (errorJson.error) {
                        errorMessage = errorJson.error;
                    } else if (errorJson.detail) {
                        errorMessage = errorJson.detail;
                    } else {
                        errorMessage = responseText;
                    }
                } catch (e) {
                    // Si no es JSON, usar el texto directamente
                    console.log('Error no es JSON, usando texto directo');
                    errorMessage = responseText || `Error ${response.status}: ${response.statusText}`;
                }
            } else {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            console.error('========================================');
            console.error('❌ ERROR AL GUARDAR CITA');
            console.error('========================================');
            console.error('Status Code:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Mensaje de Error:', errorMessage);
            console.error('Detalles del Error:', errorDetails);
            console.error('Datos enviados:', JSON.stringify(citaData, null, 2));
            console.error('URL:', url);
            console.error('Método:', method);
            console.error('========================================');
            
            // Mostrar error más descriptivo
            const errorDisplay = errorMessage.length > 100 
                ? errorMessage.substring(0, 100) + '...' 
                : errorMessage;
            showToast(`Error ${response.status}: ${errorDisplay}`, 'error');
            
            // También mostrar en alert para que sea más visible
            if (errorMessage && errorMessage.length < 200) {
                alert(`Error al guardar la cita:\n\n${errorMessage}\n\nRevisa la consola (F12) para más detalles.`);
            }
            
            setSaveLoading(false);
            return;
        }
        
        // Intentar parsear la respuesta como JSON
        let result;
        if (responseText) {
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                // Si no es JSON válido, crear un objeto con el texto
                console.warn('No se pudo parsear la respuesta como JSON:', e);
                result = { message: responseText, success: true };
            }
        } else {
            result = { success: true, message: 'Cita guardada exitosamente' };
        }
        console.log('========================================');
        console.log('✅ CITA GUARDADA EXITOSAMENTE');
        console.log('========================================');
        console.log('Respuesta del servidor:', JSON.stringify(result, null, 2));
        console.log('========================================');
        
        showToast(
            editingCitaId ? 'Cita actualizada exitosamente' : 'Cita creada exitosamente',
            'success'
        );
        
        closeCitaModal();
        await loadCitas();
        
    } catch (error) {
        console.error('========================================');
        console.error('❌ EXCEPCIÓN AL GUARDAR CITA');
        console.error('========================================');
        console.error('Error:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Datos que se intentaron enviar:', citaData);
        console.error('========================================');
        
        // Detectar errores de CORS específicamente
        const errorMessage = error.message || error.toString();
        const isCorsError = errorMessage.includes('Failed to fetch') || 
                           errorMessage.includes('NetworkError') ||
                           errorMessage.includes('CORS') ||
                           errorMessage.includes('blocked') ||
                           errorMessage.includes('Access-Control') ||
                           error.name === 'TypeError';
        
        if (isCorsError) {
            const corsErrorMessage = `🔴 ERROR DE CORS DETECTADO

El backend NO está configurado para permitir peticiones desde este origen.

PROBLEMA:
- Tu página web está en: https://paginavale.onrender.com
- Tu API está en: https://apipeluqueria-1.onrender.com
- El backend NO permite peticiones desde tu página web

SOLUCIÓN:
1. Abre el archivo Program.cs de tu API
2. Agrega la configuración de CORS (ver BACKEND_CORS_FIX.md)
3. Redespliega la API a Render
4. Espera a que Render termine el despliegue

Ver el archivo BACKEND_CORS_FIX.md para instrucciones detalladas.
También puedes usar test-cors.html para diagnosticar el problema.`;
            
            console.error(corsErrorMessage);
            alert(corsErrorMessage);
            showToast('❌ Error de CORS: El backend no permite peticiones. Ver BACKEND_CORS_FIX.md', 'error');
        } else {
            // Otro tipo de error
            showToast(`Error de conexión: ${errorMessage}`, 'error');
            alert(`Error de conexión al guardar la cita:\n\n${errorMessage}\n\nRevisa la consola (F12) para más detalles.`);
        }
    } finally {
        setSaveLoading(false);
    }
}

// Confirm delete
function confirmDelete(id) {
    deletingCitaId = id;
    deleteModal.classList.add('show');
}

// Close delete modal
function closeDeleteModal() {
    deleteModal.classList.remove('show');
    deletingCitaId = null;
}

// Handle delete cita
async function handleDeleteCita() {
    if (!deletingCitaId) return;
    
    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Eliminando...';
        
        const response = await fetch(`${API_CITAS}/${deletingCitaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar la cita');
        }
        
        showToast('Cita eliminada exitosamente', 'success');
        
        closeDeleteModal();
        loadCitas();
        
    } catch (error) {
        console.error('Error deleting cita:', error);
        showToast('Error al eliminar la cita. Por favor intenta de nuevo.', 'error');
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Eliminar';
    }
}

// Set save loading state
function setSaveLoading(loading) {
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoading = saveBtn.querySelector('.btn-loading');
    
    if (loading) {
        saveBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
    } else {
        saveBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// FACTURAS FUNCTIONS
// ========================================

// Load facturas
async function loadFacturas() {
    try {
        const response = await fetch(API_FACTURAS);
        
        if (!response.ok) {
            throw new Error('Error al cargar las facturas');
        }
        
        facturas = await response.json();
        renderFacturas();
        
    } catch (error) {
        console.error('Error loading facturas:', error);
        showToast('Error al cargar las facturas', 'error');
        facturasTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Error al cargar los datos. Por favor, recarga la página.
                </td>
            </tr>
        `;
    }
}

// Render facturas table
function renderFacturas() {
    if (facturas.length === 0) {
        facturasTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No hay facturas registradas
                </td>
            </tr>
        `;
        return;
    }
    
    facturasTableBody.innerHTML = facturas.map(factura => {
        const fecha = factura.fecha_emision ? new Date(factura.fecha_emision) : null;
        const fechaFormatted = fecha
            ? fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
            : '-';

        const metodoPago = getMetodoPagoLabel(factura.metodo_pago);
        const cita = citasMap.get(String(factura.id_cita));
        const citaLabel = cita ? formatCitaOptionLabel(cita) : `Cita #${factura.id_cita}`;
        const clienteNombre = cita ? getUsuarioNombreById(cita.id_cliente) : '-';
        const total = factura.total !== undefined && factura.total !== null
            ? `$${parseFloat(factura.total).toFixed(2)}`
            : '$0.00';
        
        return `
            <tr>
                <td>${factura.id_factura}</td>
                <td>${citaLabel}</td>
                <td>${clienteNombre}</td>
                <td>${total}</td>
                <td>${metodoPago}</td>
                <td>${fechaFormatted}</td>
                <td>
                    <button class="btn-action btn-edit" data-factura-id="${factura.id_factura}" data-action="edit-factura">
                        ✏️ Editar
                    </button>
                    <button class="btn-action btn-delete" data-factura-id="${factura.id_factura}" data-action="delete-factura">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Los event listeners ya están configurados en setupEventListeners() usando event delegation
    // No es necesario agregarlos aquí cada vez que se renderiza la tabla
}

// Get metodo_pago label
function getMetodoPagoLabel(metodo) {
    const metodos = {
        'efectivo': 'Efectivo',
        'tarjeta_debito': 'Tarjeta Débito',
        'tarjeta_credito': 'Tarjeta Crédito',
        'transferencia': 'Transferencia',
        'pse': 'PSE',
        'nequi': 'Nequi',
        'daviplata': 'Daviplata'
    };
    return metodos[metodo] || metodo;
}

// Open factura modal (new)
function openFacturaModal(factura = null) {
    editingFacturaId = factura ? factura.id_factura : null;

    let filterValue = facturaClienteFilterSelect ? facturaClienteFilterSelect.value : '';
    let citaAsociada = null;
    
    if (factura) {
        facturaModalTitle.textContent = 'Editar Factura';
        citaAsociada = citasMap.get(String(factura.id_cita));
        if (citaAsociada && facturaClienteFilterSelect) {
            filterValue = String(citaAsociada.id_cliente || '');
            facturaClienteFilterSelect.value = filterValue;
        }
    } else {
        facturaModalTitle.textContent = 'Nueva Factura';
        facturaForm.reset();
        
        // Set today's date as default
        const fechaInput = document.getElementById('fecha_emision');
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }

    populateFacturaCitaOptions(filterValue);

    if (factura) {
        fillFormWithFactura(factura, citaAsociada);
    } else if (facturaClienteFilterSelect) {
        facturaClienteFilterSelect.value = filterValue;
    }
    
    facturaModal.classList.add('show');
}

// Fill form with factura data
function fillFormWithFactura(factura, citaAsociada = null) {
    document.getElementById('facturaId').value = factura.id_factura;

    if (facturaCitaSelect) {
        const citaValue = String(factura.id_cita);
        facturaCitaSelect.value = citaValue;

        // If the cita no está disponible por el filtro, recargar todas
        if (facturaCitaSelect.value !== citaValue) {
            populateFacturaCitaOptions('');
            facturaCitaSelect.value = citaValue;
        }
    }

    const totalInput = document.getElementById('total');
    if (totalInput) {
        totalInput.value = factura.total;
    }

    const metodoPagoSelect = document.getElementById('metodo_pago');
    if (metodoPagoSelect) {
        metodoPagoSelect.value = factura.metodo_pago || '';
    }

    const fechaInput = document.getElementById('fecha_emision');
    if (fechaInput && factura.fecha_emision) {
        const fecha = new Date(factura.fecha_emision);
        fechaInput.value = fecha.toISOString().split('T')[0];
    }

    if (citaAsociada && facturaClienteFilterSelect) {
        facturaClienteFilterSelect.value = String(citaAsociada.id_cliente || '');
    }
}

// Close factura modal
function closeFacturaModal() {
    facturaModal.classList.remove('show');
    facturaForm.reset();
    editingFacturaId = null;
}

// Edit factura
function editFactura(id) {
    const factura = facturas.find(f => f.id_factura === id);
    if (factura) {
        openFacturaModal(factura);
    }
}

// Handle save factura
async function handleSaveFactura(e) {
    e.preventDefault();
    
    const formData = new FormData(facturaForm);
    const idCita = parseInt(formData.get('id_cita'), 10);
    const total = parseFloat(formData.get('total'));
    const metodoPago = formData.get('metodo_pago');
    
    // Validar campos requeridos
    if (Number.isNaN(idCita) || idCita <= 0) {
        showToast('Por favor selecciona una cita válida', 'error');
        return;
    }
    
    if (Number.isNaN(total) || total <= 0) {
        showToast('Por favor ingresa un total válido mayor a 0', 'error');
        return;
    }
    
    if (!metodoPago) {
        showToast('Por favor selecciona un método de pago', 'error');
        return;
    }
    
    // Construir objeto de datos según si es creación o edición
    // Para POST (nueva factura): NO enviar id_factura (es autoincremental) ni fecha_emision
    // Para PUT (editar factura): enviar id_factura y fecha_emision si existe
    const facturaData = {
        id_cita: idCita,
        total: total,
        metodo_pago: metodoPago
    };
    
    // Solo agregar id_factura y fecha_emision si es edición (PUT)
    if (editingFacturaId) {
        facturaData.id_factura = editingFacturaId;
        const fechaEmision = formData.get('fecha_emision');
        if (fechaEmision) {
            facturaData.fecha_emision = fechaEmision;
        }
    }
    // Para nueva factura (POST), NO enviar id_factura ni fecha_emision
    
    try {
        setFacturaSaveLoading(true);
        
        const url = editingFacturaId 
            ? `${API_FACTURAS}/${editingFacturaId}`
            : API_FACTURAS;
        
        const method = editingFacturaId ? 'PUT' : 'POST';
        
        console.log('========================================');
        console.log('📤 ENVIANDO FACTURA');
        console.log('========================================');
        console.log('URL:', url);
        console.log('Método:', method);
        console.log('Es edición:', !!editingFacturaId);
        console.log('Datos a enviar:', JSON.stringify(facturaData, null, 2));
        console.log('========================================');
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facturaData)
        });
        
        console.log('========================================');
        console.log('📥 RESPUESTA DEL SERVIDOR');
        console.log('========================================');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        if (!response.ok) {
            let errorMessage = 'Error al guardar la factura';
            let errorDetails = null;
            
            try {
                const errorText = await response.text();
                console.log('Error Text (raw):', errorText);
                
                if (errorText) {
                    errorMessage = errorText;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorDetails = errorJson;
                        console.log('Error JSON:', errorJson);
                        
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        } else if (errorJson.error) {
                            errorMessage = errorJson.error;
                        } else if (errorJson.detail) {
                            errorMessage = errorJson.detail;
                        }
                    } catch (e) {
                        console.log('Error no es JSON, usando texto directo');
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                console.error('❌ Error leyendo respuesta de error:', e);
            }
            
            console.error('========================================');
            console.error('❌ ERROR AL GUARDAR FACTURA');
            console.error('========================================');
            console.error('Status Code:', response.status);
            console.error('Mensaje de Error:', errorMessage);
            console.error('Detalles del Error:', errorDetails);
            console.error('Datos enviados:', facturaData);
            console.error('========================================');
            
            const errorDisplay = errorMessage.length > 100 
                ? errorMessage.substring(0, 100) + '...' 
                : errorMessage;
            showToast(`Error ${response.status}: ${errorDisplay}`, 'error');
            
            if (errorMessage && errorMessage.length < 200) {
                alert(`Error al guardar la factura:\n\n${errorMessage}\n\nRevisa la consola (F12) para más detalles.`);
            }
            
            return;
        }
        
        const result = await response.json();
        console.log('========================================');
        console.log('✅ FACTURA GUARDADA EXITOSAMENTE');
        console.log('========================================');
        console.log('Respuesta del servidor:', JSON.stringify(result, null, 2));
        console.log('========================================');
        
        showToast(
            editingFacturaId ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente',
            'success'
        );
        
        closeFacturaModal();
        await loadFacturas();
        
    } catch (error) {
        console.error('========================================');
        console.error('❌ EXCEPCIÓN AL GUARDAR FACTURA');
        console.error('========================================');
        console.error('Error:', error);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        console.error('Datos que se intentaron enviar:', facturaData);
        console.error('========================================');
        
        showToast(`Error de conexión: ${error.message}`, 'error');
        alert(`Error de conexión al guardar la factura:\n\n${error.message}\n\nRevisa la consola (F12) para más detalles.`);
    } finally {
        setFacturaSaveLoading(false);
    }
}

// Confirm delete factura
function confirmDeleteFactura(id) {
    deletingFacturaId = id;
    deleteFacturaModal.classList.add('show');
}

// Close delete factura modal
function closeDeleteFacturaModal() {
    deleteFacturaModal.classList.remove('show');
    deletingFacturaId = null;
}

// Handle delete factura
async function handleDeleteFactura() {
    if (!deletingFacturaId) return;
    
    try {
        confirmDeleteFacturaBtn.disabled = true;
        confirmDeleteFacturaBtn.textContent = 'Eliminando...';
        
        const response = await fetch(`${API_FACTURAS}/${deletingFacturaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar la factura');
        }
        
        showToast('Factura eliminada exitosamente', 'success');
        
        closeDeleteFacturaModal();
        loadFacturas();
        
    } catch (error) {
        console.error('Error deleting factura:', error);
        showToast('Error al eliminar la factura. Por favor intenta de nuevo.', 'error');
    } finally {
        confirmDeleteFacturaBtn.disabled = false;
        confirmDeleteFacturaBtn.textContent = 'Eliminar';
    }
}

// Set factura save loading state
function setFacturaSaveLoading(loading) {
    const btnText = saveFacturaBtn.querySelector('.btn-text');
    const btnLoading = saveFacturaBtn.querySelector('.btn-loading');
    
    if (loading) {
        saveFacturaBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
    } else {
        saveFacturaBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// ========================================
// REPORTES FUNCTIONS
// ========================================

// Initialize reportes
function initializeReportes() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    reporteFecha.value = today;
}

// Load servicios
async function loadServicios() {
    try {
        const response = await fetch(API_SERVICIOS);
        
        if (!response.ok) {
            throw new Error('Error al cargar los servicios');
        }
        
        servicios = await response.json();
        buildServiciosMap();
        populateServicioOptions();
        renderServiciosReport();
        
    } catch (error) {
        console.error('Error loading servicios:', error);
        serviciosReportTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">
                    Error al cargar los servicios
                </td>
            </tr>
        `;
    }
}

function buildServiciosMap() {
    serviciosMap.clear();
    servicios.forEach(servicio => {
        if (servicio && servicio.id_servicio !== undefined && servicio.id_servicio !== null) {
            serviciosMap.set(String(servicio.id_servicio), servicio);
        }
    });
}

function populateServicioOptions() {
    if (!servicioSelect) return;

    if (!servicios.length) {
        setSelectOptions(servicioSelect, 'No hay servicios disponibles', []);
        servicioSelect.disabled = true;
        return;
    }

    const sortedServicios = [...servicios].sort((a, b) => {
        const nameA = (a.nombre_servicio || '').toString();
        const nameB = (b.nombre_servicio || '').toString();
        return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });

    const options = sortedServicios.map(servicio => ({
        value: servicio.id_servicio,
        label: servicio.nombre_servicio || `Servicio #${servicio.id_servicio}`
    }));

    setSelectOptions(servicioSelect, 'Seleccione un servicio...', options);
    servicioSelect.disabled = false;
}

// Render servicios report
function renderServiciosReport() {
    if (servicios.length === 0) {
        serviciosReportTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">
                    No hay servicios registrados
                </td>
            </tr>
        `;
        return;
    }
    
    serviciosReportTableBody.innerHTML = servicios.map(servicio => `
        <tr>
            <td>${servicio.id_servicio}</td>
            <td>${servicio.nombre_servicio}</td>
            <td>${servicio.descripcion || '-'}</td>
            <td>$${parseFloat(servicio.precio).toFixed(2)}</td>
            <td>${servicio.duracion_minutos} min</td>
        </tr>
    `).join('');
}

// Generate daily report
async function generateDailyReport() {
    const fecha = reporteFecha.value;
    
    if (!fecha) {
        showToast('Por favor selecciona una fecha', 'error');
        return;
    }
    
    try {
        generarReporteBtn.disabled = true;
        generarReporteBtn.innerHTML = '<span class="spinner"></span> Generando...';
        
        // Filter data by date
        await renderCitasDiaReport(fecha);
        await renderVentasReport(fecha);
        calculateStats(fecha);
        
        showToast('Reporte generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error al generar el reporte', 'error');
    } finally {
        generarReporteBtn.disabled = false;
        generarReporteBtn.innerHTML = '🔍 Generar Reporte';
    }
}

// Render citas del día report
async function renderCitasDiaReport(fecha) {
    try {
        const response = await fetch(API_CITAS);
        
        if (!response.ok) {
            throw new Error('Error al cargar las citas');
        }
        
        const allCitas = await response.json();
        const citasFecha = allCitas.filter(cita => {
            const citaFecha = new Date(cita.fecha_cita).toISOString().split('T')[0];
            return citaFecha === fecha;
        });
        
        if (citasFecha.length === 0) {
            citasDiaReportTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-cell">
                        No hay citas para esta fecha
                    </td>
                </tr>
            `;
            return;
        }
        
        citasDiaReportTableBody.innerHTML = citasFecha.map(cita => {
            const hora = cita.hora_cita || '-';
            const clienteNombre = getUsuarioNombreById(cita.id_cliente);
            const trabajadorNombre = getUsuarioNombreById(cita.id_trabajador);
            const servicioNombre = getServicioNombreById(cita.id_servicio);
            
            return `
                <tr>
                    <td>${cita.id_cita}</td>
                    <td>${clienteNombre}</td>
                    <td>${trabajadorNombre}</td>
                    <td>${servicioNombre}</td>
                    <td>${hora}</td>
                    <td><span class="badge badge-${getEstadoClass(cita.estado)}">${cita.estado || '-'}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading daily citas:', error);
        citasDiaReportTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    Error al cargar las citas
                </td>
            </tr>
        `;
    }
}

// Render ventas report
async function renderVentasReport(fecha) {
    try {
        const response = await fetch(API_FACTURAS);
        
        if (!response.ok) {
            throw new Error('Error al cargar las facturas');
        }
        
        const allFacturas = await response.json();
        const facturasFecha = allFacturas.filter(factura => {
            const facturaFecha = new Date(factura.fecha_emision).toISOString().split('T')[0];
            return facturaFecha === fecha;
        });
        
        if (facturasFecha.length === 0) {
            ventasReportTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-cell">
                        No hay ventas para esta fecha
                    </td>
                </tr>
            `;
            return;
        }
        
        ventasReportTableBody.innerHTML = facturasFecha.map(factura => {
            const fechaEmision = new Date(factura.fecha_emision).toLocaleDateString('es-ES');
            const metodoPago = getMetodoPagoLabel(factura.metodo_pago);
            const cita = citasMap.get(String(factura.id_cita));
            const citaLabel = cita ? formatCitaOptionLabel(cita) : `Cita #${factura.id_cita}`;
            
            return `
                <tr>
                    <td>${factura.id_factura}</td>
                    <td>${citaLabel}</td>
                    <td>$${parseFloat(factura.total).toFixed(2)}</td>
                    <td>${metodoPago}</td>
                    <td>${fechaEmision}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading sales:', error);
        ventasReportTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">
                    Error al cargar las ventas
                </td>
            </tr>
        `;
    }
}

// Calculate stats
async function calculateStats(fecha) {
    try {
        // Calculate total citas
        const citasFecha = citas.filter(cita => {
            const citaFecha = new Date(cita.fecha_cita).toISOString().split('T')[0];
            return citaFecha === fecha;
        });
        
        const totalCitas = citasFecha.length;
        const citasCompletadas = citasFecha.filter(c => c.estado === 'completada').length;
        
        // Calculate total ventas
        const facturasFecha = facturas.filter(factura => {
            const facturaFecha = new Date(factura.fecha_emision).toISOString().split('T')[0];
            return facturaFecha === fecha;
        });
        
        const ventasTotales = facturasFecha.reduce((sum, f) => sum + parseFloat(f.total), 0);
        const facturasGeneradas = facturasFecha.length;
        
        // Update stats
        document.getElementById('totalCitas').textContent = totalCitas;
        document.getElementById('citasCompletadas').textContent = citasCompletadas;
        document.getElementById('ventasTotales').textContent = `$${ventasTotales.toFixed(2)}`;
        document.getElementById('facturasGeneradas').textContent = facturasGeneradas;
        
    } catch (error) {
        console.error('Error calculating stats:', error);
    }
}

// Export to CSV
async function exportToCsv() {
    const fecha = reporteFecha.value;
    
    if (!fecha) {
        showToast('Por favor genera un reporte primero', 'error');
        return;
    }
    
    try {
        // Prepare CSV data
        let csvContent = 'Reporte Diario - ' + fecha + '\n\n';
        
        // Services header
        csvContent += '=== SERVICIOS ===\n';
        csvContent += 'ID,Nombre,Descripción,Precio,Duración (min)\n';
        
        servicios.forEach(servicio => {
            csvContent += `${formatCsvValue(servicio.id_servicio)},${formatCsvValue(servicio.nombre_servicio)},${formatCsvValue(servicio.descripcion || '')},${formatCsvValue(servicio.precio)},${formatCsvValue(servicio.duracion_minutos)}\n`;
        });
        
        // Daily citas header
        csvContent += '\n=== CITAS DEL DÍA ===\n';
        csvContent += 'ID,Cliente,Trabajador,Servicio,Hora,Estado\n';
        
        const citasFecha = citas.filter(cita => {
            const citaFecha = new Date(cita.fecha_cita).toISOString().split('T')[0];
            return citaFecha === fecha;
        });
        
        citasFecha.forEach(cita => {
            const clienteNombre = getUsuarioNombreById(cita.id_cliente);
            const trabajadorNombre = getUsuarioNombreById(cita.id_trabajador);
            const servicioNombre = getServicioNombreById(cita.id_servicio);
            csvContent += `${formatCsvValue(cita.id_cita)},${formatCsvValue(clienteNombre)},${formatCsvValue(trabajadorNombre)},${formatCsvValue(servicioNombre)},${formatCsvValue(cita.hora_cita || '')},${formatCsvValue(cita.estado || '')}\n`;
        });
        
        // Sales header
        csvContent += '\n=== VENTAS ===\n';
        csvContent += 'ID Factura,ID Cita,Cliente,Total,Método Pago,Fecha\n';
        
        const facturasFecha = facturas.filter(factura => {
            const facturaFecha = new Date(factura.fecha_emision).toISOString().split('T')[0];
            return facturaFecha === fecha;
        });
        
        facturasFecha.forEach(factura => {
            const cita = citasMap.get(String(factura.id_cita));
            const clienteNombre = cita ? getUsuarioNombreById(cita.id_cliente) : '';
            csvContent += `${formatCsvValue(factura.id_factura)},${formatCsvValue(factura.id_cita)},${formatCsvValue(clienteNombre)},${formatCsvValue(factura.total)},${formatCsvValue(getMetodoPagoLabel(factura.metodo_pago))},${formatCsvValue(factura.fecha_emision)}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_${fecha}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Reporte CSV exportado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('Error al exportar CSV', 'error');
    }
}

// Export to PDF
async function exportToPdf() {
    const fecha = reporteFecha.value;
    
    if (!fecha) {
        showToast('Por favor genera un reporte primero', 'error');
        return;
    }
    
    try {
        // Create PDF content
        let pdfContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reporte Diario - ${fecha}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #667eea; }
                    h2 { color: #764ba2; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #667eea; color: white; }
                    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                    .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
                    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <h1>Reporte Diario - Peluquería</h1>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value">${document.getElementById('totalCitas').textContent}</div>
                        <div class="stat-label">Citas del Día</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${document.getElementById('citasCompletadas').textContent}</div>
                        <div class="stat-label">Citas Completadas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${document.getElementById('ventasTotales').textContent}</div>
                        <div class="stat-label">Ventas Totales</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${document.getElementById('facturasGeneradas').textContent}</div>
                        <div class="stat-label">Facturas Generadas</div>
                    </div>
                </div>
                
                <h2>Servicios</h2>
                ${generateServicesTableHtml()}
                
                <h2>Citas del Día</h2>
                ${generateCitasTableHtml(fecha)}
                
                <h2>Ventas</h2>
                ${generateSalesTableHtml(fecha)}
            </body>
            </html>
        `;
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 250);
        
        showToast('Reporte PDF preparado para imprimir', 'success');
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showToast('Error al exportar PDF', 'error');
    }
}

// Generate services table HTML
function generateServicesTableHtml() {
    let html = '<table><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Duración</th></tr>';
    servicios.forEach(servicio => {
        html += `<tr>
            <td>${servicio.id_servicio}</td>
            <td>${servicio.nombre_servicio}</td>
            <td>${servicio.descripcion || ''}</td>
            <td>$${parseFloat(servicio.precio).toFixed(2)}</td>
            <td>${servicio.duracion_minutos} min</td>
        </tr>`;
    });
    html += '</table>';
    return html;
}

// Generate citas table HTML
function generateCitasTableHtml(fecha) {
    const citasFecha = citas.filter(cita => {
        const citaFecha = new Date(cita.fecha_cita).toISOString().split('T')[0];
        return citaFecha === fecha;
    });
    
    let html = '<table><tr><th>ID</th><th>Cliente</th><th>Trabajador</th><th>Servicio</th><th>Hora</th><th>Estado</th></tr>';
    citasFecha.forEach(cita => {
        html += `<tr>
            <td>${cita.id_cita}</td>
            <td>${getUsuarioNombreById(cita.id_cliente)}</td>
            <td>${getUsuarioNombreById(cita.id_trabajador)}</td>
            <td>${getServicioNombreById(cita.id_servicio)}</td>
            <td>${cita.hora_cita || '-'}</td>
            <td>${cita.estado || '-'}</td>
        </tr>`;
    });
    html += '</table>';
    return html;
}

// Generate sales table HTML
function generateSalesTableHtml(fecha) {
    const facturasFecha = facturas.filter(factura => {
        const facturaFecha = new Date(factura.fecha_emision).toISOString().split('T')[0];
        return facturaFecha === fecha;
    });
    
    let html = '<table><tr><th>ID Factura</th><th>Cita</th><th>Cliente</th><th>Total</th><th>Método Pago</th><th>Fecha</th></tr>';
    facturasFecha.forEach(factura => {
        const fechaEmision = new Date(factura.fecha_emision).toLocaleDateString('es-ES');
        const metodoPago = getMetodoPagoLabel(factura.metodo_pago);
        const cita = citasMap.get(String(factura.id_cita));
        const citaLabel = cita ? formatCitaOptionLabel(cita) : `Cita #${factura.id_cita}`;
        const clienteNombre = cita ? getUsuarioNombreById(cita.id_cliente) : '-';
        html += `<tr>
            <td>${factura.id_factura}</td>
            <td>${citaLabel}</td>
            <td>${clienteNombre}</td>
            <td>$${parseFloat(factura.total).toFixed(2)}</td>
            <td>${metodoPago}</td>
            <td>${fechaEmision}</td>
        </tr>`;
    });
    html += '</table>';
    return html;
}

// Export functions for inline onclick handlers
// Las funciones ya no se exportan a window porque usamos event delegation
// switchTab se mantiene por compatibilidad, aunque ya se maneja con event listeners
window.switchTab = switchTab;

