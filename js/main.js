// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Configurar fecha actual
    const today = new Date();
    document.getElementById('hdrDate').textContent = today.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Copiar logo al header de impresión
    const mainLogo = document.querySelector('header img');
    if (mainLogo) {
        document.getElementById('printLogo').src = mainLogo.src;
    }
    document.getElementById('printDate').textContent = today.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Inicializar Flatpickr
    initFlatpickr(today);
    
    // Inicializar eventos
    initEvents();
    
    // Agregar filas iniciales
    initializeRows();
}

function initFlatpickr(today) {
    // Configuración de fecha
    window.fpInstance = flatpickr('#fecha', {
        locale: 'es',
        dateFormat: 'd-m-Y',
        defaultDate: today,
        disableMobile: true,
        onChange: function(selectedDates) {
            if (selectedDates[0]) {
                document.getElementById('hdrDate').textContent = 
                    selectedDates[0].toLocaleDateString('es-CL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
            }
        }
    });

    // Configuración de horas
    const timeConfig = {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: true,
        disableMobile: true,
        minuteIncrement: 30,
    };
    
    flatpickr('#horaInicio', timeConfig);
    flatpickr('#horaTermino', timeConfig);
}

function initEvents() {
    // Calcular totales al cambiar inputs
    document.querySelectorAll('.srv-activos, .srv-urgencia').forEach(input => {
        input.addEventListener('input', calcTotals);
    });

    // Botones
    document.getElementById('addDesviacionBtn').addEventListener('click', () => addDesviacion());
    document.getElementById('addPendienteBtn').addEventListener('click', () => addPendiente());
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
    document.getElementById('exportPDFBtn').addEventListener('click', exportPDF);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
}

function initializeRows() {
    // Agregar primera desviación vacía
    addDesviacion();
    
    // Agregar 3 pendientes iniciales
    window.pendId = 0;
    addPendiente();
    addPendiente();
    addPendiente();
}

// ========== FUNCIONES UTILITARIAS ==========
function calcTotals() {
    let totalActivos = 0;
    let totalUrgencia = 0;
    
    document.querySelectorAll('.srv-activos').forEach(input => {
        totalActivos += Number(input.value) || 0;
    });
    
    document.querySelectorAll('.srv-urgencia').forEach(input => {
        totalUrgencia += Number(input.value) || 0;
    });
    
    document.getElementById('totalActivos').textContent = totalActivos;
    document.getElementById('totalUrgencia').textContent = totalUrgencia;
}

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, function(c) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c];
    });
}

function getFechaRaw() {
    const d = window.fpInstance ? window.fpInstance.selectedDates[0] : new Date();
    if (!d) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
}

function getFechaDisplay() {
    return document.getElementById('fecha').value || new Date().toLocaleDateString('es-CL');
}

function showToast(msg) {
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.opacity = '0', 2500);
    setTimeout(() => toast.remove(), 3000);
}

// ========== MANEJO DE DESVIACIONES ==========
let desvId = 0;

function addDesviacion(tipo = '', detalle = '', estado = '', resp = '') {
    desvId++;
    const container = document.getElementById('desvContainer');
    const div = document.createElement('div');
    div.className = 'desv-row';
    div.innerHTML = `
        <input type="text" placeholder="Tipo..." value="${escHtml(tipo)}">
        <input type="text" placeholder="Detalle..." value="${escHtml(detalle)}">
        <input type="text" placeholder="Estado / Gestión..." value="${escHtml(estado)}">
        <input type="text" placeholder="Responsable..." value="${escHtml(resp)}">
        <button class="remove-btn" onclick="this.closest('.desv-row').remove()" title="Eliminar">×</button>
    `;
    container.appendChild(div);
}

// ========== MANEJO DE PENDIENTES ==========
const PEND_PLACEHOLDERS = [
    'ENVIO PUNTO A PUNTO AL FINALIZAR TURNO',
    'ENVIAR SERVICIOS POR ACTIVAR Y FINALIZAR DURANTE EL TURNO',
    'REALIZAR KPI DE LA SEMANA EN CURSO'
];

let pendId = 0;

function addPendiente(pend = '', prio = 'ALTA', resp = '') {
    const container = document.getElementById('pendContainer');
    const idx = pendId;
    pendId++;
    
    const placeholder = PEND_PLACEHOLDERS[idx] || 'Descripción del pendiente...';
    const div = document.createElement('div');
    div.className = 'pend-row';
    div.innerHTML = `
        <input type="text" placeholder="${escHtml(placeholder)}" value="${escHtml(pend)}">
        <select class="prio-sel" onchange="updatePrioColor(this)">
            <option value="ALTA" ${prio === 'ALTA' ? 'selected' : ''}>Alta</option>
            <option value="MEDIA" ${prio === 'MEDIA' ? 'selected' : ''}>Media</option>
            <option value="BAJA" ${prio === 'BAJA' ? 'selected' : ''}>Baja</option>
        </select>
        <input type="text" placeholder="Responsable..." value="${escHtml(resp)}">
        <button class="remove-btn" onclick="this.closest('.pend-row').remove()" title="Eliminar">×</button>
    `;
    container.appendChild(div);
    updatePrioColor(div.querySelector('.prio-sel'));
}

function updatePrioColor(select) {
    select.className = 'prio-sel';
    if (select.value === 'ALTA') {
        select.classList.add('prior-alta');
    } else if (select.value === 'MEDIA') {
        select.classList.add('prior-media');
    } else {
        select.classList.add('prior-baja');
    }
}

// ========== RECOLECCIÓN DE DATOS ==========
function collectData() {
    const fecha = getFechaDisplay();
    const fechaRaw = getFechaRaw();
    const horaI = document.getElementById('horaInicio').value;
    const horaT = document.getElementById('horaTermino').value;
    const saliente = document.getElementById('turnoSaliente').value;
    const entrante = document.getElementById('turnoEntrante').value;
    const obs = document.getElementById('observaciones').value;

    // Servicios
    const clientes = [
        'MINERIA DISTRIBUCION 43',
        'TECK CONCU',
        'CAPSTONE',
        'TECK ANTOFAGASTA',
        'CHUQUI SUBTERRANEO'
    ];
    
    const activosInputs = document.querySelectorAll('.srv-activos');
    const urgInputs = document.querySelectorAll('.srv-urgencia');
    
    let totalA = 0;
    let totalU = 0;
    
    const srvRows = clientes.map((cliente, i) => {
        const activos = Number(activosInputs[i]?.value) || 0;
        totalA += activos;
        
        let urgencia = 'N/A';
        if (i === 0) { // Solo el primer cliente tiene urgencia numérica
            urgencia = Number(urgInputs[0]?.value) || 0;
            totalU += urgencia;
        }
        
        return { cliente, activos, urgencia };
    });

    // Desviaciones
    const desvs = [];
    document.querySelectorAll('.desv-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        desvs.push({
            tipo: inputs[0]?.value || '',
            detalle: inputs[1]?.value || '',
            estado: inputs[2]?.value || '',
            resp: inputs[3]?.value || ''
        });
    });

    // Pendientes
    const pends = [];
    document.querySelectorAll('.pend-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        pends.push({
            pendiente: inputs[0]?.value || '',
            prioridad: select?.value || 'ALTA',
            responsable: inputs[1]?.value || ''
        });
    });

    return {
        fecha, fechaRaw, horaI, horaT, saliente, entrante, obs,
        srvRows, totalA, totalU, desvs, pends
    };
}

// ========== LIMPIAR FORMULARIO ==========
function clearForm() {
    if (!confirm('¿Limpiar todo el formulario?')) return;
    
    // Restaurar contenido formateado si existe
    restoreTextarea();
    
    if (window.fpInstance) {
        window.fpInstance.setDate(new Date());
    }
    
    const horaInicio = document.getElementById('horaInicio')._flatpickr;
    const horaTermino = document.getElementById('horaTermino')._flatpickr;
    if (horaInicio) horaInicio.clear();
    if (horaTermino) horaTermino.clear();
    
    document.getElementById('observaciones').value = '';
    document.getElementById('turnoSaliente').value = '';
    document.getElementById('turnoEntrante').value = '';
    
    document.querySelectorAll('.srv-activos, .srv-urgencia').forEach(input => {
        input.value = '';
    });
    
    document.getElementById('desvContainer').innerHTML = '';
    document.getElementById('pendContainer').innerHTML = '';
    
    calcTotals();
    
    // Re-agregar filas iniciales
    addDesviacion();
    pendId = 0;
    addPendiente();
    addPendiente();
    addPendiente();
}

// ========== FUNCIONES PARA IMPRESIÓN PDF (CORREGIDAS) ==========
function fixPrintObservations() {
    // Eliminar cualquier contenido formateado previo
    restoreTextarea();
    
    const obsTextarea = document.getElementById('observaciones');
    const obsValue = obsTextarea.value;
    
    // Solo proceder si hay observaciones
    if (obsValue && obsValue.trim() !== '') {
        // Dividir por líneas y filtrar líneas vacías
        const lines = obsValue.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 0) {
            // Crear un div con el contenido formateado
            const formattedDiv = document.createElement('div');
            formattedDiv.id = 'print-observations-content';
            formattedDiv.className = 'print-observations-content';
            
            // Añadir cada línea numerada
            lines.forEach((line, index) => {
                const lineDiv = document.createElement('div');
                lineDiv.textContent = `${index + 1}. ${line.trim()}`;
                formattedDiv.appendChild(lineDiv);
            });
            
            // Insertar después del textarea
            obsTextarea.parentNode.insertBefore(formattedDiv, obsTextarea.nextSibling);
        }
    }
}

function restoreTextarea() {
    const formattedContent = document.getElementById('print-observations-content');
    if (formattedContent) {
        formattedContent.remove();
    }
}

// ========== EXPORTACIÓN A PDF (CORREGIDA) ==========
function exportPDF() {
    // Preparar observaciones para impresión
    fixPrintObservations();
    
    // Mostrar mensaje
    showToast('Preparando PDF con todas las observaciones...');
    
    // Imprimir después de un pequeño retraso
    setTimeout(() => {
        window.print();
    }, 100);
    
    // Restaurar después de imprimir
    window.addEventListener('focus', function onFocus() {
        restoreTextarea();
        window.removeEventListener('focus', onFocus);
    });
}

// ========== EXPORTACIÓN A EXCEL ==========
function exportExcel() {
    const d = collectData();
    const wb = XLSX.utils.book_new();
    
    // Estilos
    const RED = 'FFC0392B';
    const WHITE = 'FFFFFFFF';
    const LGRAY = 'FFF4F6F9';
    const MGRAY = 'FFD1DAE6';
    const DARK = 'FF1A202C';
    const PINK = 'FFFDE8E8';

    function cell(v, opts = {}) {
        const type = typeof v === 'number' ? 'n' : 's';
        const cell = { v, t: type };
        
        const style = {
            font: {
                sz: opts.title ? 14 : opts.header ? 10 : 9,
                color: { rgb: opts.title ? RED : opts.wht ? WHITE : DARK },
                name: 'Arial',
                bold: opts.bold || opts.header || opts.title || false
            },
            alignment: {
                vertical: 'center',
                wrapText: true,
                horizontal: opts.align || 'left'
            },
            border: opts.border || opts.header || opts.title ? {
                top: { style: 'thin', color: { rgb: MGRAY } },
                bottom: { style: 'thin', color: { rgb: MGRAY } },
                left: { style: 'thin', color: { rgb: MGRAY } },
                right: { style: 'thin', color: { rgb: MGRAY } }
            } : undefined,
            fill: opts.bg ? {
                fgColor: { rgb: opts.bg },
                patternType: 'solid'
            } : undefined
        };
        
        cell.s = style;
        return cell;
    }

    function hdrCell(v) {
        return cell(v, { header: true, bg: RED, wht: true, align: 'center', border: true });
    }

    function sectionRow(v) {
        return cell(v, { bold: true, bg: RED, wht: true, border: true });
    }

    function dataCell(v, shade = false) {
        return cell(v, { bg: shade ? LGRAY : WHITE, border: true });
    }

    // Construir hoja
    let R = 0;
    const ws = {};
    const merges = [];

    function setCell(row, col, c) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        ws[addr] = c;
    }

    // Título
    setCell(R, 0, cell('SERLOG – Entrega de Turno: Control y Monitoreo', { title: true, bg: RED, wht: true, border: true }));
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 3 } });
    setCell(R, 4, cell(d.fecha, { bold: true, bg: LGRAY, border: true, align: 'center' }));
    R++;

    // Encabezados turno
    setCell(R, 0, hdrCell('TURNO SALIENTE'));
    setCell(R, 1, hdrCell('TURNO ENTRANTE'));
    setCell(R, 2, hdrCell('HORA INICIO'));
    setCell(R, 3, hdrCell('HORA TÉRMINO'));
    setCell(R, 4, hdrCell('FECHA'));
    R++;

    // Valores turno
    setCell(R, 0, dataCell(d.saliente));
    setCell(R, 1, dataCell(d.entrante));
    setCell(R, 2, dataCell(d.horaI));
    setCell(R, 3, dataCell(d.horaT));
    setCell(R, 4, dataCell(d.fecha));
    R += 2;

    // Servicios
    setCell(R, 0, sectionRow('RESUMEN DE SERVICIOS MONITOREADOS'));
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
    R++;

    setCell(R, 0, hdrCell('CUENTA / CLIENTE'));
    setCell(R, 1, hdrCell('ACTIVOS'));
    setCell(R, 2, hdrCell('SERVICIOS URGENCIA'));
    merges.push({ s: { r: R, c: 2 }, e: { r: R, c: 4 } });
    R++;

    d.srvRows.forEach((row, i) => {
        const shade = i % 2 === 1;
        setCell(R, 0, dataCell(row.cliente, shade));
        setCell(R, 1, cell(row.activos, { bg: shade ? LGRAY : WHITE, border: true, align: 'center' }));
        setCell(R, 2, dataCell(row.urgencia, shade));
        merges.push({ s: { r: R, c: 2 }, e: { r: R, c: 4 } });
        R++;
    });

    // Totales servicios
    setCell(R, 0, cell('TOTAL', { bold: true, bg: PINK, border: true }));
    setCell(R, 1, cell(d.totalA, { bold: true, bg: PINK, border: true, align: 'center' }));
    setCell(R, 2, cell(d.totalU, { bold: true, bg: PINK, border: true, align: 'center' }));
    merges.push({ s: { r: R, c: 2 }, e: { r: R, c: 4 } });
    R += 2;

    // Desviaciones
    setCell(R, 0, sectionRow('DESVIACIONES RELEVANTES DEL TURNO'));
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
    R++;

    setCell(R, 0, hdrCell('TIPO DE DESVIACIÓN'));
    setCell(R, 1, hdrCell('DETALLE'));
    setCell(R, 2, hdrCell('ESTADO / GESTIÓN REALIZADA'));
    setCell(R, 3, hdrCell('RESPONSABLE / ESCALAMIENTO'));
    merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } });
    R++;

    if (d.desvs.length === 0 || d.desvs.every(x => !x.tipo && !x.detalle)) {
        setCell(R, 0, dataCell('Sin desviaciones registradas'));
        merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
        R++;
    } else {
        d.desvs.forEach((row, i) => {
            const shade = i % 2 === 1;
            setCell(R, 0, dataCell(row.tipo, shade));
            setCell(R, 1, dataCell(row.detalle, shade));
            setCell(R, 2, dataCell(row.estado, shade));
            setCell(R, 3, dataCell(row.resp, shade));
            merges.push({ s: { r: R, c: 3 }, e: { r: R, c: 4 } });
            R++;
        });
    }
    R++;

    // Observaciones - VERSIÓN CORREGIDA
    setCell(R, 0, sectionRow('OBSERVACIONES GENERALES DEL TURNO'));
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
    R++;

    if (d.obs && d.obs.trim() !== '') {
        const lines = d.obs.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 0) {
            lines.forEach((line, index) => {
                const shade = index % 2 === 1;
                const numberedLine = `${index + 1}. ${line.trim()}`;
                setCell(R, 0, cell(numberedLine, { bg: shade ? LGRAY : WHITE, border: true }));
                merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
                
                const cellAddr = XLSX.utils.encode_cell({ r: R, c: 0 });
                ws[cellAddr].s.alignment = { 
                    wrapText: true, 
                    vertical: 'top',
                    horizontal: 'left' 
                };
                
                R++;
            });
        } else {
            setCell(R, 0, cell('Sin observaciones', { bg: WHITE, border: true, align: 'left' }));
            merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
            R++;
        }
    } else {
        setCell(R, 0, cell('Sin observaciones', { bg: WHITE, border: true, align: 'left' }));
        merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
        R++;
    }
    R++;

    // Pendientes
    setCell(R, 0, sectionRow('PENDIENTES A SEGUIR EN PRÓXIMO TURNO'));
    merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
    R++;

    setCell(R, 0, hdrCell('PENDIENTE'));
    setCell(R, 1, hdrCell('PRIORIDAD'));
    setCell(R, 2, hdrCell('RESPONSABLE SIGUIENTE TURNO'));
    merges.push({ s: { r: R, c: 2 }, e: { r: R, c: 4 } });
    R++;

    if (d.pends.length === 0) {
        setCell(R, 0, dataCell('Sin pendientes registrados'));
        merges.push({ s: { r: R, c: 0 }, e: { r: R, c: 4 } });
        R++;
    } else {
        d.pends.forEach((row, i) => {
            const shade = i % 2 === 1;
            setCell(R, 0, dataCell(row.pendiente, shade));
            
            const prioColors = {
                'ALTA': 'FFFDE8E8',
                'MEDIA': 'FFFFF8E1',
                'BAJA': 'FFE8F5E9'
            };
            setCell(R, 1, cell(row.prioridad, { 
                bg: prioColors[row.prioridad] || WHITE, 
                border: true, 
                align: 'center', 
                bold: true 
            }));
            
            setCell(R, 2, dataCell(row.responsable, shade));
            merges.push({ s: { r: R, c: 2 }, e: { r: R, c: 4 } });
            R++;
        });
    }

    // Configurar hoja
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R, c: 4 } });
    ws['!merges'] = merges;
    ws['!cols'] = [
        { wch: 32 },
        { wch: 14 },
        { wch: 32 },
        { wch: 26 },
        { wch: 16 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Entrega Turno');
    XLSX.writeFile(wb, `Entrega_Turno_${d.fechaRaw}.xlsx`);
    showToast('✓ Excel descargado correctamente');
}