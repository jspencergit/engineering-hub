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
    if (!imageCanvas) {
        console.error('Image canvas element not found. Ensure DOM is fully loaded.');
        return null;
    }
    const imageCanvasWidth = parseFloat(document.getElementById('image-canvas-width')?.value) || 450;
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

    // Create datasets for each series (efficiency and power loss)
    const datasets = [];
    fittedSeries.forEach((fitted, index) => {
        const validSplineData = fitted.splineData.filter(d => isFinite(d.x) && isFinite(d.y) && !isNaN(d.x) && !isNaN(d.y));
        const color = SERIES_COLORS[index % SERIES_COLORS.length];

        // Efficiency dataset (left Y-axis)
        datasets.push({
            label: `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''} Efficiency`,
            data: validSplineData.map(d => ({ x: d.x, y: d.y })),
            borderColor: color,
            fill: false,
            pointRadius: 0,
            tension: 0.4,
            borderDash: fitted.isCalculated ? [5, 5] : [], // Dashed line for calculated series
            yAxisID: 'y-efficiency'
        });

        // Power loss dataset (right Y-axis)
        if (fitted.powerLossData) {
            const powerLossData = validSplineData.map((d, i) => ({
                x: d.x,
                y: fitted.powerLossData[i]
            }));
            datasets.push({
                label: `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''} Power Loss`,
                data: powerLossData,
                borderColor: color,
                fill: false,
                pointRadius: 0,
                tension: 0.4,
                borderDash: [5, 5], // Dashed line for power loss
                yAxisID: 'y-power-loss'
            });
        }
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
        showLine: false,
        yAxisID: 'y-efficiency' // Default to efficiency axis; will be updated dynamically
    });

    // Calculate min/max power loss for secondary Y-axis scaling
    let minPowerLoss = Infinity;
    let maxPowerLoss = -Infinity;
    fittedSeries.forEach(fitted => {
        if (fitted.powerLossData) {
            const seriesMin = Math.min(...fitted.powerLossData);
            const seriesMax = Math.max(...fitted.powerLossData);
            minPowerLoss = Math.min(minPowerLoss, seriesMin);
            maxPowerLoss = Math.max(maxPowerLoss, seriesMax);
        }
    });

    // Handle edge cases for power loss range
    if (!isFinite(minPowerLoss) || !isFinite(maxPowerLoss)) {
        minPowerLoss = 0;
        maxPowerLoss = 1;
    }
    if (minPowerLoss === maxPowerLoss) {
        minPowerLoss = maxPowerLoss - 1;
        if (minPowerLoss < 0) minPowerLoss = 0;
        maxPowerLoss += 1;
    }

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
                'y-efficiency': {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Efficiency (%)' },
                    min: scaling.yMin,
                    max: scaling.yMax
                },
                'y-power-loss': {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Power Loss (W)' },
                    min: minPowerLoss,
                    max: maxPowerLoss,
                    ticks: {
                        callback: function(value) {
                            return `${value.toFixed(2)} W`;
                        }
                    },
                    grid: {
                        display: false // Avoid overlapping grid lines with efficiency axis
                    }
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
        const yEfficiencyScale = chart.scales['y-efficiency'];
        const yPowerLossScale = chart.scales['y-power-loss'];

        // Find the nearest point across all fitted series, considering both efficiency and power loss curves
        let nearestPoint = null;
        let nearestSeriesIndex = 0;
        let nearestSeriesLabel = '';
        let nearestCurveType = ''; // 'efficiency' or 'powerLoss'
        let nearestYValue = 0;
        let minDistance = Infinity;

        // Skip if fittedSeries is empty or not populated
        if (!fittedSeries || fittedSeries.length === 0) {
            console.warn('fittedSeries is empty or not populated.');
            coordsDiv.textContent = 'Series: --, Current: --, Efficiency: --';
            chart.data.datasets[datasets.length - 1].data = [];
            chart.update('none');
            return;
        }

        fittedSeries.forEach((fitted, index) => {
            // Check efficiency curve
            fitted.splineData.forEach(point => {
                const pixelX = xScale.getPixelForValue(point.x);
                const pixelY = yEfficiencyScale.getPixelForValue(point.y);
                const distance = Math.sqrt(
                    Math.pow(pixelX - mouseX, 2) + 
                    Math.pow(pixelY - mouseY, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPoint = point;
                    nearestSeriesIndex = index;
                    nearestSeriesLabel = `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''}`;
                    nearestCurveType = 'efficiency';
                    nearestYValue = point.y;
                }
            });

            // Check power loss curve
            if (fitted.powerLossData) {
                fitted.splineData.forEach((point, i) => {
                    const pixelX = xScale.getPixelForValue(point.x);
                    const pixelY = yPowerLossScale.getPixelForValue(fitted.powerLossData[i]);
                    const distance = Math.sqrt(
                        Math.pow(pixelX - mouseX, 2) + 
                        Math.pow(pixelY - mouseY, 2)
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPoint = point;
                        nearestSeriesIndex = index;
                        nearestSeriesLabel = `${fitted.name}${fitted.isCalculated ? ' (Calculated)' : ''}`;
                        nearestCurveType = 'powerLoss';
                        nearestYValue = fitted.powerLossData[i];
                    }
                });
            }
        });

        // Update snap point dataset only if a nearest point is found
        if (nearestPoint) {
            chart.data.datasets[datasets.length - 1].data = [{ x: nearestPoint.x, y: nearestYValue }];
            chart.data.datasets[datasets.length - 1].borderColor = SERIES_COLORS[nearestSeriesIndex % SERIES_COLORS.length];
            chart.data.datasets[datasets.length - 1].backgroundColor = SERIES_COLORS[nearestSeriesIndex % SERIES_COLORS.length];
            chart.data.datasets[datasets.length - 1].yAxisID = nearestCurveType === 'efficiency' ? 'y-efficiency' : 'y-power-loss';

            // Format coordinates and update coordsDiv
            let currentText;
            if (nearestPoint.x < 1) {
                const microAmps = nearestPoint.x * 1000;
                currentText = `${microAmps.toFixed(0)} µA`;
            } else {
                currentText = `${nearestPoint.x.toFixed(1)} mA`;
            }

            const yText = nearestCurveType === 'efficiency' 
                ? `Efficiency: ${nearestYValue.toFixed(1)}%`
                : `Power Loss: ${nearestYValue.toFixed(2)} W`;

            coordsDiv.textContent = `Series: ${nearestSeriesLabel}, Current: ${currentText}, ${yText}`;
        } else {
            // If no nearest point is found, clear the snap point and reset coordinates
            coordsDiv.textContent = 'Series: --, Current: --, Efficiency: --';
            chart.data.datasets[datasets.length - 1].data = [];
        }

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