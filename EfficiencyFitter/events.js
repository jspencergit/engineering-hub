/* events.js */

/* Global variables for canvas, context, image, points, and scaling */
let canvas = document.getElementById('image-canvas');
let ctx = canvas.getContext('2d');
let image = null;
let points = [];
let scaling = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let pixelScale = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 };
let isScaling = false;
let scalingStep = 0; // 0: X-axis calibration, 1: Y-axis min, 2: Y-axis max
let lastMousePos = null;
let calibrationPoints = { min: null, max: null }; // Y-axis calibration points
let xCalibrationPoints = []; // X-axis calibration points (pixelX, current)
let xScaleType = 'linear'; // Default to linear
let xCalibrationFit = { a: 1, b: 0 }; // Linear fit: current = a * pixelX + b

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
function mapPixelToValueY(pixelY, pixelMin, pixelMax, valueMin, valueMax) {
    return valueMin + (pixelY - pixelMin) * (valueMax - valueMin) / (pixelMax - pixelMin);
}

/* Helper function to map real values to pixel coordinates (Y-axis, linear) */
function mapValueToPixelY(value, valueMin, valueMax, pixelMin, pixelMax) {
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
    xCalibrationFit.a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    xCalibrationFit.b = (sumY - xCalibrationFit.a * sumX) / n;

    // Set pixel min/max for mapping
    pixelScale.xMin = xValues[0];
    pixelScale.xMax = xValues[n - 1];
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
        xCalibrationFit = { a: 1, b: 0 }; // Reset fit
        document.getElementById('cursor-coords').textContent = 'Align cursor with a known X-axis value and click';
    };
    image.src = URL.createObjectURL(file);
}

/* Draws the image, points, cursors, and fitted curve on the canvas */
function redrawCanvas() {
    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (image) ctx.drawImage(image, 0, 0);

    // Draw X-axis calibration points (blue)
    xCalibrationPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.pixelX, point.pixelY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00f'; // Blue for X-axis calibration points
        ctx.fill();
    });

    // Draw Y-axis calibration points (min and max)
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

    // Draw crosshairs during Y-axis calibration or dot placement
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

    if (isScaling) {
        if (scalingStep === 0) {
            // During X-axis calibration, show pixel position
            document.getElementById('cursor-coords').textContent = `Pixel X: ${x.toFixed(0)}`;
        } else if (scalingStep === 1) {
            // During Y-axis min calibration
            document.getElementById('cursor-coords').textContent = `Set Y-axis min (${scaling.yMin}%)`;
        } else if (scalingStep === 2) {
            // During Y-axis max calibration
            document.getElementById('cursor-coords').textContent = `Set Y-axis max (${scaling.yMax}%)`;
        }
    } else {
        // During dot placement, show current and efficiency
        const current = mapPixelToValueX(x);
        const efficiency = mapPixelToValueY(y, pixelScale.yMax, pixelScale.yMin, scaling.yMin, scaling.yMax);
        document.getElementById('cursor-coords').textContent = `Current: ${current.toFixed(1)} mA, Efficiency: ${efficiency.toFixed(1)}%`;
    }

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
        document.getElementById('cursor-coords').textContent = `Align cursor with another X-axis value or click "Apply Calibration"`;
    } else if (scalingStep === 1) {
        // Set Y-axis min point (yMin)
        pixelScale.yMax = y; // Y-axis inverted (yMin at bottom)
        calibrationPoints.min = { x, y };
        scalingStep = 2;
        document.getElementById('cursor-coords').textContent = `Set Y-axis max (${scaling.yMax}%)`;
    } else if (scalingStep === 2) {
        // Set Y-axis max point (yMax)
        pixelScale.yMin = y; // Y-axis inverted (yMax at top)
        calibrationPoints.max = { x, y };
        isScaling = false;
        document.getElementById('cursor-coords').textContent = 'Current: -- mA, Efficiency: -- %';
        lastMousePos = null;
    }

    redrawCanvas();
}

/* Finishes X-axis calibration and proceeds to Y-axis calibration */
function applyCalibration() {
    if (scalingStep !== 0) return; // Only apply during X-axis calibration
    if (xCalibrationPoints.length < 2) {
        alert('Please place at least two X-axis calibration points.');
        return;
    }

    // Fit the X-axis calibration points
    fitXCalibrationPoints();

    // Proceed to Y-axis calibration
    scalingStep = 1;
    document.getElementById('cursor-coords').textContent = `Set Y-axis min (${scaling.yMin}%)`;
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
    const efficiency = mapPixelToValueY(y, pixelScale.yMax, pixelScale.yMin, scaling.yMin, scaling.yMax);

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
    xCalibrationFit = { a: 1, b: 0 }; // Reset fit
    calibrationPoints = { min: null, max: null }; // Clear Y-axis calibration points
    document.getElementById('cursor-coords').textContent = 'Align cursor with a known X-axis value and click';
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
    const scaleX = value => mapValueToPixelX(value);
    const scaleY = value => mapValueToPixelY(value, scaling.yMin, scaling.yMax, pixelScale.yMax, pixelScale.yMin);
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
    xCalibrationPoints = [];
    xCalibrationFit = { a: 1, b: 0 };
    calibrationPoints = { min: null, max: null };
    document.getElementById('image-upload').value = '';
    document.getElementById('x-min-input').value = '0';
    document.getElementById('x-max-input').value = '1000';
    document.getElementById('y-min-input').value = '0';
    document.getElementById('y-max-input').value = '100';
    document.getElementById('x-scale-type').value = 'linear';
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
document.getElementById('apply-calibration-btn').addEventListener('click', applyCalibration);
document.getElementById('fit-curve-btn').addEventListener('click', handleFitCurve);
document.getElementById('undo-dot-btn').addEventListener('click', undoLastDot);
document.getElementById('redo-calibration-btn').addEventListener('click', redoCalibration);
document.getElementById('reset-btn').addEventListener('click', resetTool);
document.getElementById('linear-scale-btn').addEventListener('click', () => updateChartScale('linear'));
document.getElementById('log-scale-btn').addEventListener('click', () => updateChartScale('logarithmic'));
document.getElementById('clear-plot-btn').addEventListener('click', clearLatestChart);