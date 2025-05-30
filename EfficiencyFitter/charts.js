/* charts.js */

/* Global array to store chart instances for clearing */
let charts = [];

/* Creates a new Chart.js plot for the fitted curves */
function createFittedChart(series, fittedSeries, xScaleType = 'logarithmic', scaling) {
    if ([scaling.xMin, scaling.xMax, scaling.yMin, scaling.yMax].some(val => !isFinite(val) || isNaN(val))) {
        alert('Invalid axis ranges. Please ensure all axis values are valid numbers.');
        return null;
    }

    const chartContainer = document.createElement('div');
    chartContainer.style.position = 'relative'; // For positioning the coords div
    const canvas = document.createElement('canvas');

    // Set the chart dimensions to match the image canvas display dimensions
    const imageCanvas = document.getElementById('image-canvas');
    const imageCanvasWidth = parseFloat(document.getElementById('image-canvas-width').value) || 450;
    const imageCanvasHeight = imageCanvas.getBoundingClientRect().height || 300; // Fallback to 300px if not available
    canvas.style.width = `${imageCanvasWidth}px`;
    canvas.style.height = `${imageCanvasHeight}px`;
    canvas.style.maxWidth = '100%';

    // Create a div to display coordinates in the lower left
    const coordsDiv = document.createElement('div');
    coordsDiv.className = 'chart-coords';
    coordsDiv.textContent = 'Series: --, Current: --, Efficiency: --';
    chartContainer.appendChild(canvas);
    chartContainer.appendChild(coordsDiv);
    document.getElementById('fitted-plots').appendChild(chartContainer);

    // Define colors for series
    const SERIES_COLORS = ['#1a73e8', '#ff0000', '#00ff00', '#800080', '#ffa500']; // Blue, Red, Green, Purple, Orange

    // Create datasets for each series (only fitted curves)
    const datasets = [];
    fittedSeries.forEach((fitted, index) => {
        const validSplineData = fitted.splineData.filter(d => isFinite(d.x) && isFinite(d.y) && !isNaN(d.x) && !isNaN(d.y));
        const color = SERIES_COLORS[index % SERIES_COLORS.length];

        // Fitted curve dataset
        datasets.push({
            label: `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''} Efficiency`,
            data: validSplineData.map(d => ({ x: d.x, y: d.y })),
            borderColor: color,
            fill: false,
            pointRadius: 0,
            tension: 0.4,
            borderDash: fitted.isCalculated ? [5, 5] : [] // Dashed line for calculated series
        });
    });

    // Snap point dataset (for mouse interaction)
    datasets.push({
        label: 'Snap Point',
        data: [],
        pointRadius: 3,
        pointStyle: 'circle',
        borderColor: 'black',
        backgroundColor: 'black',
        borderWidth: 1,
        showLine: false
    });

    // Generate power-of-ten ticks for logarithmic scale
    const generatePowerOfTenTicks = (min, max) => {
        const ticks = [];
        const startPower = Math.floor(Math.log10(min));
        const endPower = Math.ceil(Math.log10(max));
        for (let power = startPower; power <= endPower; power++) {
            const value = Math.pow(10, power);
            if (value >= min && value <= max) {
                ticks.push(value);
            }
        }
        return ticks;
    };

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: fittedSeries[0]?.splineData.map(d => d.x) || [],
            datasets: datasets
        },
        options: {
            layout: {
                padding: {
                    bottom: 30 // Add padding to create space below the X-axis for the coords div
                }
            },
            scales: {
                x: {
                    type: xScaleType,
                    title: { display: true, text: 'Current' },
                    ticks: {
                        source: 'auto',
                        callback: function(value) {
                            if (xScaleType === 'logarithmic') {
                                // For log scale, only show ticks at powers of ten
                                const powerOfTenTicks = generatePowerOfTenTicks(scaling.xMin, scaling.xMax);
                                if (!powerOfTenTicks.includes(value)) return null; // Skip non-power-of-ten ticks
                                if (value < 1) {
                                    const microAmps = value * 1000;
                                    return `${microAmps.toFixed(0)} µA`;
                                }
                                return `${value.toFixed(0)} mA`;
                            }
                            // For linear scale, use existing formatting
                            return `${value.toFixed(1)} mA`;
                        }
                    },
                    grid: {
                        display: true,
                        drawTicks: true,
                        tickLength: 8,
                        color: function(context) {
                            if (xScaleType === 'logarithmic') {
                                // Only draw grid lines at power-of-ten ticks
                                const powerOfTenTicks = generatePowerOfTenTicks(scaling.xMin, scaling.xMax);
                                return powerOfTenTicks.includes(context.tick.value) ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0)';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        }
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
                    enabled: false // Disable tooltips since we're using a custom coords div
                }
            }
        }
    });

    // Add mousemove event to snap a dot to the nearest point and display coordinates
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        // Find the nearest point across all fitted series, using pixel distance
        let nearestPoint = null;
        let nearestSeriesIndex = 0;
        let nearestSeriesLabel = '';
        let minDistance = Infinity;

        fittedSeries.forEach((fitted, index) => {
            fitted.splineData.forEach(point => {
                // Convert the curve point to pixel coordinates
                const pixelX = xScale.getPixelForValue(point.x);
                const pixelY = yScale.getPixelForValue(point.y);

                // Calculate Euclidean distance in pixel space
                const distance = Math.sqrt(
                    Math.pow(pixelX - mouseX, 2) + 
                    Math.pow(pixelY - mouseY, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = point;
                    nearestSeriesIndex = index;
                    nearestSeriesLabel = `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''}`;
                }
            });
        });

        // Update snap point dataset
        chart.data.datasets[datasets.length - 1].data = nearestPoint ? [{ x: nearestPoint.x, y: nearestPoint.y }] : [];
        chart.data.datasets[datasets.length - 1].borderColor = SERIES_COLORS[nearestSeriesIndex % SERIES_COLORS.length];
        chart.data.datasets[datasets.length - 1].backgroundColor = SERIES_COLORS[nearestSeriesIndex % SERIES_COLORS.length];

        // Format coordinates and update coordsDiv
        let currentText;
        if (nearestPoint.x < 1) {
            const microAmps = nearestPoint.x * 1000;
            currentText = `${microAmps.toFixed(0)} µA`;
        } else {
            currentText = `${nearestPoint.x.toFixed(1)} mA`;
        }
        const efficiencyText = `${nearestPoint.y.toFixed(1)}%`;
        coordsDiv.textContent = `Series: ${nearestSeriesLabel}, Current: ${currentText}, Efficiency: ${efficiencyText}`;

        chart.update('none');
    });

    canvas.addEventListener('mouseleave', () => {
        chart.data.datasets[datasets.length - 1].data = [];
        chart.update('none');
        coordsDiv.textContent = 'Series: --, Current: --, Efficiency: --';
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

/* Clears all charts and resets the fitted-plots section */
function clearLatestChart() {
    // Destroy all chart instances
    charts.forEach(chart => chart.destroy());
    // Clear the charts array
    charts = [];
    // Reset the fitted-plots div by removing all children
    const fittedPlots = document.getElementById('fitted-plots');
    fittedPlots.innerHTML = '';
}