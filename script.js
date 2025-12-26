// Variables globales
let csv1Data = null;
let csv2Data = null;
let csv3Data = null;
let trades = [];
let dataTable = null;
let allSymbols = new Set();
let isDarkMode = false; // Variable para modo oscuro

const SPREADSHEET_ID = '1_UOs_krgVKLCPAxRVUOpxcUoU87DLoCe-3qmrApT-zw';
const API_KEY = 'AIzaSyA7mopLqNqpsAItOXdiOozIP_WUMpvKQXU';
const sheet1Url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Hoja%201!A:Z?key=${API_KEY}`;
const sheet2Url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Hoja%202!A:Z?key=${API_KEY}`;
const sheet3Url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Hoja%203!A:Z?key=${API_KEY}`;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingElement = document.getElementById('loading');
    const tradesTable = document.getElementById('tradesTable');
    const tradesBody = document.getElementById('tradesBody');
    const symbolFilter = document.getElementById('symbolFilter');
    const menuBtn = document.getElementById('menuBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const resetBtn = document.getElementById('resetBtn');
    const helpBtn = document.getElementById('helpBtn');
    const themeToggle = document.getElementById('themeToggle');
    const uploadSection = document.querySelector('.upload-section');
    
    // Elementos de estado de archivos
    const csv1Status = document.getElementById('csv1-status');
    const csv2Status = document.getElementById('csv2-status');
    const csv3Status = document.getElementById('csv3-status');
    
    // Elementos de KPI
    const totalTradesElement = document.getElementById('totalTrades');
    const totalRealizedElement = document.getElementById('totalRealized');
    const totalFeesElement = document.getElementById('totalFees');
    const totalNetElement = document.getElementById('totalNet');
    const winRateElement = document.getElementById('winRate');
    const winLossRatioElement = document.getElementById('winLossRatio');
    const profitFactorElement = document.getElementById('profitFactor');
    const avgWinLossElement = document.getElementById('avgWinLoss');
    const totalFundingElement = document.getElementById('totalFunding');
    const totalLossesElement = document.getElementById('totalLosses');
    
    // Inicializar tema desde localStorage
    const savedTheme = localStorage.getItem('bitmartTheme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    }
    
    // Función para mostrar/ocultar menú
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function() {
        dropdownMenu.style.display = 'none';
    });
    
    // Prevenir que el menú se cierre al hacer clic dentro
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Funcionalidad del menú
    exportPdfBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportToPDF();
    });
    
    resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        resetAnalysis();
    });
    
    helpBtn.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Futuros Bitmart - Análisis de Trades\n\nLos datos se cargan automáticamente desde Google Sheets al abrir la página.\nEl análisis se ejecuta automáticamente una vez cargados los datos.\n1. Espera a que se carguen las hojas (Hoja 1, Hoja 2, Hoja 3)\n2. El análisis se ejecutará automáticamente\n3. Usa el filtro por símbolo para ver trades específicos\n4. Los KPI se actualizan automáticamente\n5. Usa el modo oscuro/claro según tu preferencia');
    });
    
    themeToggle.addEventListener('change', function(e) {
        e.preventDefault();
        if (this.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
    
    // Función para habilitar modo oscuro
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        isDarkMode = true;
        themeToggle.checked = true;
        localStorage.setItem('bitmartTheme', 'dark');
        updateChartThemes();
    }
    
    // Función para deshabilitar modo oscuro
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        isDarkMode = false;
        themeToggle.checked = false;
        localStorage.setItem('bitmartTheme', 'light');
        updateChartThemes();
    }
    
    // Función para actualizar temas de gráficos
    function updateChartThemes() {
        // Esta función se llamará cuando se actualicen los gráficos
        if (trades.length > 0) {
            updateCharts(trades);
        }
    }
    
//PDF

// Función para exportar a PDF
function exportToPDF() {
    if (trades.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Mostrar mensaje de carga
    const loadingMsg = document.createElement('div');
    loadingMsg.style.position = 'fixed';
    loadingMsg.style.top = '50%';
    loadingMsg.style.left = '50%';
    loadingMsg.style.transform = 'translate(-50%, -50%)';
    loadingMsg.style.backgroundColor = 'rgba(0,0,0,0.8)';
    loadingMsg.style.color = 'white';
    loadingMsg.style.padding = '20px';
    loadingMsg.style.borderRadius = '10px';
    loadingMsg.style.zIndex = '9999';
    loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF... Esto puede tomar unos segundos.';
    document.body.appendChild(loadingMsg);
    
    try {
        // Filtro aplicado
        const currentFilter = symbolFilter.value;
        const filteredTrades = currentFilter ? 
            trades.filter(trade => trade.symbol === currentFilter) : 
            trades;
        
        // Ordenar por fecha de cierre (más reciente primero)
        const sortedTrades = [...filteredTrades].sort((a, b) => {
            return parseDate(b.closeTime) - parseDate(a.closeTime);
        });
        
        // Calcular KPI para el PDF
        let totalRealized = 0;
        let totalFees = 0;
        let totalNet = 0;
        let totalFunding = 0;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalWins = 0;
        let totalLosses = 0;
        
        sortedTrades.forEach(trade => {
            totalRealized += trade.realizedProfit || 0;
            totalFees += trade.totalFee || 0;
            totalNet += trade.netProfit || 0;
            totalFunding += trade.fundingFee || 0;
            
            if (trade.netProfit > 0) {
                winningTrades++;
                totalWins += trade.netProfit;
            } else if (trade.netProfit < 0) {
                losingTrades++;
                totalLosses += Math.abs(trade.netProfit);
            }
        });
        
        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
        const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0.00';
        const avgWinLoss = totalTrades > 0 ? (totalNet / totalTrades).toFixed(2) : 0;
        
        // FUNCIÓN MEJORADA para capturar gráficos con tamaño controlado
        function captureCharts() {
            return new Promise((resolve) => {
                const chartImages = {};
                const chartIds = [
                    'cumulativeProfitChart',
                    'netProfitByDayChart', 
                    'profitBySymbolChart',
                    'tradesDistributionChart'
                ];
                
                // Si no hay gráficos, resolver inmediatamente
                const availableCharts = chartIds.filter(id => {
                    const canvas = document.getElementById(id);
                    return canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
                });
                
                if (availableCharts.length === 0) {
                    resolve(chartImages);
                    return;
                }
                
                let chartsCaptured = 0;
                
                const captureChart = (chartId, attempt = 1) => {
                    const canvas = document.getElementById(chartId);
                    if (!canvas || canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
                        chartImages[chartId] = '';
                        chartsCaptured++;
                        checkCompletion();
                        return;
                    }
                    
                    // TAMAÑOS ESPECÍFICOS PARA PDF (más pequeños)
                    const targetWidth = 600; // Ancho máximo para PDF
                    const targetHeight = 350; // Alto máximo para PDF
                    
                    // Calcular escala para mantener proporciones
                    const scaleX = targetWidth / canvas.offsetWidth;
                    const scaleY = targetHeight / canvas.offsetHeight;
                    const scale = Math.min(scaleX, scaleY, 1.5); // No escalar más de 1.5x
                    
                    const capturePromise = new Promise((resolveChart, rejectChart) => {
                        const timeout = setTimeout(() => {
                            rejectChart(new Error('Timeout'));
                        }, 8000);
                        
                        html2canvas(canvas, {
                            backgroundColor: '#ffffff',
                            scale: scale, // Escala controlada
                            useCORS: true,
                            logging: false,
                            allowTaint: true,
                            width: canvas.offsetWidth,
                            height: canvas.offsetHeight,
                            windowWidth: canvas.offsetWidth,
                            windowHeight: canvas.offsetHeight
                        }).then(chartCanvas => {
                            clearTimeout(timeout);
                            
                            // Redimensionar a tamaño fijo para PDF
                            const finalCanvas = document.createElement('canvas');
                            finalCanvas.width = targetWidth;
                            finalCanvas.height = targetHeight;
                            
                            const ctx = finalCanvas.getContext('2d');
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, targetWidth, targetHeight);
                            
                            // Centrar la imagen
                            const x = (targetWidth - chartCanvas.width * (targetHeight / chartCanvas.height)) / 2;
                            const scaledWidth = chartCanvas.width * (targetHeight / chartCanvas.height);
                            
                            ctx.drawImage(chartCanvas, x, 0, scaledWidth, targetHeight);
                            
                            chartImages[chartId] = finalCanvas.toDataURL('image/jpeg', 0.9);
                            resolveChart();
                        }).catch(error => {
                            clearTimeout(timeout);
                            rejectChart(error);
                        });
                    });
                    
                    capturePromise.then(() => {
                        chartsCaptured++;
                        checkCompletion();
                    }).catch(error => {
                        console.warn(`Error capturando gráfico ${chartId}:`, error);
                        
                        if (attempt < 2) {
                            setTimeout(() => captureChart(chartId, attempt + 1), 500);
                        } else {
                            chartImages[chartId] = '';
                            chartsCaptured++;
                            checkCompletion();
                        }
                    });
                };
                
                chartIds.forEach(chartId => captureChart(chartId));
                
                function checkCompletion() {
                    if (chartsCaptured === chartIds.length) {
                        resolve(chartImages);
                    }
                }
            });
        }
        
        // Capturar gráficos primero
        captureCharts().then(chartImages => {
            // GENERAR HTML OPTIMIZADO PARA PDF
            const pdfHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Bitmart Trades Report</title>
                    <style>
                        /* ESTILOS ESPECÍFICOS PARA PDF - COMPACTOS Y SIN CORTES */
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 10px;
                            color: #333;
                            background: white;
                            font-size: 10px;
                            line-height: 1.3;
                            width: 100%;
                            max-width: 100%;
                            overflow-x: hidden;
                        }
                        
                        .report-container {
                            width: 100%;
                            max-width: 100%;
                            margin: 0 auto;
                            padding: 5px;
                        }
                        
                        /* HEADER - MÁS COMPACTO */
                        .header {
                            text-align: center;
                            margin-bottom: 15px;
                            padding-bottom: 10px;
                            border-bottom: 1px solid #2c3e50;
                            page-break-after: avoid;
                        }
                        
                        .header h1 {
                            color: #2c3e50;
                            margin: 0 0 5px 0;
                            font-size: 16px;
                            font-weight: bold;
                        }
                        
                        .header-date {
                            color: #666;
                            font-size: 10px;
                        }
                        
                        /* FILTER INFO */
                        .filter-info {
                            background: #3498db;
                            color: white;
                            padding: 8px 10px;
                            border-radius: 4px;
                            margin: 0 0 15px 0;
                            text-align: center;
                            font-weight: 600;
                            font-size: 11px;
                            page-break-after: avoid;
                        }
                        
                        /* SECTIONS */
                        .section {
                            margin-bottom: 20px;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        
                        .section-title {
                            background: #2c3e50;
                            color: white;
                            padding: 8px 10px;
                            border-radius: 4px 4px 0 0;
                            margin: 0;
                            font-size: 13px;
                            font-weight: 600;
                            page-break-after: avoid;
                        }
                        
                        .section-content {
                            background-color: #f8f9fa;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-top: none;
                            border-radius: 0 0 4px 4px;
                        }
                        
                        /* KPI GRID - 2x4 DISEÑO MÁS COMPACTO */
                        .kpi-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            margin: 0;
                        }
                        
                        .kpi-card {
                            background: white;
                            border-radius: 4px;
                            padding: 10px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            border-left: 3px solid #3498db;
                            min-height: 60px;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            page-break-inside: avoid;
                        }
                        
                        .kpi-title {
                            font-size: 9px;
                            color: #666;
                            margin: 0 0 5px 0;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                        }
                        
                        .kpi-value {
                            font-size: 14px;
                            font-weight: bold;
                            margin: 0 0 3px 0;
                            line-height: 1.2;
                        }
                        
                        .kpi-subtitle {
                            font-size: 8px;
                            color: #888;
                            margin: 2px 0 0 0;
                            line-height: 1.2;
                        }
                        
                        /* COLORS */
                        .positive {
                            color: #27ae60 !important;
                        }
                        
                        .negative {
                            color: #e74c3c !important;
                        }
                        
                        /* CHARTS GRID - 1 COLUMNA PARA EVITAR CORTES */
                        .charts-grid {
                            display: grid;
                            grid-template-columns: 1fr;
                            gap: 15px;
                            margin: 0;
                        }
                        
                        .chart-container {
                            background: white;
                            border-radius: 4px;
                            padding: 10px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            text-align: center;
                            page-break-inside: avoid;
                        }
                        
                        .chart-title {
                            font-size: 11px;
                            font-weight: 600;
                            color: #2c3e50;
                            margin: 0 0 8px 0;
                        }
                        
                        .chart-image {
                            max-width: 100% !important;
                            width: 100% !important;
                            height: auto !important;
                            max-height: 220px !important;
                            border-radius: 3px;
                            display: block;
                            margin: 0 auto;
                        }
                        
                        .no-chart {
                            color: #999;
                            font-style: italic;
                            padding: 20px 10px;
                            background: #f5f5f5;
                            border-radius: 3px;
                            font-size: 10px;
                        }
                        
                        /* TABLE - COMPACTA Y CON SCROLL HORIZONTAL EN HTML */
                        .table-container {
                            width: 100%;
                            overflow-x: auto;
                            margin: 0 0 10px 0;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 0;
                            font-size: 9px;
                            min-width: 700px; /* Ancho mínimo para que no se corte */
                        }
                        
                        th {
                            background: #2c3e50;
                            color: white;
                            padding: 6px 8px;
                            text-align: left;
                            font-weight: 600;
                            border: 1px solid #34495e;
                            font-size: 9px;
                            white-space: nowrap;
                        }
                        
                        td {
                            padding: 5px 6px;
                            border: 1px solid #ddd;
                            font-size: 8px;
                            vertical-align: middle;
                        }
                        
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        
                        /* SUMMARY */
                        .summary {
                            margin: 15px 0 0 0;
                            padding: 10px;
                            background: #ecf0f1;
                            border-radius: 4px;
                            text-align: center;
                            font-size: 10px;
                            font-weight: 600;
                            page-break-before: avoid;
                        }
                        
                        /* FOOTER */
                        .footer {
                            margin: 20px 0 0 0;
                            padding: 15px 0 0 0;
                            border-top: 1px solid #ddd;
                            color: #666;
                            font-size: 8px;
                            text-align: center;
                            page-break-before: avoid;
                        }
                        
                        .footer strong {
                            color: #2c3e50;
                        }
                        
                        /* CONTROL DE PAGINACIÓN PARA PDF */
                        @media print {
                            body {
                                padding: 5mm !important;
                                font-size: 9px !important;
                                width: 100% !important;
                            }
                            
                            .report-container {
                                padding: 0 !important;
                            }
                            
                            .section {
                                break-inside: avoid !important;
                                page-break-inside: avoid !important;
                                margin-bottom: 15px !important;
                            }
                            
                            .kpi-grid {
                                grid-template-columns: repeat(2, 1fr) !important;
                                gap: 8px !important;
                            }
                            
                            .kpi-card {
                                padding: 8px !important;
                                min-height: 55px !important;
                            }
                            
                            .charts-grid {
                                grid-template-columns: 1fr !important;
                                gap: 12px !important;
                            }
                            
                            .chart-image {
                                max-height: 200px !important;
                            }
                            
                            .table-container {
                                overflow-x: visible !important;
                            }
                            
                            table {
                                font-size: 8px !important;
                                min-width: 100% !important;
                            }
                            
                            th, td {
                                padding: 4px 5px !important;
                            }
                            
                            /* Forzar saltos de página después de secciones grandes */
                            .section:nth-child(3) { /* Después de gráficos */
                                page-break-before: always !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="report-container">
                        <!-- Header -->
                        <div class="header">
                            <h1>Futuros Bitmart - Análisis de Trades</h1>
                            <div class="header-date">Reporte generado el ${new Date().toLocaleString('es-ES')}</div>
                        </div>
                        
                        <!-- Filtro Info -->
                        ${currentFilter ? `
                            <div class="filter-info">
                                Símbolo filtrado: ${currentFilter}
                            </div>
                        ` : ''}
                        
                        <!-- KPI Section - DISEÑO 2x4 -->
                        <div class="section">
                            <h2 class="section-title">Indicadores Clave (KPI)</h2>
                            <div class="section-content">
                                <div class="kpi-grid">
                                    <!-- Fila 1 -->
                                    <div class="kpi-card">
                                        <div class="kpi-title">Total Trades</div>
                                        <div class="kpi-value">${totalTrades}</div>
                                        <div class="kpi-subtitle">Operaciones totales</div>
                                    </div>
                                    
                                    <div class="kpi-card">
                                        <div class="kpi-title">Ganancia Neta</div>
                                        <div class="kpi-value ${totalNet >= 0 ? 'positive' : 'negative'}">
                                            ${totalNet.toFixed(2)}
                                        </div>
                                        <div class="kpi-subtitle">
                                            Bruto: <span class="${totalRealized >= 0 ? 'positive' : 'negative'}">
                                                ${totalRealized.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <!-- Fila 2 -->
                                    <div class="kpi-card">
                                        <div class="kpi-title">Win Rate</div>
                                        <div class="kpi-value ${parseFloat(winRate) >= 50 ? 'positive' : 'negative'}">
                                            ${winRate}%
                                        </div>
                                        <div class="kpi-subtitle">Ganadoras: ${winningTrades} / Perdedoras: ${losingTrades}</div>
                                    </div>
                                    
                                    <div class="kpi-card">
                                        <div class="kpi-title">Profit Factor</div>
                                        <div class="kpi-value">${profitFactor}</div>
                                        <div class="kpi-subtitle">Rendimiento</div>
                                    </div>
                                    
                                    <!-- Fila 3 -->
                                    <div class="kpi-card">
                                        <div class="kpi-title">Promedio Win/Loss</div>
                                        <div class="kpi-value ${avgWinLoss >= 0 ? 'positive' : 'negative'}">
                                            ${avgWinLoss}
                                        </div>
                                        <div class="kpi-subtitle">Por operación</div>
                                    </div>
                                    
                                    <div class="kpi-card">
                                        <div class="kpi-title">Funding Fee</div>
                                        <div class="kpi-value negative">${totalFunding.toFixed(2)}</div>
                                        <div class="kpi-subtitle">Total funding</div>
                                    </div>
                                    
                                    <!-- Fila 4 -->
                                    <div class="kpi-card">
                                        <div class="kpi-title">Pérdidas Totales</div>
                                        <div class="kpi-value negative">${totalLosses.toFixed(2)}</div>
                                        <div class="kpi-subtitle">Total negativo</div>
                                    </div>
                                    
                                    <div class="kpi-card">
                                        <div class="kpi-title">Fees Totales</div>
                                        <div class="kpi-value negative">${totalFees.toFixed(2)}</div>
                                        <div class="kpi-subtitle">Comisiones</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Charts Section - SOLO si hay gráficos y en 1 columna -->
                        ${Object.values(chartImages).some(img => img) ? `
                            <div class="section">
                                <h2 class="section-title">Gráficos de Análisis</h2>
                                <div class="section-content">
                                    <div class="charts-grid">
                                        ${chartImages.cumulativeProfitChart ? `
                                            <div class="chart-container">
                                                <div class="chart-title">Ganancia Acumulada</div>
                                                <img src="${chartImages.cumulativeProfitChart}" class="chart-image" alt="Ganancia Acumulada">
                                            </div>
                                        ` : ''}
                                        
                                        ${chartImages.netProfitByDayChart ? `
                                            <div class="chart-container">
                                                <div class="chart-title">Beneficio Neto por Día</div>
                                                <img src="${chartImages.netProfitByDayChart}" class="chart-image" alt="Beneficio Neto por Día">
                                            </div>
                                        ` : ''}
                                        
                                        ${chartImages.profitBySymbolChart ? `
                                            <div class="chart-container">
                                                <div class="chart-title">Beneficio por Símbolo</div>
                                                <img src="${chartImages.profitBySymbolChart}" class="chart-image" alt="Beneficio por Símbolo">
                                            </div>
                                        ` : ''}
                                        
                                        ${chartImages.tradesDistributionChart ? `
                                            <div class="chart-container">
                                                <div class="chart-title">Distribución de Operaciones</div>
                                                <img src="${chartImages.tradesDistributionChart}" class="chart-image" alt="Distribución de Operaciones">
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Trades Table - CON CONTENEDOR PARA SCROLL -->
                        <div class="section">
                            <h2 class="section-title">Trades Detallados (${sortedTrades.length} operaciones)</h2>
                            <div class="section-content">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th style="width: 120px;">Fecha Cierre</th>
                                                <th style="width: 80px;">Símbolo</th>
                                                <th style="width: 100px;">Realized Profit</th>
                                                <th style="width: 80px;">Fee</th>
                                                <th style="width: 90px;">Funding Fee</th>
                                                <th style="width: 100px;">Net Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${sortedTrades.map((trade, index) => `
                                                <tr>
                                                    <td>${trade.closeTime || ''}</td>
                                                    <td><strong>${trade.symbol || 'N/A'}</strong></td>
                                                    <td class="${(trade.realizedProfit || 0) >= 0 ? 'positive' : 'negative'}">
                                                        ${(trade.realizedProfit || 0).toFixed(4)}
                                                    </td>
                                                    <td class="negative">${(trade.totalFee || 0).toFixed(4)}</td>
                                                    <td class="${(trade.fundingFee || 0) >= 0 ? 'positive' : 'negative'}">
                                                        ${(trade.fundingFee || 0).toFixed(4)}
                                                    </td>
                                                    <td class="${(trade.netProfit || 0) >= 0 ? 'positive' : 'negative'}">
                                                        ${(trade.netProfit || 0).toFixed(4)}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="summary">
                                    <strong>Resumen:</strong> ${sortedTrades.length} operaciones
                                    ${currentFilter ? ` | Símbolo: ${currentFilter}` : ''} 
                                    | Neto: <span class="${totalNet >= 0 ? 'positive' : 'negative'}">${totalNet.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div class="footer">
                            <p>Reporte generado por <strong>Futuros Bitmart - Análisis de Trades</strong></p>
                            <p>© ${new Date().getFullYear()} - Herramienta de análisis para traders</p>
                        </div>
                    </div>
                    
                    <script>
                        // Script para ajustar tabla en HTML (no afecta PDF)
                        window.addEventListener('load', function() {
                            const tables = document.querySelectorAll('table');
                            tables.forEach(table => {
                                table.style.width = '100%';
                            });
                        });
                    </script>
                </body>
                </html>
            `;
            
            // MÉTODO MEJORADO: Crear iframe temporal
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '800px';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            
            document.body.appendChild(iframe);
            
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(pdfHTML);
            iframeDoc.close();
            
            // Esperar a que cargue el contenido
            setTimeout(() => {
                const element = iframeDoc.querySelector('.report-container');
                
                if (!element) {
                    throw new Error('No se pudo cargar el contenido del PDF');
                }
                
                // CONFIGURACIÓN ESPECÍFICA PARA EVITAR CORTES
                const opt = {
                    margin: [5, 5, 5, 5], // Márgenes mínimos
                    filename: `bitmart_trades_${currentFilter || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`,
                    image: { 
                        type: 'jpeg', 
                        quality: 0.9 
                    },
                    html2canvas: { 
                        scale: 0.75, // Escala reducida para evitar cortes
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        width: 800, // Ancho fijo
                        height: element.scrollHeight,
                        windowWidth: 800,
                        scrollX: 0,
                        scrollY: 0,
                        letterRendering: true
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait',
                        compress: true,
                        hotfixes: ["px_scaling"]
                    },
                    pagebreak: {
                        mode: ['avoid-all', 'css', 'legacy'],
                        before: '.section-title',
                        after: '.section'
                    }
                };
                
                // Generar PDF
                html2pdf()
                    .set(opt)
                    .from(element)
                    .save()
                    .then(() => {
                        // Limpiar
                        document.body.removeChild(iframe);
                        document.body.removeChild(loadingMsg);
                    })
                    .catch(error => {
                        console.error('Error generando PDF:', error);
                        document.body.removeChild(iframe);
                        document.body.removeChild(loadingMsg);
                        
                        // Fallback: Intentar con configuración más simple
                        alert('Usando método alternativo...');
                        simplePDFFallback();
                    });
                
            }, 2000); // Dar tiempo para que carguen imágenes
            
            // Función fallback simple
            function simplePDFFallback() {
                const printWindow = window.open('', '_blank');
                printWindow.document.open();
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Bitmart Trades Report</title>
                        <style>
                            body { font-family: Arial; font-size: 10px; padding: 10px; }
                            h1 { font-size: 14px; }
                            table { width: 100%; border-collapse: collapse; font-size: 8px; }
                            th, td { border: 1px solid #000; padding: 4px; }
                            .positive { color: green; }
                            .negative { color: red; }
                        </style>
                    </head>
                    <body>
                        <h1>Bitmart Trades Report - ${new Date().toLocaleDateString()}</h1>
                        <p>Ganancia Neta: <strong>${totalNet.toFixed(2)}</strong></p>
                        <p>Win Rate: ${winRate}% (${winningTrades}/${losingTrades})</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th><th>Símbolo</th><th>Net Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sortedTrades.map(trade => `
                                    <tr>
                                        <td>${trade.closeTime || ''}</td>
                                        <td>${trade.symbol || ''}</td>
                                        <td class="${trade.netProfit >= 0 ? 'positive' : 'negative'}">
                                            ${trade.netProfit.toFixed(4)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
                setTimeout(() => printWindow.close(), 1000);
            }
            
        }).catch(error => {
            console.error('Error:', error);
            document.body.removeChild(loadingMsg);
            alert('Error generando PDF. Intenta con menos datos o sin gráficos.');
        });
        
    } catch (error) {
        console.error('Error en exportToPDF:', error);
        document.body.removeChild(loadingMsg);
        alert('Error: ' + error.message);
    }
}

//FIN PDF    
    // Función para reiniciar análisis
    function resetAnalysis() {
        if (confirm('¿Estás seguro de que quieres reiniciar el análisis? Se recargarán los datos desde Google Sheets.')) {
            csv1Data = null;
            csv2Data = null;
            csv3Data = null;
            trades = [];
            allSymbols.clear();
            
            // Resetear estados
            csv1Status.textContent = 'Cargando...';
            csv1Status.classList.remove('loaded');
            csv2Status.textContent = 'Cargando...';
            csv2Status.classList.remove('loaded');
            csv3Status.textContent = 'Cargando...';
            csv3Status.classList.remove('loaded');
            
            // Recargar datos
            loadDataFromSheets();
            
            // Resetear tabla
            if (dataTable) {
                dataTable.destroy();
            }
            tradesBody.innerHTML = '';
            tradesTable.style.display = 'none';
            
            // Resetear KPI
            resetKPI();
            
            // Resetear filtro
            symbolFilter.innerHTML = '<option value="">Todos los símbolos</option>';
            
            // Mostrar sección de upload nuevamente
            uploadSection.style.display = 'block';
            
            // Mostrar estado inicial
            loadingElement.style.display = 'flex';
            loadingElement.innerHTML = `
                <div class="spinner"></div>
                <p>Esperando datos para análisis...</p>
            `;
            
            analyzeBtn.disabled = true;
            
            console.log('Análisis reiniciado');
            
            // Resetear gráficos
            destroyCharts();
            initializeCharts();
        }
    }
    
    // Función para resetear KPI a cero
    function resetKPI() {
        totalTradesElement.textContent = 0;
        totalFeesElement.textContent = '0.00';
        totalNetElement.textContent = '0.00';
        totalFundingElement.textContent = '0.00';
        totalLossesElement.textContent = '0.00';
        profitFactorElement.textContent = '0.00';
        avgWinLossElement.textContent = '0.00';
        winRateElement.textContent = '0%';
        winRateElement.className = 'kpi-value';
        winLossRatioElement.textContent = '0/0';
        totalNetElement.className = 'kpi-value';
        totalRealizedElement.innerHTML = `
            Bruto: <span class="fee-detail">0.00</span> - 
            Fee: <span class="fee-detail">0.00</span> - 
            Funding: <span class="fee-detail">0.00</span>
        `;
    }
    
    // Función para actualizar el filtro de símbolos
    function updateSymbolFilter() {
        symbolFilter.innerHTML = '<option value="">Todos los símbolos</option>';
        
        allSymbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = symbol;
            symbolFilter.appendChild(option);
        });
        
        // Añadir event listener para filtrar
        symbolFilter.addEventListener('change', function() {
            filterTradesBySymbol(this.value);
        });
    }
    
    // Función para filtrar trades por símbolo
    function filterTradesBySymbol(symbol) {
        if (!dataTable) return;
        
        if (symbol === '') {
            dataTable.column(1).search('').draw();
            // Actualizar KPI para TODOS los trades
            updateKPIFromTrades(trades);
            // Actualizar gráficos con datos completos
            updateCharts(trades);
        } else {
            dataTable.column(1).search(`^${symbol}$`, true, false).draw();
            // Filtrar los trades por símbolo
            const filteredTrades = trades.filter(trade => trade.symbol === symbol);
            // Actualizar KPI con trades filtrados
            updateKPIFromTrades(filteredTrades);
            // Actualizar gráficos con datos filtrados
            updateCharts(filteredTrades);
        }
    }
    
    // Función para actualizar KPI desde array de trades
    function updateKPIFromTrades(tradesArray) {
        if (!tradesArray || tradesArray.length === 0) {
            // Resetear KPI si no hay trades
            resetKPI();
            return;
        }
        
        let totalRealized = 0;
        let totalFees = 0;
        let totalNet = 0;
        let totalFunding = 0;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalWins = 0;
        let totalLosses = 0;
        
        // Calcular desde los trades directamente
        tradesArray.forEach(trade => {
            totalRealized += trade.realizedProfit;
            totalFees += trade.totalFee;
            totalNet += trade.netProfit;
            totalFunding += trade.fundingFee;
            
            if (trade.netProfit > 0) {
                winningTrades++;
                totalWins += trade.netProfit;
            } else if (trade.netProfit < 0) {
                losingTrades++;
                totalLosses += Math.abs(trade.netProfit);
            }
        });
        
        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
        const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0.00';
        const avgWinLoss = totalTrades > 0 ? (totalNet / totalTrades).toFixed(2) : 0;
        
        // Actualizar elementos de KPI
        totalTradesElement.textContent = totalTrades;
        totalFeesElement.textContent = totalFees.toFixed(2);
        totalNetElement.textContent = totalNet.toFixed(2);
        totalFundingElement.textContent = totalFunding.toFixed(2);
        totalLossesElement.textContent = totalLosses.toFixed(2);
        profitFactorElement.textContent = profitFactor;
        avgWinLossElement.textContent = avgWinLoss;
        
        // Win Rate con color dinámico
        winRateElement.textContent = `${winRate}%`;
        winRateElement.className = parseFloat(winRate) >= 50 ? 'kpi-value winrate-positive' : 'kpi-value winrate-negative';
        
        // Win/Loss Ratio
        winLossRatioElement.textContent = `${winningTrades}/${losingTrades}`;
        
        // Ganancia Neta con color dinámico
        totalNetElement.className = totalNet >= 0 ? 'kpi-value positive' : 'kpi-value negative';
        
        // Actualizar los detalles de Bruto, Fee y Funding
        const realizedProfit = totalRealized.toFixed(2);
        const fees = totalFees.toFixed(2);
        const funding = totalFunding.toFixed(2);
        
        // Determinar colores para los valores
        const realizedColor = totalRealized >= 0 ? 'fee-detail-positive' : 'fee-detail';
        const fundingColor = totalFunding >= 0 ? 'fee-detail-positive' : 'fee-detail';
        
        totalRealizedElement.innerHTML = `
            Bruto: <span class="${realizedColor}">${realizedProfit}</span> - 
            Fee: <span class="fee-detail">${fees}</span> - 
            Funding: <span class="${fundingColor}">${funding}</span>
        `;
    }
    
    // Función para parsear CSV correctamente (manejando comas dentro de valores)
    function parseCSV(text) {
        console.log('Parseando CSV...');
        
        // Eliminar BOM si está presente
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.substring(1);
        }
        
        const lines = text.split('\n');
        const result = [];
        
        if (lines.length === 0) return result;
        
        // Parsear la primera línea para obtener headers
        const headers = parseCSVLine(lines[0]);
        console.log('Headers:', headers);
        
        // Parsear las líneas de datos
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = parseCSVLine(line);
            
            if (values.length === 0) continue;
            
            const obj = {};
            for (let j = 0; j < headers.length && j < values.length; j++) {
                const header = headers[j];
                let value = values[j];
                
                // Limpiar comillas si las hay
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                
                // Convertir a número si es posible
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && value !== '' && !isNaN(value)) {
                    obj[header] = numValue;
                } else {
                    obj[header] = value;
                }
            }
            
            result.push(obj);
        }
        
        console.log(`Parseados ${result.length} registros`);
        return result;
    }
    
    // Función para parsear una línea CSV (maneja comas dentro de campos)
    function parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // Agregar el último valor
        values.push(currentValue);
        
        return values.map(v => v.trim());
    }
    
    // Función para parsear fecha
    function parseDate(dateString) {
        if (!dateString || dateString === '' || dateString === 'undefined' || dateString === 'null') {
            return new Date(0);
        }
        
        // La fecha ya viene en formato "2025-12-17 10:52:06", solo necesitamos crear el objeto Date
        try {
            // Separar fecha y hora
            const [datePart, timePart] = dateString.split(' ');
            
            if (!datePart || !timePart) {
                console.warn(`Formato de fecha incorrecto: ${dateString}`);
                return new Date(0);
            }
            
            // Separar componentes de fecha
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours, minutes, seconds] = timePart.split(':').map(Number);
            
            // Crear fecha (meses son 0-indexados en JavaScript)
            const date = new Date(year, month - 1, day, hours, minutes, seconds);
            
            if (isNaN(date.getTime())) {
                console.warn(`Fecha inválida: ${dateString}`);
                return new Date(0);
            }
            
            return date;
        } catch (error) {
            console.warn(`Error parseando fecha ${dateString}:`, error);
            return new Date(0);
        }
    }
    
    // Función para parsear respuesta JSON de Google Sheets API
    function parseSheetJSON(json) {
        if (!json.values || json.values.length === 0) {
            return [];
        }
        
        // Si los datos están en una sola columna (formato CSV), reconstruir el texto CSV
        const csvText = json.values.map(row => row.join(',')).join('\n');
        
        // Usar la función parseCSV existente
        return parseCSV(csvText);
    }
    
    // Función para cargar datos desde Google Sheets
    async function loadDataFromSheets() {
        const urls = [sheet1Url, sheet2Url, sheet3Url];
        const statuses = [csv1Status, csv2Status, csv3Status];
        const sheetNames = ['Hoja 1', 'Hoja 2', 'Hoja 3'];

        try {
            const responses = await Promise.all(urls.map(url => fetch(url)));
            const jsons = await Promise.all(responses.map(res => res.json()));

            for (let i = 0; i < jsons.length; i++) {
                console.log(`Cargando ${sheetNames[i]}`);
                const parsedData = parseSheetJSON(jsons[i]);
                
                if (i === 0) {
                    csv1Data = parsedData;
                    console.log('Hoja 1 cargada:', csv1Data?.length || 0, 'registros');
                } else if (i === 1) {
                    csv2Data = parsedData;
                    console.log('Hoja 2 cargada:', csv2Data?.length || 0, 'registros');
                } else if (i === 2) {
                    csv3Data = parsedData;
                    console.log('Hoja 3 cargada:', csv3Data?.length || 0, 'registros');
                }
                
                statuses[i].textContent = 'Cargado ✓';
                statuses[i].classList.add('loaded');
            }
            
            checkAnalyzeButton();
            
            // Si los datos requeridos están cargados, iniciar análisis automáticamente
            if (csv2Data && csv3Data) {
                analyzeBtn.textContent = 'Analizando automáticamente...';
                analyzeBtn.disabled = true;
                setTimeout(() => {
                    analyzeTrades();
                }, 500); // Pequeño delay para asegurar que la UI esté lista
            }
            
        } catch (error) {
            console.error('Error cargando datos desde Google Sheets:', error);
            for (let status of statuses) {
                status.textContent = 'Error';
                status.classList.remove('loaded');
            }
            alert('Error al cargar datos desde Google Sheets. Verifica la API key y que las hojas existan.');
        }
    }
    
    // Función para manejar la carga de archivos
    function handleFileUpload(fileInput, statusElement) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    console.log(`Cargando ${file.name}`);
                    
                    // Parsear el CSV
                    const parsedData = parseCSV(content);
                    
                    // Determinar qué variable asignar según el input
                    if (fileInput.id === 'csv1') {
                        csv1Data = parsedData;
                        console.log('CSV1 cargado:', csv1Data?.length || 0, 'registros');
                    } else if (fileInput.id === 'csv2') {
                        csv2Data = parsedData;
                        console.log('CSV2 cargado:', csv2Data?.length || 0, 'registros');
                        
                        // Verificar las primeras filas para debug
                        if (csv2Data && csv2Data.length > 0) {
                            console.log('Primeras 3 filas de CSV2:');
                            for (let i = 0; i < Math.min(3, csv2Data.length); i++) {
                                const row = csv2Data[i];
                                console.log(`  ${i+1}:`, row);
                            }
                        }
                    } else if (fileInput.id === 'csv3') {
                        csv3Data = parsedData;
                        console.log('CSV3 cargado:', csv3Data?.length || 0, 'registros');
                    }
                    
                    // Actualizar estado
                    statusElement.textContent = 'Cargado ✓';
                    statusElement.classList.add('loaded');
                    
                    // Verificar si podemos habilitar el botón de análisis
                    checkAnalyzeButton();
                    
                } catch (error) {
                    console.error('Error al parsear el archivo:', error);
                    alert(`Error al cargar ${file.name}. Verifica que sea un CSV válido.`);
                    statusElement.textContent = 'Error';
                    statusElement.classList.remove('loaded');
                }
            };
            
            reader.onerror = function() {
                console.error('Error al leer el archivo');
                alert(`Error al leer ${file.name}.`);
                statusElement.textContent = 'Error';
                statusElement.classList.remove('loaded');
            };
            
            reader.readAsText(file);
        });
    }
    
    // Función para verificar si podemos habilitar el botón de análisis
    function checkAnalyzeButton() {
        if (csv2Data && csv3Data) {
            analyzeBtn.disabled = false;
        } else {
            analyzeBtn.disabled = true;
        }
    }
    
    // Función para agrupar trades - VERSIÓN SIMPLIFICADA Y CORRECTA
    function groupTrades() {
        if (!csv2Data || csv2Data.length === 0) {
            console.error('CSV2 está vacío');
            return [];
        }
        
        console.log('Agrupando trades de forma simple...');
        
        const trades = [];
        
        // Separar por símbolo primero
        const dataBySymbol = {};
        
        for (const row of csv2Data) {
            const symbol = row.symbol || '';
            if (!symbol) continue;
            
            if (!dataBySymbol[symbol]) {
                dataBySymbol[symbol] = [];
            }
            
            dataBySymbol[symbol].push({
                time: row.time || '',
                side: row.side || '',
                fee: parseFloat(row.fee) || 0,
                realizedProfit: parseFloat(row['realised profit']) || 0,
                qty: parseFloat(row['deal qty']) || 0,
                price: parseFloat(row['average price']) || 0
            });
        }
        
        // Procesar cada símbolo por separado
        for (const symbol in dataBySymbol) {
            console.log(`\n=== Procesando ${symbol} ===`);
            
            // Ordenar por tiempo
            const symbolData = dataBySymbol[symbol].sort((a, b) => {
                return parseDate(a.time) - parseDate(b.time);
            });
            
            let openEntries = [];
            let closeEntries = [];
            let totalOpenQty = 0;
            let totalCloseQty = 0;
            
            // Procesar cada operación en orden
            for (let i = 0; i < symbolData.length; i++) {
                const row = symbolData[i];
                const side = row.side;
                
                console.log(`${i+1}. ${row.time} - ${side} - Qty: ${row.qty}`);
                
                if (side.includes('Open')) {
                    // Si tenemos cierres pendientes y encontramos nueva apertura, crear trade
                    if (closeEntries.length > 0 && totalCloseQty >= totalOpenQty) {
                        createTradeFromEntries();
                        openEntries = [];
                        closeEntries = [];
                        totalOpenQty = 0;
                        totalCloseQty = 0;
                    }
                    
                    // Agregar apertura
                    openEntries.push({
                        time: row.time,
                        fee: row.fee,
                        qty: row.qty,
                        price: row.price
                    });
                    totalOpenQty += row.qty;
                    
                } else if (side.includes('Close')) {
                    // Agregar cierre
                    closeEntries.push({
                        time: row.time,
                        fee: row.fee,
                        qty: row.qty,
                        price: row.price,
                        realizedProfit: row.realizedProfit
                    });
                    totalCloseQty += row.qty;
                    
                    // Si tenemos suficientes cierres para cubrir las aperturas, crear trade
                    if (totalCloseQty >= totalOpenQty && openEntries.length > 0) {
                        createTradeFromEntries();
                        openEntries = [];
                        closeEntries = [];
                        totalOpenQty = 0;
                        totalCloseQty = 0;
                    }
                }
            }
            
            // Crear trade con lo que quede
            function createTradeFromEntries() {
                if (openEntries.length === 0 || closeEntries.length === 0) return;
                
                const trade = {
                    symbol: symbol,
                    openTime: openEntries[0].time, // Primera apertura
                    closeTime: closeEntries[closeEntries.length - 1].time, // Último cierre
                    openEntries: [...openEntries],
                    closeEntries: [...closeEntries],
                    realizedProfit: closeEntries.reduce((sum, entry) => sum + entry.realizedProfit, 0),
                    totalFee: openEntries.reduce((sum, entry) => sum + entry.fee, 0) +
                             closeEntries.reduce((sum, entry) => sum + entry.fee, 0),
                    fundingFee: 0,
                    netProfit: 0
                };
                
                trades.push(trade);
                
                console.log(`  Trade creado: ${symbol}`);
                console.log(`    Aperturas: ${openEntries.length} (total: ${totalOpenQty})`);
                console.log(`    Cierres: ${closeEntries.length} (total: ${totalCloseQty})`);
                console.log(`    Profit: ${trade.realizedProfit.toFixed(4)}`);
                console.log(`    Fee: ${trade.totalFee.toFixed(4)}`);
            }
            
            // Procesar lo que quede al final
            if (openEntries.length > 0 && closeEntries.length > 0) {
                createTradeFromEntries();
            }
        }
        
        console.log(`\n=== TOTAL: ${trades.length} trades encontrados ===`);
        
        return trades;
    }
    
    // Función para calcular funding fees
    function calculateFundingFees(trades) {
        if (!csv3Data || csv3Data.length === 0 || !trades || trades.length === 0) {
            console.log('No hay datos para calcular funding fees');
            return trades;
        }
        
        console.log('Calculando funding fees...');
        
        // Filtrar funding fees del CSV3
        const fundingFees = [];
        for (const row of csv3Data) {
            const type = row.type || '';
            if (type.includes('Funding Fee')) {
                const time = row.time || '';
                const amount = parseFloat(row.amount) || 0;
                const symbol = row.symbol || '';
                
                fundingFees.push({
                    time: time,
                    parsedTime: parseDate(time),
                    amount: amount,
                    symbol: symbol
                });
            }
        }
        
        console.log(`Encontrados ${fundingFees.length} funding fees`);
        
        // Para cada trade, sumar funding fees en el rango
        for (const trade of trades) {
            let totalFunding = 0;
            const openTime = parseDate(trade.openTime);
            const closeTime = parseDate(trade.closeTime);
            
            console.log(`Calculando funding para ${trade.symbol}: ${trade.openTime} → ${trade.closeTime}`);
            
            for (const fee of fundingFees) {
                // Filtrar por símbolo si está especificado
                if (fee.symbol && fee.symbol !== trade.symbol) {
                    continue;
                }
                
                // Verificar si está en el rango del trade
                if (fee.parsedTime >= openTime && fee.parsedTime <= closeTime) {
                    totalFunding += fee.amount;
                    console.log(`  + ${fee.time}: ${fee.amount}`);
                }
            }
            
            trade.fundingFee = totalFunding;
            console.log(`  Total funding: ${totalFunding}`);
        }
        
        return trades;
    }
    
    // Función para calcular el net profit
    function calculateNetProfit(trades) {
        console.log('Calculando net profit...');
        
        return trades.map(trade => {
            // Si funding fee es negativo, ya representa un costo que se resta
            // Necesitamos convertirlo a positivo para la fórmula
            const fundingFeeForCalculation = trade.fundingFee < 0 ? Math.abs(trade.fundingFee) : trade.fundingFee;
            
            // Fórmula CORREGIDA: Net Profit = Realized Profit - Fee - |Funding Fee|
            trade.netProfit = trade.realizedProfit - trade.totalFee - fundingFeeForCalculation;
            
            // DEBUG
            console.log(`Trade ${trade.symbol}:`);
            console.log(`  Realized Profit: ${trade.realizedProfit}`);
            console.log(`  Total Fee: ${trade.totalFee}`);
            console.log(`  Funding Fee (original): ${trade.fundingFee}`);
            console.log(`  Funding Fee (para cálculo): ${fundingFeeForCalculation}`);
            console.log(`  Net Profit: ${trade.netProfit}`);
            console.log(`  Cálculo: ${trade.realizedProfit} - ${trade.totalFee} - ${fundingFeeForCalculation} = ${trade.netProfit}`);
            
            return trade;
        });
    }
    
    // Función para mostrar trades en la tabla
    function displayTrades(trades) {
        console.log('Mostrando trades en tabla...');
        
        // Limpiar tabla
        tradesBody.innerHTML = '';
        
        if (!trades || trades.length === 0) {
            tradesBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay trades para mostrar</td></tr>';
            tradesTable.style.display = 'table';
            return;
        }
        
        // Limpiar y actualizar símbolos
        allSymbols.clear();
        
        // Ordenar por fecha de cierre (más reciente primero)
        const sortedTrades = [...trades].sort((a, b) => {
            const dateA = parseDate(a.closeTime);
            const dateB = parseDate(b.closeTime);
            return dateB - dateA;
        });
        
        // Agregar cada trade a la tabla
        for (const trade of sortedTrades) {
            const row = document.createElement('tr');
            
            // Usar la fecha directamente (ya viene en formato correcto)
            const displayDate = trade.closeTime;
            
            // Determinar clases CSS
            const realizedClass = trade.realizedProfit >= 0 ? 'positive' : 'negative';
            const feeClass = 'negative';
            const fundingClass = trade.fundingFee < 0 ? 'negative' : 'positive';
            const netClass = trade.netProfit >= 0 ? 'positive' : 'negative';
            
            row.innerHTML = `
                <td>${displayDate}</td>
                <td>${trade.symbol}</td>
                <td class="${realizedClass}">${trade.realizedProfit.toFixed(4)}</td>
                <td class="${feeClass}">${trade.totalFee.toFixed(4)}</td>
                <td class="${fundingClass}">${trade.fundingFee.toFixed(4)}</td>
                <td class="${netClass}">${trade.netProfit.toFixed(4)}</td>
            `;
            
            tradesBody.appendChild(row);
            
            // Agregar símbolo a la lista
            allSymbols.add(trade.symbol);
        }
        
        // Mostrar tabla
        tradesTable.style.display = 'table';
        
        // Ocultar sección de upload después del análisis
        uploadSection.style.display = 'none';
        
        // Actualizar KPI con todos los trades
        updateKPIFromTrades(sortedTrades);
        
        // Actualizar filtro de símbolos
        updateSymbolFilter();
        
        // Inicializar DataTable
        if (dataTable) {
            dataTable.destroy();
        }
        
        dataTable = $(tradesTable).DataTable({
            pageLength: 25,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json'
            },
            order: [[0, 'desc']]
        });
        
        console.log('Tabla mostrada correctamente');
    }
    
    // Función principal de análisis
    function analyzeTrades() {
        console.clear();
        console.log('=== INICIANDO ANÁLISIS ===');
        
        // Mostrar estado de carga
        loadingElement.style.display = 'flex';
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <p>Analizando trades...</p>
        `;
        
        analyzeBtn.classList.add('loading');
        
        // Usar setTimeout para permitir que la UI se actualice
        setTimeout(() => {
            try {
                // Paso 1: Agrupar trades
                console.log('Paso 1: Agrupando trades...');
                trades = groupTrades();
                
                if (trades.length === 0) {
                    loadingElement.innerHTML = `
                        <div style="color: #f39c12; font-size: 3rem;">⚠️</div>
                        <p>No se encontraron trades completos.</p>
                    `;
                    analyzeBtn.classList.remove('loading');
                    return;
                }
                
                // Paso 2: Calcular funding fees
                console.log('Paso 2: Calculando funding fees...');
                trades = calculateFundingFees(trades);
                
                // Paso 3: Calcular net profit
                console.log('Paso 3: Calculando net profit...');
                trades = calculateNetProfit(trades);
                
                // Paso 4: Mostrar resultados
                console.log('Paso 4: Mostrando resultados...');
                displayTrades(trades);
                
                // Paso 5: Actualizar gráficos
                console.log('Paso 5: Actualizando gráficos...');
                updateCharts(trades);
                
                // Ocultar estado de carga
                loadingElement.style.display = 'none';
                
                console.log('=== ANÁLISIS COMPLETADO ===');
                
            } catch (error) {
                console.error('Error durante el análisis:', error);
                loadingElement.innerHTML = `
                    <div style="color: #e74c3c; font-size: 3rem;">⚠️</div>
                    <p>Error durante el análisis</p>
                    <p style="font-size: 0.9em;">${error.message}</p>
                `;
                analyzeBtn.classList.remove('loading');
            }
        }, 100);
    }
    
    // Cargar datos desde Google Sheets
    loadDataFromSheets();
    
    // Event listener para el botón de análisis
    analyzeBtn.addEventListener('click', analyzeTrades);
    
    // Inicializar estado de carga
    loadingElement.style.display = 'flex';
});
