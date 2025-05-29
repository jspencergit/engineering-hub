/* events.js */

/* Ensure DOM is loaded before accessing elements */
document.addEventListener('DOMContentLoaded', () => {
    /* Global variables for canvas, context, image, series, and scaling */
    let canvas = document.getElementById('image-canvas');
    let ctx = canvas.getContext('2d');
    let zoomCanvas = document.getElementById('zoom-canvas');
    let zoomCtx = zoomCanvas.getContext('2d');
    let stageIndicator = document.getElementById('stage-indicator');
    let image = null;
    let series = []; // Array of series: [{ name: "Vin = 12V", points: [{ current, efficiency, pixelX, pixelY }, ...], isCalculated: false }, ...]
    let activeSeries = null; // Currently selected series for placing points
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
    let canvasScaleFactor = 1; // To handle scaling between internal canvas size and displayed size

    /* Zoom settings */
    let ZOOM_FACTOR = 3; // 3x zoom
    let ZOOM_REGION = 50; // Default 50x50 pixel region to zoom
    const ZOOM_SIZE = 200; // Size of zoom canvas (width/height)
    const MAX_CANVAS_WIDTH = 1000; // Maximum internal canvas width for high-res images
    const MAX_DISPLAY_WIDTH = 450; // Matches CSS max-width for display

    /* Dot settings */
    const CALIBRATION_DOT_RADIUS = 1.25; // Reduced to 1/4 of original 5
    const CURVE_DOT_RADIUS = 2.5; // Doubled from 1.25 to 2.5 for user-placed points

    /* Colors for different series */
    const SERIES_COLORS = ['green', 'red', 'blue', 'purple', 'orange']; // Add more colors as needed

    /* Helper function to map pixel coordinates to real values (X-axis) */
    function mapPixelToValueX(pixelX) {
        if (xScaleType === 'linear') {
            // Linear mapping: current = a * pixelX + b
            return xCalibrationFit.a * pixelX + xCalibrationFit.b;
        } else {
            // Logarithmic mapping: log(current) = a * pixelX + b, current = 10^logCurrent
            const logCurrent = xCalibrationFit.a * pixelX + xCalibrationFit.b;
            // Clamp logCurrent to prevent underflow/overflow
            const minLogCurrent = Math.log10(Math.max(scaling.xMin, 1e-10)); // Avoid log(0)
            const maxLogCurrent = Math.log10(scaling.xMax);
            const clampedLogCurrent = Math.max(minLogCurrent, Math.min(maxLogCurrent, logCurrent));
            return Math.pow(10, clampedLogCurrent);
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
        // Adjust for CSS scaling (display size vs internal canvas size)
        const scaleX = canvas.width / rect.width;
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

        // Calculate the region to zoom (dynamic ZOOM_REGION pixels around mouse)
        const halfRegion = ZOOM_REGION / 2;
        let srcX = mouseX - halfRegion;
        let srcY = mouseY - halfRegion;

        // Clamp the source region to the main canvas boundaries
        srcX = Math.max(0, Math.min(srcX, canvas.width - ZOOM_REGION));
        srcY = Math.max(0, Math.min(srcY, canvas.height - ZOOM_REGION));

        // Draw the zoomed-in region (includes the cursor line from the main canvas)
        zoomCtx.drawImage(
            canvas,
            srcX, srcY, ZOOM_REGION, ZOOM_REGION, // Source: dynamic ZOOM_REGION pixel region
            0, 0, ZOOM_SIZE, ZOOM_SIZE // Destination: 200x200 pixel area (3x zoom)
        );
        // Red crosshair removed; the zoomed cursor line from the main canvas is sufficient
    }

    /* Positions the zoom canvas dynamically */
    function positionZoomCanvas(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseY = event.clientY - rect.top;

        // Position the zoom canvas to overlap the "Fitted Curves" section
        const zoomCanvasHeight = ZOOM_SIZE;
        const newTop = rect.top + (rect.height * 0.5); // 50% down the main canvas
        zoomCanvas.style.top = `${newTop}px`;
        zoomCanvas.style.left = '60%';
        zoomCanvas.style.transform = 'translateX(-50%)';

        // Adjust position if mouse is too close to the top (fallback to right side)
        if (mouseY < zoomCanvasHeight / 2) {
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

    /* Updates the series dropdown with available series */
    function updateSeriesDropdown() {
        const seriesSelect = document.getElementById('series-select');
        const interpSelect1 = document.getElementById('interp-series-1');
        const interpSelect2 = document.getElementById('interp-series-2');
        
        // Update main series selection dropdown
        seriesSelect.innerHTML = '';
        interpSelect1.innerHTML = '';
        interpSelect2.innerHTML = '';

        series.forEach((s, index) => {
            // Main series dropdown
            const option = document.createElement('option');
            option.value = index;
            option.textContent = s.name;
            seriesSelect.appendChild(option);

            // Interpolation series dropdowns (exclude calculated series)
            if (!s.isCalculated) {
                const option1 = document.createElement('option');
                option1.value = index;
                option1.textContent = s.name;
                interpSelect1.appendChild(option1);

                const option2 = document.createElement('option');
                option2.value = index;
                option2.textContent = s.name;
                interpSelect2.appendChild(option2);
            }
        });

        if (series.length > 0) {
            seriesSelect.value = series.indexOf(activeSeries);
        }
    }

    /* Loads the uploaded image onto the canvas */
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        image = new Image();
        image.onload = () => {
            // Determine canvas dimensions with a max display width of 450px
            let displayWidth = Math.min(image.width, MAX_DISPLAY_WIDTH);
            let displayHeight = image.height * (displayWidth / image.width);

            // Scale internal canvas dimensions to match display aspect ratio, but allow higher resolution up to MAX_CANVAS_WIDTH
            let internalWidth = image.width;
            let internalHeight = image.height;
            let wasScaled = false;

            if (image.width > MAX_CANVAS_WIDTH) {
                internalWidth = MAX_CANVAS_WIDTH;
                internalHeight = image.height * (MAX_CANVAS_WIDTH / image.width);
                wasScaled = true;
            }

            // Set canvas internal dimensions
            canvas.width = internalWidth;
            canvas.height = internalHeight;

            // Calculate the dimensions to draw the image while preserving aspect ratio
            let drawWidth = internalWidth;
            let drawHeight = internalHeight;
            let offsetX = 0;
            let offsetY = 0;

            // Draw the image centered on the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

            // Adjust zoom region for large images
            ZOOM_REGION = image.width > 1000 ? 100 : 50; // Increase zoom region for high-res images

            // Reset state
            isScaling = true;
            scalingStep = 0;
            xCalibrationPoints = [];
            yCalibrationPoints = [];
            xCalibrationFit = { a: 1, b: 0 };
            yCalibrationFit = { a: 1, b: 0 };
            series = [];
            activeSeries = null;
            updateSeriesDropdown();

            // Provide feedback if the image was scaled
            document.getElementById('cursor-coords').textContent = wasScaled 
                ? 'Pixel X: -- (Image scaled to fit canvas)' 
                : 'Pixel X: --';
            
            updateStageIndicator();
        };
        image.src = URL.createObjectURL(file);
    }

    /* Draws the image, points, cursors, and fitted curve on the canvas */
    function redrawCanvas() {
        // Clear canvas and redraw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (image) {
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;
            ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        }

        // Draw X-axis calibration points (hollow blue) with labels
        xCalibrationPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.pixelX, point.pixelY, CALIBRATION_DOT_RADIUS, 0, 2 * Math.PI);
            ctx.strokeStyle = '#00f'; // Blue outline for X-axis calibration points
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '10px Arial';
            ctx.fillStyle = '#00f';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            let labelText;
            if (point.current < 1) {
                const microAmps = point.current * 1000;
                labelText = `${microAmps.toFixed(0)} \u00B5A`;
            } else {
                labelText = `${point.current.toFixed(1)} mA`;
            }
            ctx.fillText(labelText, point.pixelX + 10, point.pixelY);
        });

        // Draw Y-axis calibration points (hollow orange) with labels
        yCalibrationPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.pixelX, point.pixelY, CALIBRATION_DOT_RADIUS, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ff4500'; // Orange outline for Y-axis calibration points
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '10px Arial';
            ctx.fillStyle = '#ff4500';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${point.efficiency.toFixed(1)}%`, point.pixelX + 10, point.pixelY);
        });

        // Draw user-placed points for all series
        series.forEach((s, index) => {
            const color = SERIES_COLORS[index % SERIES_COLORS.length];
            s.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.pixelX, point.pixelY, CURVE_DOT_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
            });
        });

        // Draw vertical cursor during X-axis calibration
        if (lastMousePos && isScaling && scalingStep === 0) {
            const { x } = lastMousePos;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.strokeStyle = '#00FFFF'; // Cyan cursor line
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw horizontal cursor during Y-axis calibration
        if (lastMousePos && isScaling && scalingStep === 1) {
            const { y } = lastMousePos;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.strokeStyle = '#00FFFF'; // Cyan cursor line
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw crosshairs during dot placement
        if (lastMousePos && !isScaling) {
            const { x, y } = lastMousePos;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.strokeStyle = '#00FFFF'; // Cyan cursor line
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.strokeStyle = '#00FFFF'; // Cyan cursor line
            ctx.lineWidth = 1;
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
                document.getElementById('cursor-coords').textContent = `Pixel X: ${x.toFixed(0)}`;
            } else if (scalingStep === 1) {
                document.getElementById('cursor-coords').textContent = `Pixel Y: ${y.toFixed(0)}`;
            }
        } else {
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

        xScaleType = document.getElementById('x-scale-type').value;
        scaling.xMin = parseFloat(document.getElementById('x-min-input').value) || 0;
        scaling.xMax = parseFloat(document.getElementById('x-max-input').value) || 1000;
        scaling.yMin = parseFloat(document.getElementById('y-min-input').value) || 0;
        scaling.yMax = parseFloat(document.getElementById('y-max-input').value) || 100;

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
        if (scalingStep !== 0) return;
        if (xCalibrationPoints.length < 2) {
            alert('Please place at least two X-axis calibration points.');
            return;
        }

        fitXCalibrationPoints();
        scalingStep = 1;
        document.getElementById('cursor-coords').textContent = 'Pixel Y: --';
        updateStageIndicator();
        redrawCanvas();
    }

    /* Finishes Y-axis calibration and proceeds to dot placement */
    function applyYCalibration() {
        if (scalingStep !== 1) return;
        if (yCalibrationPoints.length < 2) {
            alert('Please place at least two Y-axis calibration points.');
            return;
        }

        fitYCalibrationPoints();
        isScaling = false;
        document.getElementById('cursor-coords').textContent = 'Current: -- mA, Efficiency: -- %';
        lastMousePos = null;
        updateStageIndicator();
        redrawCanvas();
    }

    /* Adds a new series */
    function addSeries() {
        const seriesName = document.getElementById('series-name').value.trim();
        if (!seriesName) {
            alert('Please enter a name for the new series.');
            return;
        }
        if (series.some(s => s.name === seriesName)) {
            alert('A series with this name already exists. Please choose a different name.');
            return;
        }
        const newSeries = { name: seriesName, points: [], isCalculated: false };
        series.push(newSeries);
        activeSeries = newSeries;
        updateSeriesDropdown();
        document.getElementById('series-name').value = ''; // Clear the input
    }

    /* Clears the selected series */
    function clearSeries() {
        const seriesSelect = document.getElementById('series-select');
        const index = parseInt(seriesSelect.value);
        if (isNaN(index) || index < 0 || index >= series.length) {
            alert('Please select a series to clear.');
            return;
        }
        series[index].points = [];
        if (activeSeries === series[index]) {
            activeSeries = series.length > 0 ? series[0] : null;
        }
        updateSeriesDropdown();
        redrawCanvas();
    }

    /* Handles canvas click for scaling or dot placement */
    function handleCanvasClick(event) {
        if (isScaling) {
            handleScaling(event);
            return;
        }

        if (!activeSeries) {
            alert('Please select or add a series to place points.');
            return;
        }

        const { x, y } = getCanvasCoordinates(event);
        const current = mapPixelToValueX(x);
        const efficiency = mapPixelToValueY(y);

        if (current < scaling.xMin || current > scaling.xMax || 
            efficiency < scaling.yMin || efficiency > scaling.yMax) {
            alert(`Clicked point is outside axis ranges (Current: ${scaling.xMin}–${scaling.xMax} mA, Efficiency: ${scaling.yMin}–${scaling.yMax}%).`);
            return;
        }

        activeSeries.points.push({ current, efficiency, pixelX: x, pixelY: y });

        if (xScaleType === 'logarithmic') {
            activeSeries.points.sort((a, b) => a.current - b.current);
            for (let i = 0; i < activeSeries.points.length - 1; i++) {
                const logDiff = Math.log10(activeSeries.points[i + 1].current) - Math.log10(activeSeries.points[i].current);
                if (logDiff > 0.5) {
                    alert(`Consider adding more points between ${activeSeries.points[i].current.toFixed(1)} mA and ${activeSeries.points[i + 1].current.toFixed(1)} mA for better accuracy at low currents.`);
                    break;
                }
            }
        }

        redrawCanvas();
    }

    /* Generates an interpolated series based on two existing series and a ratio */
    function generateInterpolatedSeries() {
        const seriesName = document.getElementById('calc-series-name').value.trim();
        const series1Index = parseInt(document.getElementById('interp-series-1').value);
        const series2Index = parseInt(document.getElementById('interp-series-2').value);
        const ratio = parseFloat(document.getElementById('interp-ratio').value);

        // Validation
        if (!seriesName) {
            alert('Please enter a name for the calculated series.');
            return;
        }
        if (series.some(s => s.name === seriesName)) {
            alert('A series with this name already exists. Please choose a different name.');
            return;
        }
        if (isNaN(series1Index) || isNaN(series2Index) || series1Index < 0 || series2Index < 0 || series1Index >= series.length || series2Index >= series.length) {
            alert('Please select two series to interpolate between.');
            return;
        }
        if (series1Index === series2Index) {
            alert('Please select two different series to interpolate between.');
            return;
        }
        if (isNaN(ratio) || ratio < 0 || ratio > 1) {
            alert('Please enter a valid interpolation ratio between 0 and 1.');
            return;
        }
        if (series.filter(s => !s.isCalculated).length < 2) {
            alert('You need at least two non-calculated series to perform interpolation.');
            return;
        }

        const series1 = series[series1Index];
        const series2 = series[series2Index];

        // Fit both series to get spline data with the same X-axis points
        const numPoints = 100;
        const fit1 = fitCurve(series1.points, scaling.xMax, numPoints);
        const fit2 = fitCurve(series2.points, scaling.xMax, numPoints);

        // Interpolate between the two series
        const interpolatedPoints = [];
        for (let i = 0; i < numPoints; i++) {
            const current = fit1.splineData[i].x; // X-axis points are the same for both series
            const eff1 = fit1.splineData[i].y;
            const eff2 = fit2.splineData[i].y;
            // Linear interpolation: eff_new = eff1 + ratio * (eff2 - eff1)
            const interpolatedEff = eff1 + ratio * (eff2 - eff1);
            // Map back to pixel coordinates for canvas drawing
            const pixelX = mapValueToPixelX(current);
            const pixelY = mapValueToPixelY(interpolatedEff);
            interpolatedPoints.push({ current, efficiency: interpolatedEff, pixelX, pixelY });
        }

        // Add the new series
        const newSeries = { name: seriesName, points: interpolatedPoints, isCalculated: true };
        series.push(newSeries);
        updateSeriesDropdown();

        // Update chart and table if they exist
        if (document.getElementById('fitted-plots').innerHTML) {
            handleFitCurve();
        }
    }

    /* Saves the current configuration to a JSON file */
    function saveConfiguration() {
        // Create a temporary canvas to convert the image to Base64
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        let imageBase64 = null;
        if (image) {
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;
            tempCtx.drawImage(image, 0, 0);
            imageBase64 = tempCanvas.toDataURL('image/png');
        }

        // Collect all configuration data
        const config = {
            image: imageBase64,
            axisRanges: {
                xMin: scaling.xMin,
                xMax: scaling.xMax,
                yMin: scaling.yMin,
                yMax: scaling.yMax,
                xScaleType: xScaleType
            },
            calibrationPoints: {
                xCalibrationPoints: xCalibrationPoints,
                yCalibrationPoints: yCalibrationPoints
            },
            series: series,
            state: {
                isScaling: isScaling,
                scalingStep: scalingStep,
                lastMousePos: lastMousePos,
                xCalibrationFit: xCalibrationFit,
                yCalibrationFit: yCalibrationFit,
                ZOOM_REGION: ZOOM_REGION
            }
        };

        // Convert to JSON and create a downloadable file
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'efficiency_fitter_config.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    /* Loads a configuration from a JSON file */
    function loadConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);

                // Validate configuration
                if (!config || typeof config !== 'object') {
                    alert('Invalid configuration file.');
                    return;
                }

                // Load image
                if (config.image) {
                    image = new Image();
                    image.onload = () => {
                        // Set canvas dimensions based on the loaded image
                        let displayWidth = Math.min(image.width, MAX_DISPLAY_WIDTH);
                        let displayHeight = image.height * (displayWidth / image.width);
                        let internalWidth = image.width;
                        let internalHeight = image.height;
                        let wasScaled = false;

                        if (image.width > MAX_CANVAS_WIDTH) {
                            internalWidth = MAX_CANVAS_WIDTH;
                            internalHeight = image.height * (MAX_CANVAS_WIDTH / image.width);
                            wasScaled = true;
                        }

                        canvas.width = internalWidth;
                        canvas.height = internalHeight;
                        let drawWidth = internalWidth;
                        let drawHeight = internalHeight;
                        let offsetX = 0;
                        let offsetY = 0;

                        // Draw the image
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

                        // Provide feedback if the image was scaled
                        document.getElementById('cursor-coords').textContent = wasScaled 
                            ? 'Pixel X: -- (Image scaled to fit canvas)' 
                            : 'Pixel X: --';

                        // Continue loading other configuration data after image is loaded
                        loadConfigurationData(config);
                    };
                    image.src = config.image;
                } else {
                    image = null;
                    loadConfigurationData(config);
                }
            } catch (error) {
                alert('Error loading configuration: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    /* Helper function to load configuration data after image is loaded */
    function loadConfigurationData(config) {
        // Load axis ranges
        if (config.axisRanges) {
            scaling.xMin = config.axisRanges.xMin || 0;
            scaling.xMax = config.axisRanges.xMax || 1000;
            scaling.yMin = config.axisRanges.yMin || 0;
            scaling.yMax = config.axisRanges.yMax || 100;
            xScaleType = config.axisRanges.xScaleType || 'linear';

            document.getElementById('x-min-input').value = scaling.xMin;
            document.getElementById('x-max-input').value = scaling.xMax;
            document.getElementById('y-min-input').value = scaling.yMin;
            document.getElementById('y-max-input').value = scaling.yMax;
            document.getElementById('x-scale-type').value = xScaleType;
        }

        // Load calibration points
        if (config.calibrationPoints) {
            xCalibrationPoints = config.calibrationPoints.xCalibrationPoints || [];
            yCalibrationPoints = config.calibrationPoints.yCalibrationPoints || [];
        }

        // Load series
        if (config.series) {
            series = config.series.map(s => ({
                name: s.name,
                points: s.points.map(p => ({
                    current: p.current,
                    efficiency: p.efficiency,
                    pixelX: p.pixelX,
                    pixelY: p.pixelY
                })),
                isCalculated: s.isCalculated || false
            }));
            activeSeries = series.length > 0 ? series[0] : null;
            updateSeriesDropdown();
        }

        // Load other state
        if (config.state) {
            isScaling = config.state.isScaling || false;
            scalingStep = config.state.scalingStep || 0;
            lastMousePos = config.state.lastMousePos || null;
            xCalibrationFit = config.state.xCalibrationFit || { a: 1, b: 0 };
            yCalibrationFit = config.state.yCalibrationFit || { a: 1, b: 0 };
            ZOOM_REGION = config.state.ZOOM_REGION || 50;
        }

        // Fit calibration points if they exist
        if (xCalibrationPoints.length >= 2) fitXCalibrationPoints();
        if (yCalibrationPoints.length >= 2) fitYCalibrationPoints();

        // Update UI
        updateStageIndicator();
        redrawCanvas();

        // Clear the file input
        document.getElementById('load-config-input').value = '';
    }

    /* Removes the last dot placed by the user in the active series */
    function undoLastDot() {
        if (!activeSeries || activeSeries.points.length === 0) return;
        activeSeries.points.pop();
        redrawCanvas();
    }

    /* Redoes the image calibration process */
    function redoCalibration() {
        if (!image) return;
        isScaling = true;
        scalingStep = 0;
        series = [];
        activeSeries = null;
        xCalibrationPoints = [];
        yCalibrationPoints = [];
        xCalibrationFit = { a: 1, b: 0 };
        yCalibrationFit = { a: 1, b: 0 };
        updateSeriesDropdown();
        document.getElementById('cursor-coords').textContent = 'Pixel X: --';
        updateStageIndicator();
        redrawCanvas();
    }

    /* Fits the curve, updates the chart, and generates the table/CSV */
    function handleFitCurve() {
        if (series.length === 0 || series.every(s => s.points.length < 2)) {
            alert('Please place at least 2 points in at least one series to fit a curve.');
            return;
        }

        // Fit curves for all series
        const numPoints = 100; // Number of points for display
        const fittedSeries = series.map(s => {
            if (s.points.length < 2) return null;
            const fit = fitCurve(s.points, scaling.xMax, numPoints);
            return { name: s.name, splineData: fit.splineData, minCurrent: fit.minCurrent, maxCurrent: fit.maxCurrent, isCalculated: s.isCalculated };
        }).filter(s => s !== null);

        // Draw fitted curves on the canvas
        fittedSeries.forEach((fitted, index) => {
            const color = SERIES_COLORS[index % SERIES_COLORS.length];
            const splineData = fitted.splineData;
            const scaleX = value => mapValueToPixelX(value);
            const scaleY = value => mapValueToPixelY(value);
            drawCurveOnCanvas(splineData, canvas, scaleX, scaleY, color);
        });

        // Create a new chart with all series
        createFittedChart(series, fittedSeries, 'linear', scaling);

        // Generate table data for display, including all series
        if (fittedSeries.length > 0) {
            // Generate table data for each series
            const tableData = fittedSeries.map(series => ({
                name: series.name,
                data: generateTableData(series.splineData, series.minCurrent, series.maxCurrent),
                isCalculated: series.isCalculated
            }));

            const table = document.getElementById('data-table');
            // Create table header with series names
            let headerRow = '<tr><th>Current (mA)</th>';
            fittedSeries.forEach(series => {
                const suffix = series.isCalculated ? ' (Calculated)' : '';
                headerRow += `<th>${series.name}${suffix}<br>Efficiency (%)</th>`;
            });
            headerRow += '</tr>';
            table.innerHTML = headerRow;

            // Add data rows
            const numRows = tableData[0].data.length; // All series have the same number of points
            for (let i = 0; i < numRows; i++) {
                let row = `<tr><td>${tableData[0].data[i].current}</td>`; // Current from the first series
                tableData.forEach(series => {
                    row += `<td>${series.data[i].efficiency}</td>`;
                });
                row += '</tr>';
                table.innerHTML += row;
            }
        }

        // Set up the download button to generate CSV on click
        const downloadBtn = document.getElementById('download-csv-btn');
        downloadBtn.onclick = () => {
            const csvPoints = parseInt(document.getElementById('csv-points-input').value) || 100;
            const numCsvPoints = Math.min(Math.max(csvPoints, 1), 1000);

            // Fit all series with the same X-axis points
            const csvFittedSeries = series.map(s => {
                if (s.points.length < 2) return null;
                const fit = fitCurve(s.points, scaling.xMax, numCsvPoints);
                return { name: s.name + (s.isCalculated ? ' (Calculated)' : ''), splineData: fit.splineData, minCurrent: fit.minCurrent, maxCurrent: fit.maxCurrent };
            }).filter(s => s !== null);

            const csv = generateCSVForMultipleSeries(csvFittedSeries);
            const link = document.createElement('a');
            link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
            link.setAttribute('download', 'efficiency_data.csv');
            link.click();
        };
    }

    /* Resets the tool to its initial state */
    function resetTool() {
        series = [];
        activeSeries = null;
        lastMousePos = null;
        isScaling = false;
        scalingStep = 0;
        xCalibrationPoints = [];
        yCalibrationPoints = [];
        xCalibrationFit = { a: 1, b: 0 };
        yCalibrationFit = { a: 1, b: 0 };
        document.getElementById('image-upload').value = '';
        document.getElementById('load-config-input').value = ''; // Clear load config input
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
        ZOOM_REGION = 50;
        updateSeriesDropdown();
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
    document.getElementById('add-series-btn').addEventListener('click', addSeries);
    document.getElementById('clear-series-btn').addEventListener('click', clearSeries);
    document.getElementById('generate-interp-btn').addEventListener('click', generateInterpolatedSeries);
    document.getElementById('series-select').addEventListener('change', (event) => {
        const index = parseInt(event.target.value);
        activeSeries = series[index] || null;
    });
    document.getElementById('save-config-btn').addEventListener('click', saveConfiguration);
    document.getElementById('load-config-btn').addEventListener('click', () => {
        document.getElementById('load-config-input').click();
    });
    document.getElementById('load-config-input').addEventListener('change', loadConfiguration);
});