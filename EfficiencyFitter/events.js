/* events.js */

/* Global variables for canvas, context, image, points, and scaling */
let canvas = document.getElementById('image-canvas');
let ctx = canvas.getContext('2d');
let image = null;
let points = [];
let scaling = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let pixelScale = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let isScaling = false;
let scalingStep = 0;
let lastMousePos = null;
let calibrationPoints = { min: null, max: null }; // Store calibration points for display

/* Helper function to map pixel coordinates to real values */
function mapPixelToValue(pixel, pixelMin, pixelMax, valueMin, valueMax) {
    return valueMin + (pixel - pixelMin) * (valueMax - valueMin) / (pixelMax - pixelMin);
}

/* Helper function to map real values to pixel coordinates */
function mapValueToPixel(value, valueMin, valueMax, pixelMin, pixelMax) {
    return pixelMin + (value - valueMin) * (pixelMax - pixelMin) / (valueMax - valueMin);
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
        document.getElementById('cursor-coords').textContent = `Click to set min point (${scaling.xMin} mA, ${scaling.yMin}%)`;
    };
    image.src = URL.createObjectURL(file);
}

/* Draws the image, points, cursors, and fitted curve on the canvas */
function redrawCanvas() {
    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) ctx.drawImage(image, 0, 0);

    // Draw calibration points (min and max)
    if (calibrationPoints.min) {
        ctx.beginPath();
        ctx.arc(calibrationPoints.min.x, calibrationPoints.min.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffa07a'; // Light orange for min point
        ctx.fill();
    }
    if (calibrationPoints.max) {
        ctx.beginPath();
        ctx.arc(calibrationPoints.max.x, calibrationPoints.max.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff4500'; // Dark orange for max point
        ctx.fill();
    }

    // Draw user-placed points
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.pixelX, point.pixelY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'green';
        ctx.fill();
    });

    // Draw cursors if mouse is over canvas
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
    if (!image || isScaling) return;
    const { x, y } = getCanvasCoordinates(event);
    lastMousePos = { x, y };

    // Calculate real values from pixel coordinates
    const current = mapPixelToValue(x, pixelScale.xMin, pixelScale.xMax, scaling.xMin, scaling.xMax);
    const efficiency = mapPixelToValue(y, pixelScale.yMax, pixelScale.yMin, scaling.yMin, scaling.yMax); // Y-axis inverted
    document.getElementById('cursor-coords').textContent = `Current: ${current.toFixed(1)} mA, Efficiency: ${efficiency.toFixed(1)}%`;

    redrawCanvas();
}

/* Handles scaling by setting min and max points */
function handleScaling(event) {
    if (!isScaling) return;

    // Get user-entered axis ranges
    scaling.xMin = parseFloat(document.getElementById('x-min-input').value) || 0;
    scaling.xMax = parseFloat(document.getElementById('x-max-input').value) || 1000;
    scaling.yMin = parseFloat(document.getElementById('y-min-input').value) || 0;
    scaling.yMax = parseFloat(document.getElementById('y-max-input').value) || 100;

    // Validate ranges
    if (scaling.xMax <= scaling.xMin || scaling.yMax <= scaling.yMin) {
        alert('Max values must be greater than min values.');
        return;
    }

    const { x, y } = getCanvasCoordinates(event);

    if (scalingStep === 0) {
        // Set min point (xMin, yMin)
        pixelScale.xMin = x;
        pixelScale.yMax = y; // Y-axis inverted (yMin at bottom)
        calibrationPoints.min = { x, y }; // Store min point for display
        scalingStep = 1;
        document.getElementById('cursor-coords').textContent = `Click to set max point (${scaling.xMax} mA, ${scaling.yMax}%)`;
    } else if (scalingStep === 1) {
        // Set max point (xMax, yMax)
        pixelScale.xMax = x;
        pixelScale.yMin = y; // Y-axis inverted (yMax at top)
        calibrationPoints.max = { x, y }; // Store max point for display
        isScaling = false;
        document.getElementById('cursor-coords').textContent = 'Current: -- mA, Efficiency: -- %';
        lastMousePos = null;
    }

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
    const current = mapPixelToValue(x, pixelScale.xMin, pixelScale.xMax, scaling.xMin, scaling.xMax);
    const efficiency = mapPixelToValue(y, pixelScale.yMax, pixelScale.yMin, scaling.yMin, scaling.yMax);

    // Validate inputs against axis ranges
    if (current < scaling.xMin || current > scaling.xMax || 
        efficiency < scaling.yMin || efficiency > scaling.yMax) {
        alert(`Clicked point is outside axis ranges (Current: ${scaling.xMin}–${scaling.xMax} mA, Efficiency: ${scaling.yMin}–${scaling.yMax}%).`);
        return;
    }

    // Add the point directly
    points.push({ current, efficiency, pixelX: x, pixelY: y });
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
    calibrationPoints = { min: null, max: null }; // Clear calibration points
    document.getElementById('cursor-coords').textContent = `Click to set min point (${scaling.xMin} mA, ${scaling.yMin}%)`;
    redrawCanvas();
}

/* Fits the curve, updates the chart, and generates the table/CSV */
function handleFitCurve() {
    if (points.length < 2) {
        alert('Please place at least 2 points to fit a curve.');
        return;
    }

    // Fit the curve using cubic spline, extending to max current
    const { splineData, minCurrent, maxCurrent } = fitCurve(points, scaling.xMax);

    // Draw the fitted curve on the canvas for verification
    const scaleX = value => mapValueToPixel(value, scaling.xMin, scaling.xMax, pixelScale.xMin, pixelScale.xMax);
    const scaleY = value => mapValueToPixel(value, scaling.yMin, scaling.yMax, pixelScale.yMax, pixelScale.yMin);
    drawCurveOnCanvas(splineData, canvas, scaleX, scaleY);

    // Create a new chart with user-entered axis ranges
    createFittedChart(points, splineData, 'linear', scaling);

    // Generate table data and CSV
    const tableData = generateTableData(splineData, minCurrent, maxCurrent);
    const table = document.getElementById('data-table');
    table.innerHTML = '<tr><th>Current (mA)</th><th>Efficiency (%)</th></tr>';
    tableData.forEach(row => {
        table.innerHTML += `<tr><td>${row.current}</td><td>${row.efficiency}</td></tr>`;
    });

    // Prepare CSV for download
    const csv = generateCSV(tableData);
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
    calibrationPoints = { min: null, max: null }; // Clear calibration points
    document.getElementById('image-upload').value = '';
    document.getElementById('x-min-input').value = '0';
    document.getElementById('x-max-input').value = '1000';
    document.getElementById('y-min-input').value = '0';
    document.getElementById('y-max-input').value = '100';
    document.getElementById('cursor-coords').textContent = 'Current: -- mA, Efficiency: -- %';
    document.getElementById('data-table').innerHTML = '<tr><th>Current (mA)</th><th>Efficiency (%)</th></tr>';
    document.getElementById('fitted-plots').innerHTML = '';
    charts = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    image = null;
}

/* Event listeners */
document.getElementById('image-upload').addEventListener('change', handleImageUpload);
canvas.addEventListener('mousemove', updateCursorCoords);
canvas.addEventListener('click', handleCanvasClick);
document.getElementById('fit-curve-btn').addEventListener('click', handleFitCurve);
document.getElementById('undo-dot-btn').addEventListener('click', undoLastDot);
document.getElementById('redo-calibration-btn').addEventListener('click', redoCalibration);
document.getElementById('reset-btn').addEventListener('click', resetTool);
document.getElementById('linear-scale-btn').addEventListener('click', () => updateChartScale('linear'));
document.getElementById('log-scale-btn').addEventListener('click', () => updateChartScale('logarithmic'));
document.getElementById('clear-plot-btn').addEventListener('click', clearLatestChart);