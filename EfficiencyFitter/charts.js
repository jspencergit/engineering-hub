/* charts.js */

/* Global array to store chart instances for clearing */
let charts = [];

/* Creates a new Chart.js plot for the fitted curve */
function createFittedChart(points, splineData, xScaleType = 'linear') {
    // Create a new canvas for the chart
    const canvas = document.createElement('canvas');
    document.getElementById('fitted-plots').appendChild(canvas);

    // Prepare datasets: fitted curve and user points
    const datasets = [
        {
            label: 'Efficiency Curve',
            data: splineData.map(d => ({ x: d.x, y: d.y })),
            borderColor: '#1a73e8',
            fill: false,
            pointRadius: 0,
            tension: 0.4 // Smooth curve
        },
        {
            label: 'User Points',
            data: points.map(p => ({ x: p.current, y: p.efficiency })),
            pointRadius: 5,
            pointStyle: 'circle',
            borderColor: 'green',
            showLine: false
        }
    ];

    // Create the chart with Chart.js
    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: splineData.map(d => d.x),
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: xScaleType, // 'linear' or 'logarithmic'
                    title: { display: true, text: 'Current (mA)' },
                    ticks: { callback: value => value.toFixed(1) },
                    min: Math.min(...points.map(p => p.current)),
                    max: Math.max(...points.map(p => p.current))
                },
                y: {
                    title: { display: true, text: 'Efficiency (%)' },
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                tooltip: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: context => `Current: ${context.parsed.x.toFixed(1)} mA, Efficiency: ${context.parsed.y.toFixed(1)}%`
                    }
                }
            }
        }
    });

    // Store the chart instance
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
function drawCurveOnCanvas(splineData, canvas, scaleX, scaleY) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Draw the curve using the scaled pixel coordinates
    splineData.forEach((point, index) => {
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
    if (canvas) canvas.remove();
}