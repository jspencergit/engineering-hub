/* charts.js */

/* Global array to store chart instances for clearing */
let charts = [];

/* Creates a new Chart.js plot for the fitted curve */
function createFittedChart(points, splineData, xScaleType = 'linear', scaling) {
    // Validate scaling values to prevent chart initialization errors
    const { xMin, xMax, yMin, yMax } = scaling;
    if ([xMin, xMax, yMin, yMax].some(val => !isFinite(val) || isNaN(val))) {
        alert('Invalid axis ranges. Please ensure all axis values are valid numbers.');
        return null;
    }

    // Create a container for the chart and coordinates
    const chartContainer = document.createElement('div');
    const coordsDiv = document.createElement('div');
    coordsDiv.className = 'chart-coords';
    coordsDiv.textContent = 'Current: -- mA, Efficiency: -- %';
    chartContainer.appendChild(coordsDiv);

    // Create the canvas for the chart
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    document.getElementById('fitted-plots').appendChild(chartContainer);

    // Prepare datasets: fitted curve, user points, and red dot
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
        },
        {
            label: 'Snap Point',
            data: [], // Will be updated on mouse move
            pointRadius: 5,
            pointStyle: 'circle',
            borderColor: 'red',
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
                    min: scaling.xMin, // Use user-entered min
                    max: scaling.xMax  // Use user-entered max
                },
                y: {
                    title: { display: true, text: 'Efficiency (%)' },
                    min: scaling.yMin, // Use user-entered min
                    max: scaling.yMax  // Use user-entered max
                }
            },
            plugins: {
                tooltip: {
                    enabled: false // Disable default tooltip
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });

    // Add mouse move event to update the red dot and coordinates
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert mouse X to chart X value
        const chartArea = chart.chartArea;
        const xScale = chart.scales.x;
        const chartX = xScale.getValueForPixel(mouseX);

        // Find the nearest point on the curve
        let nearestPoint = splineData.reduce((prev, curr) => {
            return (Math.abs(curr.x - chartX) < Math.abs(prev.x - chartX)) ? curr : prev;
        }, splineData[0]);

        // Update the red dot dataset
        chart.data.datasets[2].data = [{ x: nearestPoint.x, y: nearestPoint.y }];
        chart.update('none'); // Update without animation for smoothness

        // Update coordinates div
        coordsDiv.textContent = `Current: ${nearestPoint.x.toFixed(1)} mA, Efficiency: ${nearestPoint.y.toFixed(1)}%`;
    });

    // Clear the red dot and coordinates when mouse leaves
    canvas.addEventListener('mouseleave', () => {
        chart.data.datasets[2].data = [];
        chart.update('none');
        coordsDiv.textContent = 'Current: -- mA, Efficiency: -- %';
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
    if (canvas) {
        const container = canvas.parentElement;
        container.remove();
    }
}