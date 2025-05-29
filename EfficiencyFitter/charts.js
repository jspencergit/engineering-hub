/* charts.js */

/* Global array to store chart instances for clearing */
let charts = [];

/* Creates a new Chart.js plot for the fitted curves */
function createFittedChart(series, fittedSeries, xScaleType = 'linear', scaling) {
    if ([scaling.xMin, scaling.xMax, scaling.yMin, scaling.yMax].some(val => !isFinite(val) || isNaN(val))) {
        alert('Invalid axis ranges. Please ensure all axis values are valid numbers.');
        return null;
    }

    const chartContainer = document.createElement('div');
    const coordsDiv = document.createElement('div');
    coordsDiv.className = 'chart-coords';
    coordsDiv.textContent = 'Current: -- mA, Efficiency: -- %';
    chartContainer.appendChild(coordsDiv);

    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    document.getElementById('fitted-plots').appendChild(chartContainer);

    // Define colors for series
    const SERIES_COLORS = ['#1a73e8', '#ff0000', '#00ff00', '#800080', '#ffa500']; // Blue, Red, Green, Purple, Orange

    // Create datasets for each series
    const datasets = [];
    fittedSeries.forEach((fitted, index) => {
        const validSplineData = fitted.splineData.filter(d => isFinite(d.x) && isFinite(d.y) && !isNaN(d.x) && !isNaN(d.y));
        const color = SERIES_COLORS[index % SERIES_COLORS.length];

        // Fitted curve dataset
        datasets.push({
            label: `${fitted.name} Efficiency`,
            data: validSplineData.map(d => ({ x: d.x, y: d.y })),
            borderColor: color,
            fill: false,
            pointRadius: 0,
            tension: 0.4
        });

        // User points dataset
        const seriesPoints = series.find(s => s.name === fitted.name).points;
        datasets.push({
            label: `${fitted.name} Points`,
            data: seriesPoints.map(p => ({ x: p.current, y: p.efficiency })),
            pointRadius: 5,
            pointStyle: 'circle',
            borderColor: color,
            backgroundColor: 'grey', // Grey interior for points
            borderWidth: 2,
            showLine: false
        });
    });

    // Snap point dataset (for mouse interaction)
    datasets.push({
        label: 'Snap Point',
        data: [],
        pointRadius: 5,
        pointStyle: 'circle',
        borderColor: 'black',
        backgroundColor: 'grey', // Grey interior for snap points
        borderWidth: 2,
        showLine: false
    });

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: fittedSeries[0]?.splineData.map(d => d.x) || [],
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: xScaleType,
                    title: { display: true, text: 'Current (mA)' },
                    ticks: {
                        callback: value => `${value.toExponential(1)} mA`
                    },
                    min: scaling.xMin,
                    max: scaling.xMax
                },
                y: {
                    title: { display: true, text: 'Efficiency (%)' },
                    min: scaling.yMin,
                    max: scaling.yMax
                }
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    labels: {
                        generateLabels: function(chart) {
                            const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            labels.forEach((label, index) => {
                                const dataset = chart.data.datasets[index];
                                if (dataset.label.includes('Efficiency')) {
                                    // Efficiency curves: solid line
                                    label.pointStyle = 'line';
                                    label.lineWidth = 2;
                                    label.fillStyle = dataset.borderColor;
                                    label.strokeStyle = dataset.borderColor;
                                } else if (dataset.label.includes('Points') || dataset.label === 'Snap Point') {
                                    // Points and Snap Points: circle with grey interior
                                    label.pointStyle = 'circle';
                                    label.fillStyle = 'grey';
                                    label.strokeStyle = dataset.borderColor;
                                    label.borderWidth = 2;
                                }
                            });
                            return labels;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const chartArea = chart.chartArea;
        const xScale = chart.scales.x;
        const chartX = xScale.getValueForPixel(mouseX);

        // Find the nearest point across all fitted series
        let nearestPoint = null;
        let nearestSeriesIndex = 0;
        let minDistance = Infinity;
        fittedSeries.forEach((fitted, index) => {
            const point = fitted.splineData.reduce((prev, curr) => {
                return (Math.abs(curr.x - chartX) < Math.abs(prev.x - chartX)) ? curr : prev;
            }, fitted.splineData[0]);
            const distance = Math.abs(point.x - chartX);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
                nearestSeriesIndex = index;
            }
        });

        chart.data.datasets[datasets.length - 1].data = nearestPoint ? [{ x: nearestPoint.x, y: nearestPoint.y }] : [];

        const xAxisAreaHeight = chart.height - chart.chartArea.bottom;
        let coordsText;
        if (mouseY > chart.chartArea.bottom) {
            const tickValues = xScale.ticks.map(tick => tick.value);
            const nearestTickValue = tickValues.reduce((prev, curr) => {
                return (Math.abs(curr - chartX) < Math.abs(prev - chartX)) ? curr : prev;
            }, tickValues[0]);
            coordsText = `Current: ${nearestTickValue.toFixed(3)} mA (tick), Efficiency: -- %`;
        } else {
            coordsText = `Series: ${fittedSeries[nearestSeriesIndex].name}, Current: ${nearestPoint.x.toFixed(3)} mA, Efficiency: ${nearestPoint.y.toFixed(1)}%`;
        }

        chart.update('none');
        coordsDiv.textContent = coordsText;
    });

    canvas.addEventListener('mouseleave', () => {
        chart.data.datasets[datasets.length - 1].data = [];
        chart.update('none');
        coordsDiv.textContent = 'Current: -- mA, Efficiency: -- %';
    });

    charts.push(chart);
    return chart;
}

/* Updates the X-axis scale of the latest chart */
function updateChartScale(scaleType) {
    if (charts.length === 0) return;
    const latestChart = charts[charts.length - 1];
    latestChart.options.scales.x.type = scaleType;
    latestChart.update();
}

/* Draws the fitted curve on the canvas for user verification */
function drawCurveOnCanvas(splineData, canvas, scaleX, scaleY, color) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const validSplineData = splineData.filter(d => isFinite(d.x) && isFinite(d.y) && !isNaN(d.x) && !isNaN(d.y));

    validSplineData.forEach((point, index) => {
        const pixelX = scaleX(point.x);
        const pixelY = scaleY(point.y);
        if (index === 0) {
            ctx.moveTo(pixelX, pixelY);
        } else {
            ctx.lineTo(pixelX, pixelY);
        }
    });

    ctx.stroke();
}

/* Clears the latest chart */
function clearLatestChart() {
    if (charts.length === 0) return;
    const latestChart = charts.pop();
    latestChart.destroy();
    const canvas = document.querySelector('#fitted-plots canvas:last-child');
    if (canvas) {
        const container = canvas.parentElement;
        container.remove();
    }
}