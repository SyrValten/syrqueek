// Variables para almacenar los gráficos
let cumulativeProfitChart = null;
let netProfitByDayChart = null;
let profitBySymbolChart = null;
let tradesDistributionChart = null;

// Función para inicializar los gráficos vacíos
function initializeCharts() {
    destroyCharts();
    
    // Gráfico 1: Ganancia Acumulada
    const cumulativeCtx = document.getElementById('cumulativeProfitChart').getContext('2d');
    cumulativeProfitChart = new Chart(cumulativeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ganancia Acumulada',
                data: [],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ganancia Acumulada',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Trade ${context[0].dataIndex + 1}`;
                        },
                        label: function(context) {
                            const tradeIndex = context.dataIndex;
                            const trades = cumulativeProfitChart.data.tradesData || [];
                            const trade = trades[tradeIndex];
                            
                            let label = [];
                            label.push(`Acumulado: ${context.parsed.y.toFixed(4)}`);
                            
                            if (trade) {
                                label.push(`Trade Neto: ${trade.netProfit.toFixed(4)}`);
                                label.push(`Símbolo: ${trade.symbol}`);
                            }
                            
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Trades'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Ganancia Acumulada'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico 2: Beneficio Neto por Día
    const netProfitByDayCtx = document.getElementById('netProfitByDayChart').getContext('2d');
    netProfitByDayChart = new Chart(netProfitByDayCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderColor: '#3498db',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Beneficio Neto por Día',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Beneficio Neto'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico 3: Beneficio por Símbolo
    const profitBySymbolCtx = document.getElementById('profitBySymbolChart').getContext('2d');
    profitBySymbolChart = new Chart(profitBySymbolCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderColor: '#9b59b6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Beneficio por Símbolo',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Símbolo'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Beneficio Neto'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico 4: Distribución de Operaciones
    const tradesDistributionCtx = document.getElementById('tradesDistributionChart').getContext('2d');
    tradesDistributionChart = new Chart(tradesDistributionCtx, {
        type: 'pie',
        data: {
            labels: ['Ganadoras', 'Perdedoras', 'Neutrales'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#27ae60', // Verde para ganadoras
                    '#e74c3c', // Rojo para perdedoras
                    '#95a5a6'  // Gris para neutrales
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Operaciones',
                    font: {
                        size: 14,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Función para destruir los gráficos existentes
function destroyCharts() {
    if (cumulativeProfitChart) {
        cumulativeProfitChart.destroy();
        cumulativeProfitChart = null;
    }
    if (netProfitByDayChart) {
        netProfitByDayChart.destroy();
        netProfitByDayChart = null;
    }
    if (profitBySymbolChart) {
        profitBySymbolChart.destroy();
        profitBySymbolChart = null;
    }
    if (tradesDistributionChart) {
        tradesDistributionChart.destroy();
        tradesDistributionChart = null;
    }
}

// Función para actualizar todos los gráficos con datos
function updateCharts(trades) {
    if (!trades || trades.length === 0) {
        // Mostrar gráficos vacíos si no hay datos
        initializeCharts();
        return;
    }
    
    // Ordenar trades por fecha de cierre
    const sortedTrades = [...trades].sort((a, b) => {
        return parseDate(a.closeTime) - parseDate(b.closeTime);
    });
    
    // Calcular datos para los gráficos
    const cumulativeData = calculateCumulativeProfit(sortedTrades);
    const netProfitByDayData = calculateNetProfitByDay(sortedTrades);
    const profitBySymbolData = calculateProfitBySymbol(sortedTrades);
    const tradesDistributionData = calculateTradesDistribution(sortedTrades);
    
    // Actualizar Gráfico 1: Ganancia Acumulada
    updateCumulativeProfitChart(cumulativeData, sortedTrades);
    
    // Actualizar Gráfico 2: Beneficio Neto por Día
    updateNetProfitByDayChart(netProfitByDayData);
    
    // Actualizar Gráfico 3: Beneficio por Símbolo
    updateProfitBySymbolChart(profitBySymbolData);
    
    // Actualizar Gráfico 4: Distribución de Operaciones
    updateTradesDistributionChart(tradesDistributionData);
}

// Función para calcular ganancia acumulada
function calculateCumulativeProfit(trades) {
    let cumulative = 0;
    const cumulativeData = [];
    const labels = [];
    
    trades.forEach((trade, index) => {
        cumulative += trade.netProfit;
        cumulativeData.push(cumulative);
        labels.push(`Trade ${index + 1}`);
    });
    
    return { labels, data: cumulativeData };
}

// Función para calcular beneficio neto por día
function calculateNetProfitByDay(trades) {
    const netProfitByDay = {};
    
    trades.forEach(trade => {
        const date = trade.closeTime.split(' ')[0]; // Obtener solo la fecha (YYYY-MM-DD)
        
        if (!netProfitByDay[date]) {
            netProfitByDay[date] = 0;
        }
        
        netProfitByDay[date] += trade.netProfit;
    });
    
    // Convertir a arrays para el gráfico
    const labels = Object.keys(netProfitByDay);
    const data = labels.map(date => netProfitByDay[date]);
    
    return { labels, data };
}

// Función para calcular beneficio por símbolo
function calculateProfitBySymbol(trades) {
    const profitBySymbol = {};
    
    trades.forEach(trade => {
        const symbol = trade.symbol;
        
        if (!profitBySymbol[symbol]) {
            profitBySymbol[symbol] = 0;
        }
        
        profitBySymbol[symbol] += trade.netProfit;
    });
    
    // Ordenar por beneficio (de mayor a menor)
    const sortedSymbols = Object.keys(profitBySymbol).sort((a, b) => {
        return profitBySymbol[b] - profitBySymbol[a];
    });
    
    const labels = sortedSymbols;
    const data = sortedSymbols.map(symbol => profitBySymbol[symbol]);
    
    return { labels, data };
}

// Función para calcular distribución de operaciones
function calculateTradesDistribution(trades) {
    let winning = 0;
    let losing = 0;
    let neutral = 0;
    
    trades.forEach(trade => {
        if (trade.netProfit > 0) {
            winning++;
        } else if (trade.netProfit < 0) {
            losing++;
        } else {
            neutral++;
        }
    });
    
    return { winning, losing, neutral };
}

// Función para actualizar el gráfico de ganancia acumulada
function updateCumulativeProfitChart(data, trades) {
    if (!cumulativeProfitChart) {
        const ctx = document.getElementById('cumulativeProfitChart').getContext('2d');
        cumulativeProfitChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Ganancia Acumulada',
                    data: data.data,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }],
                tradesData: trades // Almacenamos los trades para el tooltip
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Ganancia Acumulada',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return `Trade ${context[0].dataIndex + 1}`;
                            },
                            label: function(context) {
                                const tradeIndex = context.dataIndex;
                                const chart = context.chart;
                                const trades = chart.data.tradesData || [];
                                const trade = trades[tradeIndex];
                                
                                let label = [];
                                label.push(`Acumulado: ${context.parsed.y.toFixed(4)}`);
                                
                                if (trade) {
                                    label.push(`Trade Neto: ${trade.netProfit.toFixed(4)}`);
                                    label.push(`Símbolo: ${trade.symbol}`);
                                }
                                
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Trades'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Ganancia Acumulada'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } else {
        cumulativeProfitChart.data.labels = data.labels;
        cumulativeProfitChart.data.datasets[0].data = data.data;
        cumulativeProfitChart.data.tradesData = trades; // Actualizamos los trades
        cumulativeProfitChart.update();
    }
}

// Función para actualizar el gráfico de beneficio neto por día
function updateNetProfitByDayChart(data) {
    // Generar colores según el valor (verde para positivo, rojo para negativo)
    const backgroundColors = data.data.map(value => 
        value >= 0 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(231, 76, 60, 0.7)'
    );
    
    if (!netProfitByDayChart) {
        const ctx = document.getElementById('netProfitByDayChart').getContext('2d');
        netProfitByDayChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: '#3498db',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Beneficio Neto por Día',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Beneficio Neto'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } else {
        netProfitByDayChart.data.labels = data.labels;
        netProfitByDayChart.data.datasets[0].data = data.data;
        netProfitByDayChart.data.datasets[0].backgroundColor = backgroundColors;
        netProfitByDayChart.update();
    }
}

// Función para actualizar el gráfico de beneficio por símbolo
function updateProfitBySymbolChart(data) {
    // Generar colores según el valor (verde para positivo, rojo para negativo)
    const backgroundColors = data.data.map(value => 
        value >= 0 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(231, 76, 60, 0.7)'
    );
    
    if (!profitBySymbolChart) {
        const ctx = document.getElementById('profitBySymbolChart').getContext('2d');
        profitBySymbolChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: backgroundColors,
                    borderColor: '#9b59b6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Beneficio por Símbolo',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Símbolo'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Beneficio Neto'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } else {
        profitBySymbolChart.data.labels = data.labels;
        profitBySymbolChart.data.datasets[0].data = data.data;
        profitBySymbolChart.data.datasets[0].backgroundColor = backgroundColors;
        profitBySymbolChart.update();
    }
}

// Función para actualizar el gráfico de distribución de operaciones
function updateTradesDistributionChart(data) {
    if (!tradesDistributionChart) {
        const ctx = document.getElementById('tradesDistributionChart').getContext('2d');
        tradesDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Ganadoras', 'Perdedoras', 'Neutrales'],
                datasets: [{
                    data: [data.winning, data.losing, data.neutral],
                    backgroundColor: [
                        '#27ae60', // Verde para ganadoras
                        '#e74c3c', // Rojo para perdedoras
                        '#95a5a6'  // Gris para neutrales
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Operaciones',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } else {
        tradesDistributionChart.data.datasets[0].data = [data.winning, data.losing, data.neutral];
        tradesDistributionChart.update();
    }
}

// Función para parsear fecha (necesaria para charts.js)
function parseDate(dateString) {
    if (!dateString || dateString === '' || dateString === 'undefined' || dateString === 'null') {
        return new Date(0);
    }
    
    try {
        const [datePart, timePart] = dateString.split(' ');
        
        if (!datePart || !timePart) {
            return new Date(0);
        }
        
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);
        
        const date = new Date(year, month - 1, day, hours, minutes, seconds);
        
        if (isNaN(date.getTime())) {
            return new Date(0);
        }
        
        return date;
    } catch (error) {
        return new Date(0);
    }
}

// Inicializar gráficos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});