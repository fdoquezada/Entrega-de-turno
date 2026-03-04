// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// ========== ALERTA AL RECARGAR / SALIR ==========
window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '¿Seguro que deseas salir? Los datos ingresados se perderán.';
    return e.returnValue;
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
    const respEntrega = document.getElementById('responsableEntrega').value;
    const respRecepcion = document.getElementById('responsableRecepcion').value;

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
        respEntrega, respRecepcion,
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
    document.getElementById('responsableEntrega').value = '';
    document.getElementById('responsableRecepcion').value = '';
    
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
    showToast('Preparando PDF horizontal (A4)...');

    // Insertar estilo temporal para forzar orientación landscape
    const styleEl = document.createElement('style');
    styleEl.id = 'force-landscape-style';
    styleEl.textContent = '@page { size: A4 landscape !important; margin: 8mm !important; }';
    document.head.appendChild(styleEl);
    
    // Imprimir después de un pequeño retraso
    setTimeout(() => {
        window.print();
    }, 150);
    
    // Restaurar después de imprimir
    window.addEventListener('focus', function onFocus() {
        restoreTextarea();
        const forcedStyle = document.getElementById('force-landscape-style');
        if (forcedStyle) forcedStyle.remove();
        window.removeEventListener('focus', onFocus);
    });
}

// ========== EXPORTACIÓN A EXCEL ==========
function exportExcel() {
    const d = collectData();

    // ── PALETA (sin prefijo FF — xlsx-js-style usa RRGGBB directo) ──
    const RED     = 'C0392B';
    const RED_L   = 'FDECEA';
    const WHITE   = 'FFFFFF';
    const LGRAY   = 'F4F6F9';
    const MGRAY   = 'D1DAE6';
    const DARK    = '1A202C';
    const MUTED   = '718096';
    const HDR_TBL = '2C3E50';   // encabezados de tabla gris oscuro
    const ALTA_BG = 'FDECEA'; const ALTA_FG = 'C0392B';
    const MED_BG  = 'FFF8E1'; const MED_FG  = 'B7770D';
    const BAJA_BG = 'E8F5E9'; const BAJA_FG = '27AE60';

    // ── helpers ──────────────────────────────────────────────────────
    function bd(color) {
        const s = { style: 'thin', color: { rgb: color || MGRAY } };
        return { top: s, bottom: s, left: s, right: s };
    }

    function cell(val, {
        bold = false, italic = false,
        fg = DARK, bg = WHITE, sz = 9,
        align = 'left', wrap = false,
        border = true, bc = MGRAY
    } = {}) {
        const isNum = typeof val === 'number';
        return {
            v: val ?? '',
            t: isNum ? 'n' : 's',
            s: {
                font:      { bold, italic, color: { rgb: fg }, sz, name: 'Arial' },
                fill:      { fgColor: { rgb: bg }, patternType: 'solid' },
                alignment: { horizontal: align, vertical: 'center', wrapText: wrap },
                border:    border ? bd(bc) : {}
            }
        };
    }

    // Atajos
    const secHdr = v => cell(v, { bold: true, fg: RED,     bg: RED_L,   sz: 10, bc: RED });
    const tblHdr = v => cell(v, { bold: true, fg: WHITE,   bg: HDR_TBL, sz: 8,  align: 'center', bc: HDR_TBL });
    const dat    = (v, shade = false, align = 'left', wrap = false) =>
                        cell(v, { fg: DARK, bg: shade ? LGRAY : WHITE, align, wrap });
    const tot    = (v, align = 'center') =>
                        cell(v, { bold: true, fg: RED, bg: RED_L, align, sz: 11, bc: RED });

    // ── construir hoja ───────────────────────────────────────────────
    let R = 0;
    const ws = {};
    const merges = [];

    function sc(row, col, c) {
        ws[XLSX.utils.encode_cell({ r: row, c: col })] = c;
    }
    function mg(r1, c1, r2, c2) {
        merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        // rellenar celdas esclavas del merge con mismo fondo
        const anchor = ws[XLSX.utils.encode_cell({ r: r1, c: c1 })];
        if (anchor) {
            for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                    if (r === r1 && c === c1) continue;
                    const addr = XLSX.utils.encode_cell({ r, c });
                    ws[addr] = {
                        v: '', t: 's',
                        s: {
                            fill:   anchor.s.fill,
                            border: anchor.s.border || {},
                            font:   { name: 'Arial', sz: 9 },
                            alignment: { vertical: 'center' }
                        }
                    };
                }
            }
        }
    }
    function blankRow(row, c1, c2, bg = WHITE) {
        for (let c = c1; c <= c2; c++) {
            sc(row, c, cell('', { bg, border: false }));
        }
    }

    // ── TÍTULO ───────────────────────────────────────────────────────
    blankRow(R, 0, 5, WHITE);
    sc(R, 0, cell('SERLOG — Entrega de Turno',
        { bold: true, fg: RED, bg: WHITE, sz: 16, border: false }));
    mg(R, 0, R, 3);
    sc(R, 4, cell('Control y Monitoreo',
        { fg: MUTED, bg: WHITE, sz: 9, align: 'right', border: false }));
    R++;

    // Franja roja
    for (let c = 0; c < 5; c++)
        sc(R, c, cell('', { bg: RED, border: false }));
    R++;

    // Fecha centrada
    sc(R, 0, cell(d.fecha, { bold: true, fg: DARK, bg: LGRAY, sz: 10, align: 'center' }));
    mg(R, 0, R, 4); R++;
    blankRow(R, 0, 4, WHITE); R++;

    // ── SECCIÓN 1 — INFO TURNO ───────────────────────────────────────
    sc(R, 0, secHdr('  1   INFORMACIÓN DEL TURNO'));
    mg(R, 0, R, 4); R++;

    ['TURNO SALIENTE','TURNO ENTRANTE','FECHA','HORA INICIO','HORA TÉRMINO']
        .forEach((l, i) => sc(R, i, tblHdr(l)));
    R++;

    [d.saliente, d.entrante, d.fecha, d.horaI, d.horaT].forEach((v, i) =>
        sc(R, i, cell(v, { bold: true, fg: RED, bg: LGRAY, sz: 10, align: 'center' }))
    );
    R++;

    // Responsables — header
    sc(R, 0, tblHdr('RESPONSABLE ENTREGA DE TURNO'));   mg(R, 0, R, 1);
    sc(R, 2, tblHdr('RESPONSABLE RECEPCIÓN DE TURNO')); mg(R, 2, R, 4); R++;

    // Responsables — valores
    sc(R, 0, dat(d.respEntrega   || '')); mg(R, 0, R, 1);
    sc(R, 2, dat(d.respRecepcion || '')); mg(R, 2, R, 4); R++;
    blankRow(R, 0, 4, WHITE); R++;

    // ── SECCIÓN 2 — SERVICIOS ────────────────────────────────────────
    sc(R, 0, secHdr('  2   RESUMEN DE SERVICIOS MONITOREADOS'));
    mg(R, 0, R, 4); R++;

    sc(R, 0, tblHdr('CUENTA / CLIENTE'));
    sc(R, 1, tblHdr('ACTIVOS'));    mg(R, 1, R, 2);
    sc(R, 3, tblHdr('SERVICIOS URGENCIA')); mg(R, 3, R, 4); R++;

    d.srvRows.forEach((row, i) => {
        const sh = i % 2 === 1;
        sc(R, 0, dat(row.cliente, sh));
        sc(R, 1, cell(row.activos,
            { bold: true, fg: row.activos > 0 ? RED : DARK,
              bg: sh ? LGRAY : WHITE, align: 'center', sz: 10 }));
        mg(R, 1, R, 2);
        sc(R, 3, dat(String(row.urgencia), sh, 'center')); mg(R, 3, R, 4);
        R++;
    });

    sc(R, 0, tot('TOTAL', 'left'));
    sc(R, 1, tot(d.totalA));       mg(R, 1, R, 2);
    sc(R, 3, tot(d.totalU));       mg(R, 3, R, 4);
    R++;
    blankRow(R, 0, 4, WHITE); R++;

    // ── SECCIÓN 3 — DESVIACIONES ─────────────────────────────────────
    sc(R, 0, secHdr('  3   DESVIACIONES RELEVANTES DEL TURNO'));
    mg(R, 0, R, 4); R++;

    sc(R, 0, tblHdr('TIPO DE DESVIACIÓN'));
    sc(R, 1, tblHdr('DETALLE'));
    sc(R, 2, tblHdr('ESTADO / GESTIÓN REALIZADA'));
    sc(R, 3, tblHdr('RESPONSABLE / ESCALAMIENTO')); mg(R, 3, R, 4); R++;

    const hasDesvs = d.desvs.some(x => x.tipo || x.detalle);
    if (!hasDesvs) {
        sc(R, 0, dat('Sin desviaciones registradas')); mg(R, 0, R, 4); R++;
    } else {
        d.desvs.forEach((row, i) => {
            const sh = i % 2 === 1;
            sc(R, 0, dat(row.tipo,   sh)); sc(R, 1, dat(row.detalle, sh));
            sc(R, 2, dat(row.estado, sh));
            sc(R, 3, dat(row.resp,   sh)); mg(R, 3, R, 4); R++;
        });
    }
    blankRow(R, 0, 4, WHITE); R++;

    // ── SECCIÓN 4 — OBSERVACIONES ────────────────────────────────────
    sc(R, 0, secHdr('  4   OBSERVACIONES GENERALES DEL TURNO'));
    mg(R, 0, R, 4); R++;

    if (d.obs && d.obs.trim()) {
        d.obs.split('\n').filter(l => l.trim()).forEach((line, idx) => {
            const sh = idx % 2 === 1;
            sc(R, 0, cell(`${idx + 1}.  ${line.trim()}`,
                { fg: DARK, bg: sh ? LGRAY : WHITE, wrap: true }));
            mg(R, 0, R, 4); R++;
        });
    } else {
        sc(R, 0, dat('Sin observaciones')); mg(R, 0, R, 4); R++;
    }
    blankRow(R, 0, 4, WHITE); R++;

    // ── SECCIÓN 5 — PENDIENTES ───────────────────────────────────────
    sc(R, 0, secHdr('  5   PENDIENTES A SEGUIR EN PRÓXIMO TURNO'));
    mg(R, 0, R, 4); R++;

    sc(R, 0, tblHdr('PENDIENTE'));  mg(R, 0, R, 2);
    sc(R, 3, tblHdr('PRIORIDAD'));
    sc(R, 4, tblHdr('RESPONSABLE SIGUIENTE TURNO')); R++;

    const prioCfg = {
        ALTA:  { bg: ALTA_BG, fg: ALTA_FG },
        MEDIA: { bg: MED_BG,  fg: MED_FG  },
        BAJA:  { bg: BAJA_BG, fg: BAJA_FG }
    };

    if (!d.pends.length) {
        sc(R, 0, dat('Sin pendientes')); mg(R, 0, R, 4); R++;
    } else {
        d.pends.forEach((row, i) => {
            const sh = i % 2 === 1;
            const pc = prioCfg[row.prioridad] || { bg: WHITE, fg: DARK };
            sc(R, 0, dat(row.pendiente, sh, 'left', true)); mg(R, 0, R, 2);
            sc(R, 3, cell(row.prioridad,
                { bold: true, fg: pc.fg, bg: pc.bg, align: 'center', bc: pc.fg }));
            sc(R, 4, dat(row.responsable, sh)); R++;
        });
    }
    blankRow(R, 0, 4, WHITE); R++;

    // ── PIE ──────────────────────────────────────────────────────────
    sc(R, 0, cell('#CulturadelRespeto  ·  SERLOG Control y Monitoreo  ·  Entrega de Turno',
        { italic: true, fg: MUTED, bg: WHITE, sz: 7, align: 'center', border: false }));
    mg(R, 0, R, 4);

    // ── CONFIGURACIÓN FINAL ───────────────────────────────────────────
    ws['!ref']    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R, c: 4 } });
    ws['!merges'] = merges;
    ws['!cols']   = [{ wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 28 }, { wch: 24 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, d.fechaRaw || 'Turno');
    XLSX.writeFile(wb, `Entrega_Turno_${d.fechaRaw}.xlsx`);
    showToast('✓ Excel descargado correctamente');
}
