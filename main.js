
// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

window.addEventListener('beforeunload', function(e) {
    e.preventDefault();
    e.returnValue = '¿Seguro que deseas salir? Los datos ingresados se perderán.';
    return e.returnValue;
});

function initApp() {
    const today = new Date();
    document.getElementById('hdrDate').textContent = today.toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const mainLogo = document.querySelector('header img');
    if (mainLogo) document.getElementById('printLogo').src = mainLogo.src;
    document.getElementById('printDate').textContent = today.toLocaleDateString('es-CL', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    initFlatpickr(today);
    initSrvTable();
    initEvents();
    initializeRows();
}

function initFlatpickr(today) {
    window.fpInstance = flatpickr('#fecha', {
        locale: 'es',
        dateFormat: 'd-m-Y',
        defaultDate: today,
        disableMobile: true,
        onChange: function(selectedDates) {
            if (selectedDates[0]) {
                document.getElementById('hdrDate').textContent =
                    selectedDates[0].toLocaleDateString('es-CL', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });
            }
        }
    });
    const timeConfig = {
        enableTime: true, noCalendar: true, dateFormat: 'H:i',
        time_24hr: true, disableMobile: true, minuteIncrement: 30,
    };
    flatpickr('#horaInicio', timeConfig);
    flatpickr('#horaTermino', timeConfig);
}

// ========== TABLA DE SERVICIOS DINÁMICA ==========
// Clientes fijos con su urgencia predeterminada
const DEFAULT_CLIENTES = [
    { nombre: 'MINERIA DISTRIBUCION 43',  urgenciaTexto: true  },
    { nombre: 'TECK CONCU',               urgenciaTexto: false },
    { nombre: 'CAPSTONE',                 urgenciaTexto: false },
    { nombre: 'TECK ANTOFAGASTA',         urgenciaTexto: false },
    { nombre: 'CHUQUI SUBTERRANEO',       urgenciaTexto: false },
    { nombre: 'COLLAHUASI',               urgenciaTexto: false },
];

function initSrvTable() {
    const tbody = document.getElementById('srvTbody');
    tbody.innerHTML = '';
    DEFAULT_CLIENTES.forEach(c => addSrvRow(c.nombre, 0, '', c.urgenciaTexto, false));
}

function addSrvRow(nombre = '', activos = 0, urgencia = '', urgenciaTexto = true, esNuevo = true) {
    const tbody = document.getElementById('srvTbody');
    const tr = document.createElement('tr');
    tr.className = 'srv-data-row';

    const urgCell = urgenciaTexto
        ? `<input type="text" class="srv-urgencia" placeholder="Ej: 7 EN RUTA / 3 DETENIDAS" value="${escHtml(urgencia)}">`
        : `<input type="text" class="srv-urgencia" placeholder="N/A" value="${escHtml(urgencia)}">`;

    const clienteCell = esNuevo
        ? `<input type="text" class="srv-cliente-input" placeholder="Nombre del cliente..." value="${escHtml(nombre)}">`
        : `<span class="srv-cliente-fixed">${escHtml(nombre)}</span><input type="hidden" class="srv-cliente-input" value="${escHtml(nombre)}">`;

    tr.innerHTML = `
        <td>${clienteCell}</td>
        <td><input type="number" class="srv-activos" min="0" placeholder="0" value="${activos || ''}"></td>
        <td>${urgCell}</td>
        <td class="no-print"><button class="remove-btn srv-remove" title="Eliminar fila">×</button></td>
    `;

    tr.querySelector('.srv-activos').addEventListener('input', calcTotals);
    tr.querySelector('.srv-remove').addEventListener('click', function() {
        tr.remove();
        calcTotals();
    });

    tbody.appendChild(tr);
    calcTotals();
}

function initEvents() {
    document.getElementById('addClienteBtn').addEventListener('click', () => addSrvRow('', 0, '', true, true));
    document.getElementById('addDesviacionBtn').addEventListener('click', () => addDesviacion());
    document.getElementById('addPendienteBtn').addEventListener('click', () => addPendiente());
    document.getElementById('exportExcelBtn').addEventListener('click', exportExcel);
    document.getElementById('exportPDFBtn').addEventListener('click', exportPDF);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
}

function initializeRows() {
    addDesviacion();
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
        const v = Number(input.value);
        if (!isNaN(v) && input.value.trim() !== '' && input.value.trim() !== 'N/A') {
            totalUrgencia += v;
        }
    });
    document.getElementById('totalActivos').textContent = totalActivos;
    const urgEl = document.getElementById('totalUrgencia');
    if (urgEl) urgEl.textContent = totalUrgencia > 0 ? totalUrgencia : '';
}

function escHtml(str) {
    return String(str).replace(/[&<>"']/g, function(c) {
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
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

// ========== DESVIACIONES ==========
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

// ========== PENDIENTES ==========
const PEND_PLACEHOLDERS = [
    'ENVIO PUNTO A PUNTO AL FINALIZAR TURNO',
    'ENVIAR SERVICIOS POR ACTIVAR Y FINALIZAR DURANTE EL TURNO',
    'REALIZAR KPI DE LA SEMANA EN CURSO'
];
let pendId = 0;
function addPendiente(pend = '', prio = 'ALTA', resp = '') {
    const container = document.getElementById('pendContainer');
    const idx = pendId++;
    // Determinar el placeholder basado en el índice, pero si es una fila existente con valor, usar ese valor
    const placeholder = (pend === '' && idx < PEND_PLACEHOLDERS.length) ? PEND_PLACEHOLDERS[idx] : 'Descripción del pendiente...';
    const div = document.createElement('div');
    div.className = 'pend-row';
    div.innerHTML = `
        <input type="text" class="pend-input" placeholder="${escHtml(placeholder)}" value="${escHtml(pend)}">
        <select class="prio-sel" onchange="updatePrioColor(this)">
            <option value="ALTA"  ${prio==='ALTA' ?'selected':''}>Alta</option>
            <option value="MEDIA" ${prio==='MEDIA'?'selected':''}>Media</option>
            <option value="BAJA"  ${prio==='BAJA' ?'selected':''}>Baja</option>
        </select>
        <input type="text" placeholder="Responsable..." value="${escHtml(resp)}">
        <button class="remove-btn" onclick="this.closest('.pend-row').remove()" title="Eliminar">×</button>
    `;
    container.appendChild(div);
    updatePrioColor(div.querySelector('.prio-sel'));
}
function updatePrioColor(select) {
    select.className = 'prio-sel';
    if (select.value === 'ALTA')       select.classList.add('prior-alta');
    else if (select.value === 'MEDIA') select.classList.add('prior-media');
    else                               select.classList.add('prior-baja');
}

// ========== RECOLECCIÓN DE DATOS ==========
function collectData() {
    const fecha       = getFechaDisplay();
    const fechaRaw    = getFechaRaw();
    const horaI       = document.getElementById('horaInicio').value;
    const horaT       = document.getElementById('horaTermino').value;
    const saliente    = document.getElementById('turnoSaliente').value;
    const entrante    = document.getElementById('turnoEntrante').value;
    const obs         = document.getElementById('observaciones').value;
    const respEntrega   = document.getElementById('responsableEntrega').value;
    const respRecepcion = document.getElementById('responsableRecepcion').value;

    // Servicios — leer filas dinámicas
    let totalA = 0;
    const srvRows = [];
    document.querySelectorAll('#srvTbody .srv-data-row').forEach(tr => {
        const clienteInput = tr.querySelector('.srv-cliente-input');
        const activosInput = tr.querySelector('.srv-activos');
        const urgInput     = tr.querySelector('.srv-urgencia');
        const cliente  = clienteInput?.value || '';
        const activos  = Number(activosInput?.value) || 0;
        const urgencia = urgInput?.value || 'N/A';
        totalA += activos;
        srvRows.push({ cliente, activos, urgencia });
    });

    const desvs = [];
    document.querySelectorAll('.desv-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        desvs.push({
            tipo:    inputs[0]?.value || '',
            detalle: inputs[1]?.value || '',
            estado:  inputs[2]?.value || '',
            resp:    inputs[3]?.value || ''
        });
    });

    const pends = [];
    document.querySelectorAll('.pend-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const select = row.querySelector('select');
        pends.push({
            pendiente:   inputs[0]?.value || '',
            prioridad:   select?.value || 'ALTA',
            responsable: inputs[1]?.value || ''
        });
    });

    return { fecha, fechaRaw, horaI, horaT, saliente, entrante, obs,
             respEntrega, respRecepcion, srvRows, totalA, desvs, pends };
}

// ========== LIMPIAR FORMULARIO ==========
function clearForm() {
    if (!confirm('¿Limpiar todo el formulario?')) return;
    restoreTextarea();
    if (window.fpInstance) window.fpInstance.setDate(new Date());
    const hi = document.getElementById('horaInicio')._flatpickr;
    const ht = document.getElementById('horaTermino')._flatpickr;
    if (hi) hi.clear();
    if (ht) ht.clear();
    document.getElementById('observaciones').value = '';
    document.getElementById('turnoSaliente').value = '';
    document.getElementById('turnoEntrante').value = '';
    document.getElementById('responsableEntrega').value = '';
    document.getElementById('responsableRecepcion').value = '';
    initSrvTable();
    document.getElementById('desvContainer').innerHTML = '';
    document.getElementById('pendContainer').innerHTML = '';
    calcTotals();
    addDesviacion();
    pendId = 0;
    addPendiente(); addPendiente(); addPendiente();
}

// ========== PDF ==========
function fixPrintObservations() {
    restoreTextarea();
    const obsTextarea = document.getElementById('observaciones');
    const obsValue = obsTextarea.value;
    if (obsValue && obsValue.trim() !== '') {
        const lines = obsValue.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
            const formattedDiv = document.createElement('div');
            formattedDiv.id = 'print-observations-content';
            formattedDiv.className = 'print-observations-content';
            lines.forEach((line, index) => {
                const lineDiv = document.createElement('div');
                lineDiv.textContent = `${index + 1}. ${line.trim()}`;
                formattedDiv.appendChild(lineDiv);
            });
            obsTextarea.parentNode.insertBefore(formattedDiv, obsTextarea.nextSibling);
        }
    }
}
function restoreTextarea() {
    const fc = document.getElementById('print-observations-content');
    if (fc) fc.remove();
}
function exportPDF() {
    fixPrintObservations();
    showToast('Preparando PDF horizontal (A4)...');
    // Remove any prior forced style
    const old = document.getElementById('force-landscape-style');
    if (old) old.remove();
    const styleEl = document.createElement('style');
    styleEl.id = 'force-landscape-style';
    // Use both @page and html forced dimensions for maximum browser compat
    styleEl.textContent = [
        '@page { size: 297mm 210mm !important; margin: 8mm !important; }',
        'html { width: 297mm !important; height: 210mm !important; }'
    ].join('\n');
    document.head.appendChild(styleEl);
    setTimeout(() => {
        window.print();
    }, 300);
    window.addEventListener('focus', function onFocus() {
        restoreTextarea();
        const fs = document.getElementById('force-landscape-style');
        if (fs) fs.remove();
        window.removeEventListener('focus', onFocus);
    });
}

// ========== EXPORTACIÓN A EXCEL ==========
function exportExcel() {
    const d = collectData();

    const RED     = 'C00000';
    const WHITE   = 'FFFFFF';
    const LGRAY   = 'F2F2F2';
    const DARK    = '000000';
    const ALTA_BG = 'FDECEA'; const ALTA_FG = 'C00000';
    const MED_BG  = 'FFF8E1'; const MED_FG  = 'B7770D';
    const BAJA_BG = 'E8F5E9'; const BAJA_FG = '27AE60';

    function bd(color, style = 'thin') {
        const s = { style, color: { rgb: color } };
        return { top: s, bottom: s, left: s, right: s };
    }
    function cell(val, { bold=false, italic=false, fg=DARK, bg=WHITE, sz=11,
                         align='left', valign='center', wrap=false,
                         border=true, bc='BFBFBF' } = {}) {
        const isNum = typeof val === 'number';
        return {
            v: val ?? '', t: isNum ? 'n' : 's',
            s: {
                font:      { bold, italic, color: { rgb: fg }, sz, name: 'Calibri' },
                fill:      { fgColor: { rgb: bg }, patternType: 'solid' },
                alignment: { horizontal: align, vertical: valign, wrapText: wrap },
                border:    border ? bd(bc) : {}
            }
        };
    }
    const secHdr  = v => cell(v, { bold:true, fg:WHITE, bg:RED, sz:11, align:'center', bc:RED });
    const tblHdr  = v => cell(v, { bold:true, fg:RED,   bg:LGRAY, sz:11, align:'center', bc:'BFBFBF' });
    const fieldLbl = v => cell(v, { bold:true, fg:WHITE, bg:RED, sz:11, bc:RED });
    const fieldVal = v => cell(v, { bold:true, fg:DARK,  bg:WHITE, sz:11, bc:'BFBFBF' });
    const dat = (v, shade=false, align='left', wrap=false) =>
        cell(v, { fg:DARK, bg:shade?LGRAY:WHITE, align, wrap, sz:11 });

    let R = 0;
    const ws = {};
    const merges = [];
    function sc(row, col, c) { ws[XLSX.utils.encode_cell({r:row,c:col})] = c; }
    function fillMerge(r1,c1,r2,c2,anchor) {
        for (let r=r1;r<=r2;r++) for (let c=c1;c<=c2;c++) {
            if (r===r1&&c===c1) continue;
            ws[XLSX.utils.encode_cell({r,c})] = {
                v:'',t:'s',
                s:{ fill:anchor.s.fill, border:anchor.s.border||{},
                    font:{name:'Calibri',sz:11}, alignment:{vertical:'center'} }
            };
        }
    }
    function mg(r1,c1,r2,c2) {
        merges.push({s:{r:r1,c:c1},e:{r:r2,c:c2}});
        const anchor = ws[XLSX.utils.encode_cell({r:r1,c:c1})];
        if (anchor) fillMerge(r1,c1,r2,c2,anchor);
    }
    function blankRow(row) {
        for (let c=0;c<=4;c++) sc(row,c,cell('',{bg:WHITE,border:false}));
    }
    function margin(row) { sc(row,0,cell('',{bg:WHITE,border:false})); }

    // ── FILA 1: espacio ──
    blankRow(R); R++;

    // ── FILA 2: TÍTULO con logo ──
    margin(R);
    sc(R,1,cell('Entrega de Turno – Control y Monitoreo',
        {bold:true,fg:WHITE,bg:RED,sz:14,align:'center',bc:RED}));
    mg(R,1,R,4); R++;

    blankRow(R); R++;

    // ── INFO TURNO ──
    margin(R); sc(R,1,fieldLbl('Turno saliente'));
    sc(R,2,fieldVal(d.saliente||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Turno entrante'));
    sc(R,2,fieldVal(d.entrante||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Fecha'));
    sc(R,2,fieldVal(d.fecha||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Hora inicio turno'));
    sc(R,2,fieldVal(d.horaI||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Hora término turno'));
    sc(R,2,fieldVal(d.horaT||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Responsable Entrega'));
    sc(R,2,fieldVal(d.respEntrega||'')); mg(R,2,R,4); R++;
    margin(R); sc(R,1,fieldLbl('Responsable Recepción'));
    sc(R,2,fieldVal(d.respRecepcion||'')); mg(R,2,R,4); R++;
    blankRow(R); R++;

    // ── SERVICIOS ──
    margin(R); sc(R,1,secHdr('Resumen de Servicios Monitoreados')); mg(R,1,R,4); R++;
    margin(R);
    sc(R,1,tblHdr('Cuenta / Cliente'));
    sc(R,2,tblHdr('Activos'));
    sc(R,3,tblHdr('Servicios Urgencia')); mg(R,3,R,4); R++;
    d.srvRows.forEach((row,i) => {
        const sh = i%2===1;
        margin(R);
        sc(R,1,dat(row.cliente,sh));
        sc(R,2,cell(row.activos,{bold:true,fg:DARK,bg:sh?LGRAY:WHITE,align:'center',sz:11}));
        sc(R,3,dat(String(row.urgencia),sh,'center')); mg(R,3,R,4); R++;
    });
    // Calcular suma de urgencias numéricas
    let totalUrgNum = 0;
    d.srvRows.forEach(row => {
        const v = Number(row.urgencia);
        if (!isNaN(v) && String(row.urgencia).trim() !== '' && String(row.urgencia).trim() !== 'N/A') {
            totalUrgNum += v;
        }
    });
    margin(R);
    sc(R,1,cell('TOTAL',{bold:true,fg:DARK,bg:WHITE,sz:11,bc:'BFBFBF'}));
    sc(R,2,cell(d.totalA,{bold:true,fg:DARK,bg:WHITE,sz:11,align:'center',bc:'BFBFBF'}));
    sc(R,3,cell(totalUrgNum > 0 ? totalUrgNum : '',{bold:true,fg:DARK,bg:WHITE,sz:11,align:'center',bc:'BFBFBF'})); mg(R,3,R,4); R++;
    blankRow(R); R++;

    // ── DESVIACIONES ──
    margin(R); sc(R,1,secHdr('Desviaciones Relevantes del Turno')); mg(R,1,R,4); R++;
    margin(R);
    sc(R,1,tblHdr('Tipo de Desviación'));
    sc(R,2,tblHdr('Detalle'));
    sc(R,3,tblHdr('Estado / Gestión Realizada'));
    sc(R,4,tblHdr('Responsable / Escalamiento')); R++;
    const hasDesvs = d.desvs.some(x=>x.tipo||x.detalle);
    if (!hasDesvs) { margin(R); sc(R,1,dat('Sin desviaciones registradas')); mg(R,1,R,4); R++; }
    else d.desvs.forEach((row,i) => {
        const sh=i%2===1; margin(R);
        sc(R,1,dat(row.tipo,sh)); sc(R,2,dat(row.detalle,sh,'left',true));
        sc(R,3,dat(row.estado,sh,'left',true)); sc(R,4,dat(row.resp,sh)); R++;
    });
    blankRow(R); R++;

    // ── OBSERVACIONES ──
    margin(R); sc(R,1,secHdr('Observaciones Generales del Turno')); mg(R,1,R,4); R++;
    if (d.obs&&d.obs.trim()) {
        d.obs.split('\n').filter(l=>l.trim()).forEach((line,idx) => {
            const sh=idx%2===1; margin(R);
            sc(R,1,cell(line.trim(),{fg:DARK,bg:sh?LGRAY:WHITE,wrap:true,sz:11}));
            mg(R,1,R,4); R++;
        });
    } else { margin(R); sc(R,1,dat('Sin observaciones')); mg(R,1,R,4); R++; }
    blankRow(R); R++;

    // ── PENDIENTES ──
    margin(R); sc(R,1,secHdr('Pendientes a Seguir en Próximo Turno')); mg(R,1,R,4); R++;
    margin(R);
    sc(R,1,tblHdr('Pendiente')); mg(R,1,R,2);
    sc(R,3,tblHdr('Prioridad (Alta/Media/Baja)'));
    sc(R,4,tblHdr('Responsable Siguiente Turno')); R++;
    const prioCfg = {
        ALTA:{bg:ALTA_BG,fg:ALTA_FG}, MEDIA:{bg:MED_BG,fg:MED_FG}, BAJA:{bg:BAJA_BG,fg:BAJA_FG}
    };
    if (!d.pends.length) { margin(R); sc(R,1,dat('Sin pendientes')); mg(R,1,R,4); R++; }
    else d.pends.forEach((row,i) => {
        const sh=i%2===1; const pc=prioCfg[row.prioridad]||{bg:WHITE,fg:DARK};
        margin(R);
        sc(R,1,dat(row.pendiente,sh,'left',true)); mg(R,1,R,2);
        sc(R,3,cell(row.prioridad,{bold:true,fg:pc.fg,bg:pc.bg,sz:11,align:'center',bc:pc.fg}));
        sc(R,4,dat(row.responsable,sh)); R++;
    });
    blankRow(R); R++;

    // ── CONFIG FINAL ──
    ws['!ref']    = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R,c:4}});
    ws['!merges'] = merges;
    ws['!cols']   = [{wch:2},{wch:34},{wch:24},{wch:24},{wch:27}];

    // ── INSERTAR LOGO en esquina superior derecha (col E, fila 1) ──
    try {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Entrega de Turno');

        // Agregar imagen al workbook
        const imgData = LOGO_B64;
        wb.Sheets['Entrega de Turno']['!images'] = [{
            name: 'logo.jpg',
            data: imgData,
            opts: { base64: true },
            position: {
                type: 'twoCellAnchor',
                attrs: { editAs: 'oneCell' },
                from: { col: 4, row: 0, colOff: 0, rowOff: 0 },
                to:   { col: 4, row: 2, colOff: 0, rowOff: 0 }
            }
        }];

        XLSX.writeFile(wb, `ENTREGA_TURNO__${d.fechaRaw}.xlsx`);
    } catch(e) {
        // fallback sin imagen si falla
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Entrega de Turno');
        XLSX.writeFile(wb, `ENTREGA_TURNO__${d.fechaRaw}.xlsx`);
    }
    showToast('✓ Excel descargado correctamente');
}