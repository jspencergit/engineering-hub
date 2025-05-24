/* events.js */

/* Global variables for canvas, context, image, points, and scaling */
let canvas = document.getElementById('image-canvas');
let ctx = canvas.getContext('2d');
let zoomCanvas = document.getElementById('zoom-canvas');
let zoomCtx = zoomCanvas.getContext('2d');
let stageIndicator = document.getElementById('stage-indicator');
let image = null;
let points = [];
let scaling = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let pixelScale = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let isScaling = false;
let scalingStep = 0; // 0: X-axis calibration, 1: Y-axis calibration
let lastMousePos = null;
let xCalibrationPoints = []; // X-axis calibration points (pixelX, current)
let yCalibrationPoints = []; // Y-axis calibration points (pixelY, efficiency)
let xScaleType = 'linear'; // Default to linear
let xCalibrationFit = { a: 1, b: 0 }; // Linear fit: current = a * pixelX + b
let yCalibrationFit = { a: 1, b: 0 }; // Linear fit: efficiency = a * pixelY + b

/* Zoom settings */
const ZOOM_FACTOR = 3; // 3x zoom
const ZOOM_REGION = 50; // 50x50 pixel region to zoom
const ZOOM_SIZE = 200; // Size of zoom canvas (width/height)

/* Dot settings */
const CALIBRATION_DOT_RADIUS = 1.25; // Reduced to 1/4 of original 5
const CURVE_DOT_RADIUS = 1.25; // Reduced to 1/4 of original 5

/* Helper function to map pixel coordinates to real values (X-axis) */
function mapPixelToValueX(pixelX) {
    if (xScaleType === 'linear') {
        // Linear mapping: current = a * pixelX + b
        return xCalibrationFit.a * pixelX + xCalibrationFit.b;
    } else {
        // Logarithmic mapping: log(current) = a * pixelX + b, current = 10^logCurrent
        const logCurrent = xCalibrationFit.a * pixelX + xCalibrationFit.b;
        return Math.pow(10, logCurrent);
    }
}

/* Helper function to map real values to pixel coordinates (X-axis) */
function mapValueToPixelX(value) {
    if (xScaleType === 'linear') {
        // Linear mapping: pixelX = (current - b) / a
        return (value - xCalibrationFit.b) / xCalibrationFit.a;
    } else {
        // Logarithmic mapping: pixelX = (log(current) - b) / a
        const logValue = Math.log10(value);
        return (logValue - xCalibrationFit.b) / xCalibrationFit.a;
    }
}

/* Helper function to map pixel coordinates to real values (Y-axis, linear) */
function mapPixelToValueY(pixelY) {
    // Linear mapping: efficiency = a * pixelY + b
    const efficiency = yCalibrationFit.a * pixelY + yCalibrationFit.b;
    return isNaN(efficiency) ? 0 : efficiency; // Return 0 if NaN to avoid display issues
}

/* Helper function to map real values to pixel coordinates (Y-axis, linear) */
function mapValueToPixelY(value) {
    // Linear mapping: pixelY = (efficiency - b) / a
    const pixelY = (value - yCalibrationFit.b) / yCalibrationFit.a;
    return isNaN(pixelY) ? 0 : pixelY; // Return 0 if NaN to avoid issues
}

/* Helper function to get canvas coordinates from mouse event */
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // Adjust for CSS scaling
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    return { x, y };
}

/* Fits X-axis calibration points using least squares regression */
function fitXCalibrationPoints() {
    const n = xCalibrationPoints.length;
    if (n < 2) return; // Need at least 2 points

    // Sort points by pixelX to ensure monotonicity
    xCalibrationPoints.sort((a, b) => a.pixelX - b.pixelX);

    // Prepare data for fitting
    const xValues = xCalibrationPoints.map(p => p.pixelX);
    const yValues = xScaleType === 'linear' 
        ? xCalibrationPoints.map(p => p.current)
        : xCalibrationPoints.map(p => Math.log10(p.current));

    // Least squares regression: y = a * x + b
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumXX += xValues[i] * xValues[i];
    }

    // Compute coefficients a and b
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) {
        alert('Please place X-axis calibration points at different positions for accurate fitting.');
        xCalibrationFit = { a: 1, b: 0 }; // Revert to safe default
        return;
    }
    xCalibrationFit.a = (n * sumXY - sumX * sumY) / denominator;
    xCalibrationFit.b = (sumY - xCalibrationFit.a * sumX) / n;

    // Set pixel min/max for mapping
    pixelScale.xMin = xValues[0];
    pixelScale.xMax = xValues[n - 1];
}

/* Fits Y-axis calibration points using least squares regression */
function fitYCalibrationPoints() {
    const n = yCalibrationPoints.length;
    if (n < 2) return; // Need at least 2 points

    // Sort points by pixelY to ensure monotonicity (inverted Y-axis)
    yCalibrationPoints.sort((a, b) => a.pixelY - b.pixelY);

    // Prepare data for fitting
    const xValues = yCalibrationPoints.map(p => p.pixelY);
    const yValues = yCalibrationPoints.map(p => p.efficiency);

    // Least squares regression: efficiency = a * pixelY + b
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumXX += xValues[i] * xValues[i];
    }

    // Compute coefficients a and b
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) {
        alert('Please place Y-axis calibration points at different positions for accurate fitting.');
        yCalibrationFit = { a: 1, b: 0 }; // Revert to safe default
        return;
    }
    yCalibrationFit.a = (n * sumXY - sumX * sumY) / denominator;
    yCalibrationFit.b = (sumY - yCalibrationFit.a * sumX) / n;

    // Set pixel min/max for mapping based on user-entered range
    pixelScale.yMax = mapValueToPixelY(scaling.yMin); // Inverted Y-axis: min efficiency at bottom
    pixelScale.yMin = mapValueToPixelY(scaling.yMax); // Max efficiency at top
}

/* Draws the zoomed-in view on the zoom canvas */
function drawZoomView(mouseX, mouseY) {
    // Clear the zoom canvas
    zoomCtx.clearRect(0, 0, ZOOM_SIZE, ZOOM_SIZE);

    // Calculate the region to zoom (50x50 pixels around mouse)
    const halfRegion = ZOOM_REGION / 2;
    let srcX = mouseX - halfRegion;
    let srcY = mouseY - halfRegion;

    // Clamp the source region to the main canvas boundaries
    srcX = Math.max(0, Math.min(srcX, canvas.width - ZOOM_REGION));
    srcY = Math.max(0, Math.min(srcY, canvas.height - ZOOM_REGION));

    // Draw the zoomed-in region
    zoomCtx.drawImage(
        canvas,
        srcX, srcY, ZOOM_REGION, ZOOM_REGION, // Source region
        0, 0, ZOOM_SIZE, ZOOM_SIZE // Destination (zoomed)
    );

    // Draw a crosshair based on the current stage
    zoomCtx.strokeStyle = '#ff0000'; // Red crosshair
    zoomCtx.lineWidth = 1;
    if (isScaling && scalingStep === 0) {
        // X-axis calibration: vertical line only
        zoomCtx.beginPath();
        zoomCtx.moveTo(ZOOM_SIZE / 2, 0);
        zoomCtx.lineTo(ZOOM_SIZE / 2, ZOOM_SIZE);
        zoomCtx.stroke();
    } else if (isScaling && scalingStep === 1) {
        // Y-axis calibration: horizontal line only
        zoomCtx.beginPath();
        zoomCtx.moveTo(0, ZOOM_SIZE / 2);
        zoomCtx.lineTo(ZOOM_SIZE, ZOOM_SIZE / 2);
        zoomCtx.stroke();
    } else {
        // Dot placement: full crosshair
        zoomCtx.beginPath();
        zoomCtx.moveTo(ZOOM_SIZE / 2, 0);
        zoomCtx.lineTo(ZOOM_SIZE / 2, ZOOM_SIZE);
        zoomCtx.stroke();
        zoomCtx.beginPath();
        zoomCtx.moveTo(0, ZOOM_SIZE / 2);
        zoomCtx.lineTo(ZOOM_SIZE, ZOOM_SIZE / 2);
        zoomCtx.stroke();
    }
}

/* Positions the zoom canvas dynamically */
function positionZoomCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;

    // Position the zoom canvas above the main canvas
    const zoomCanvasHeight = ZOOM_SIZE;
    zoomCanvas.style.top = `${rect.top - zoomCanvasHeight - 10}px`; // 10px gap above canvas
    zoomCanvas.style.left = '50%';
    zoomCanvas.style.transform = 'translateX(-50%)';

    // Adjust position if mouse is too close to the top
    if (mouseY < zoomCanvasHeight + 20) {
        // Move to the right of the mouse
        const mouseX = event.clientX - rect.left;
        zoomCanvas.style.left = `${event.clientX + ZOOM_SIZE / 2 + 10}px`;
        zoomCanvas.style.transform = 'none';
    }
}

/* Updates the stage indicator based on the current stage */
function updateStageIndicator() {
    if (isScaling) {
        if (scalingStep === 0) {
            stageIndicator.textContent = 'Stage: Calibrating X-Axis';
            stageIndicator.className = 'x-axis';
            document.getElementById('apply-x-calibration-btn').style.display = 'block';
            document.getElementById('apply-y-calibration-btn').style.display = 'none';
        } else if (scalingStep === 1) {
            stageIndicator.textContent = 'Stage: Calibrating Y-Axis';
            stageIndicator.className = 'y-axis';
            document.getElementById('apply-x-calibration-btn').style.display = 'none';
            document.getElementById('apply-y-calibration-btn').style.display = 'block';
        }
    } else {
        stageIndicator.textContent = 'Stage: Placing Efficiency Curve Points';
        stageIndicator.className = 'dot-placement';
        document.getElementById('apply-x-calibration-btn').style.display = 'none';
        document.getElementById('apply-y-calibration-btn').style.display = 'none';
    }
}

/* Loads the uploaded image onto the canvas */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    image = new Image();
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        isScaling = true; // Start scaling process
        scalingStep = 0;
        xCalibrationPoints = []; // Clear X-axis calibration points
        yCalibrationPoints = []; // Clear Y-axis calibration points
        xCalibrationFit = { a: 1, b: 0 }; // Reset X-axis fit
        yCalibrationFit = { a: 1, b: 0 }; // Reset Y-axis fit
        document.getElementById('cursor-coords').textContent = 'Pixel X: --';
        updateStageIndicator();
    };
    image.src = URL.createObjectURL(file);
}

/* Draws the image, points, cursors, and fitted curve on the canvas */
function redrawCanvas() {
    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) ctx.drawImage(image, 0, 0);

    // Draw X-axis calibration points (hollow blue) with labels
    xCalibrationPoints.forEach(point => {
        // Draw the dot
        ctx.beginPath();
        ctx.arc(point.pixelX, point.pixelY, CALIBRATION_DOT_RADIUS, 0, 2 * Math.PI);
        ctx.strokeStyle = '#00f'; // Blue outline for X-axis calibration points
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the label (current value)
        ctx.font = '10px Arial';
        ctx.fillStyle = '#00f';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${point.current.toFixed(1)} mA`, point.pixelX + 10, point.pixelY);
    });

    // Draw Y-axis calibration points (hollow orange) with labels
    yCalibrationPoints.forEach(point => {
        // Draw the dot
        ctx.beginPath();
        ctx.arc(point.pixelX, point.pixelY, CALIBRATION_DOT_RADIUS, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff4500'; // Orange outline for Y-axis calibration points
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the label (efficiency value)
        ctx.font = '10px Arial';
        ctx.fillStyle = '#ff4500';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${point.efficiency.toFixed(1)}%`, point.pixelX + 10, point.pixelY);
    });

    // Draw user-placed points (solid green)
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.pixelX, point.pixelY, CURVE_DOT_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
    });

    // Draw vertical cursor during X-axis calibration
    if (lastMousePos && isScaling && scalingStep === 0) {
        const { x } = lastMousePos;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw horizontal cursor during Y-axis calibration
    if (lastMousePos && isScaling && scalingStep === 1) {
        const { y } = lastMousePos;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw crosshairs during dot placement
    if (lastMousePos && !isScaling) {
        const { x, y } = lastMousePos;
        // Draw X cursor (vertical line)
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Draw Y cursor (horizontal line)
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

/* Updates cursor coordinates based on mouse position */
function updateCursorCoords(event) {
    const { x, y } = getCanvasCoordinates(event);
    lastMousePos = { x, y };

    // Show the zoom canvas and draw the zoomed-in view
    zoomCanvas.style.display = 'block';
    positionZoomCanvas(event);
    drawZoomView(x, y);

    if (isScaling) {
        if (scalingStep === 0) {
            // During X-axis calibration, show pixel position
            document.getElementById('cursor-coords').textContent = `Pixel X: ${x.toFixed(0)}`;
        } else if (scalingStep === 1) {
            // During Y-axis calibration, show pixel position
            document.getElementById('cursor-coords').textContent = `Pixel Y: ${y.toFixed(0)}`;
        }
    } else {
        // During dot placement, show current and efficiency
        const current = mapPixelToValueX(x);
        const efficiency = mapPixelToValueY(y);
        document.getElementById('cursor-coords').textContent = `Current: ${current.toFixed(1)} mA, Efficiency: ${efficiency.toFixed(1)}%`;
    }

    updateStageIndicator();
    redrawCanvas();
}

/* Hides the zoom canvas when the mouse leaves the main canvas */
function hideZoomCanvas() {
    zoomCanvas.style.display = 'none';
    lastMousePos = null;
    redrawCanvas();
}

/* Handles scaling by setting X-axis and Y-axis points */
function handleScaling(event) {
    if (!isScaling) return;

    // Get user-entered axis ranges and scale type
    xScaleType = document.getElementById('x-scale-type').value;
    scaling.xMin = parseFloat(document.getElementById('x-min-input').value) || 0;
    scaling.xMax = parseFloat(document.getElementById('x-max-input').value) || 1000;
    scaling.yMin = parseFloat(document.getElementById('y-min-input').value) || 0;
    scaling.yMax = parseFloat(document.getElementById('y-max-input').value) || 100;

    // Validate ranges
    if (scaling.xMax <= scaling.xMin || scaling.yMax <= scaling.yMin) {
        alert('Max values must be greater than min values.');
        return;
    }
    if (xScaleType === 'logarithmic' && scaling.xMin <= 0) {
        alert('Min current must be greater than 0 for logarithmic scale.');
        return;
    }

    const { x, y } = getCanvasCoordinates(event);

    if (scalingStep === 0) {
        // X-axis calibration: Add calibration point
        const current = parseFloat(prompt('Enter current at this position (mA):', '10')) || 0;
        if (current < scaling.xMin || current > scaling.xMax) {
            alert(`Current must be within axis range (${scaling.xMin}–${scaling.xMax} mA).`);
            return;
        }
        if (xScaleType === 'logarithmic' && current <= 0) {
            alert('Current must be greater than 0 for logarithmic scale.');
            return;
        }
        xCalibrationPoints.push({ pixelX: x, pixelY: y, current });
        document.getElementById('cursor-coords').textContent = `Pixel X: ${x.toFixed(0)}`;
    } else if (scalingStep === 1) {
        // Y-axis calibration: Add calibration point
        const efficiency = parseFloat(prompt('Enter efficiency at this position (%):', '50')) || 0;
        if (efficiency < scaling.yMin || efficiency > scaling.yMax) {
            alert(`Efficiency must be within axis range (${scaling.yMin}–${scaling.yMax}%).`);
            return;
        }
        yCalibrationPoints.push({ pixelX: x, pixelY: y, efficiency });
        document.getElementById('cursor-coords').textContent = `Pixel Y: ${y.toFixed(0)}`;
    }

    redrawCanvas();
}

/* Finishes X-axis calibration and proceeds to Y-axis calibration */
function applyXCalibration() {
    if (scalingStep !== 0) return; // Only apply during X-axis calibration
    if (xCalibrationPoints.length < 2) {
        alert('Please place at least two X-axis calibration points.');
        return;
    }

    // Fit the X-axis calibration points
    fitXCalibrationPoints();

    // Proceed to Y-axis calibration
    scalingStep = 1;
    document.getElementById('cursor-coords').textContent = 'Pixel Y: --';
    updateStageIndicator();
    redrawCanvas();
}

/* Finishes Y-axis calibration and proceeds to dot placement */
function applyYCalibration() {
    if (scalingStep !== 1) return; // Only apply during Y-axis calibration
    if (yCalibrationPoints.length < 2) {
        alert('Please place at least two Y-axis calibration points.');
        return;
    }

    // Fit the Y-axis calibration points
    fitYCalibrationPoints();

    // Proceed to dot placement
    isScaling = false;
    document.getElementById('cursor-coords').textContent = 'Current: -- mA, Efficiency: -- %';
    lastMousePos = null;
    updateStageIndicator();
    redrawCanvas();
}

/* Handles canvas click for scaling or dot placement */
function handleCanvasClick(event) {
    if (isScaling) {
        handleScaling(event);
        return;
    }

    const { x, y } = getCanvasCoordinates(event);

    // Calculate real values for the dot
    const current = mapPixelToValueX(x);
    const efficiency = mapPixelToValueY(y);

    // Validate inputs against axis ranges
    if (current < scaling.xMin || current > scaling.xMax || 
        efficiency < scaling.yMin || efficiency > scaling.yMax) {
        alert(`Clicked point is outside axis ranges (Current: ${scaling.xMin}–${scaling.xMax} mA, Efficiency: ${scaling.yMin}–${scaling.yMax}%).`);
        return;
    }

    // Add the point directly
    points.push({ current, efficiency, pixelX: x, pixelY: y });

    // Check for sparse regions in log space (for logarithmic X-axis)
    if (xScaleType === 'logarithmic') {
        points.sort((a, b) => a.current - b.current);
        for (let i = 0; i < points.length - 1; i++) {
            const logDiff = Math.log10(points[i + 1].current) - Math.log10(points[i].current);
            if (logDiff > 0.5) { // Factor of 10^0.5 ≈ 3.16
                alert(`Consider adding more points between ${points[i].current.toFixed(1)} mA and ${points[i + 1].current.toFixed(1)} mA for better accuracy at low currents.`);
                break;
            }
        }
    }

    redrawCanvas();
}

/* Removes the last dot placed by the user */
function undoLastDot() {
    if (points.length === 0) return;
    points.pop();
    redrawCanvas();
}

/* Redoes the image calibration process */
function redoCalibration() {
    if (!image) return;
    isScaling = true;
    scalingStep = 0;
    points = []; // Clear existing points
    xCalibrationPoints = []; // Clear X-axis calibration points
    yCalibrationPoints = []; // Clear Y-axis calibration points
    xCalibrationFit = { a: 1, b: 0 }; // Reset X-axis fit
    yCalibrationFit = { a: 1, b: 0 }; // Reset Y-axis fit
    document.getElementById('cursor-coords').textContent = 'Pixel X: --';
    updateStageIndicator();
    redrawCanvas();
}

/* Fits the curve, updates the chart, and generates the table/CSV */
function handleFitCurve() {
    if (points.length < 2) {
        alert('Please place at least 2 points to fit a curve.');
        return;
    }

    // Get the user-specified number of points for CSV
    const csvPoints = parseInt(document.getElementById('csv-points-input').value) || 100;
    const numCsvPoints = Math.min(Math.max(csvPoints, 1), 1000); // Cap at 1000 points

    // Fit the curve for the displayed table and chart (100 points)
    const displayFit = fitCurve(points, scaling.xMax, 100);
    const { splineData, minCurrent, maxCurrent } = displayFit;

    // Draw the fitted curve on the canvas for verification
    const scaleX = value => mapValueToPixelX(value);
    const scaleY = value => mapValueToPixelY(value);
    drawCurveOnCanvas(splineData, canvas, scaleX, scaleY);

    // Create a new chart with user-entered axis ranges
    createFittedChart(points, splineData, 'linear', scaling);

    // Generate table data (100 points for display)
    const tableData = generateTableData(splineData, minCurrent, maxCurrent);
    const table = document.getElementById('data-table');
    table.innerHTML = '<tr><th>Current (mA)</th><th>Efficiency (%)</th></tr>';
    tableData.forEach(row => {
        table.innerHTML += `<tr><td>${row.current}</td><td>${row.efficiency}</td></tr>`;
    });

    // Fit the curve for CSV with user-specified number of points
    const csvFit = fitCurve(points, scaling.xMax, numCsvPoints);
    const csvTableData = generateTableData(csvFit.splineData, minCurrent, maxCurrent);
    const csv = generateCSV(csvTableData);
    const downloadBtn = document.getElementById('download-csv-btn');
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
        link.setAttribute('download', 'efficiency_data.csv');
        link.click();
    };
}

/* Resets the tool to its initial state */
function resetTool() {
    points = [];
    lastMousePos = null;
    isScaling = false;
    scalingStep = 0;
    xCalibrationPoints = [];
    yCalibrationPoints = [];
    xCalibrationFit = { a: 1, b: 0 };
    yCalibrationFit = { a: 1, b: 0 };
    document.getElementById('image-upload').value = '';
    document.getElementById('x-min-input').value = '0';
    document.getElementById('x-max-input').value = '1000';
    document.getElementById('y-min-input').value = '0';
    document.getElementById('y-max-input').value = '100';
    document.getElementById('x-scale-type').value = 'linear';
    document.getElementById('csv-points-input').value = '100';
    document.getElementById('cursor-coords').textContent = 'Pixel X: --';
    document.getElementById('data-table').innerHTML = '<tr><th>Current (mA)</th><th>Efficiency (%)</th></tr>';
    document.getElementById('fitted-plots').innerHTML = '';
    zoomCanvas.style.display = 'none';
    charts = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    image = null;
    updateStageIndicator();
}

/* Event listeners */
document.getElementById('image-upload').addEventListener('change', handleImageUpload);
canvas.addEventListener('mousemove', updateCursorCoords);
canvas.addEventListener('mouseleave', hideZoomCanvas);
canvas.addEventListener('click', handleCanvasClick);
document.getElementById('apply-x-calibration-btn').addEventListener('click', applyXCalibration);
document.getElementById('apply-y-calibration-btn').addEventListener('click', applyYCalibration);
document.getElementById('fit-curve-btn').addEventListener('click', handleFitCurve);
document.getElementById('undo-dot-btn').addEventListener('click', undoLastDot);
document.getElementById('redo-calibration-btn').addEventListener('click', redoCalibration);
document.getElementById('reset-btn').addEventListener('click', resetTool);
document.getElementById('linear-scale-btn').addEventListener('click', () => updateChartScale('linear'));
document.getElementById('log-scale-btn').addEventListener('click', () => updateChartScale('logarithmic'));
document.getElementById('clear-plot-btn').addEventListener('click', clearLatestChart);