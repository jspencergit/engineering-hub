// Nomograph setup
const canvas = document.getElementById('nomographCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 425;
const MARGIN = 75;

// Nomograph scales (calibrated to match AN-82F Figure 1)
const ENOB_MIN = 1, ENOB_MAX = 24; // bits
const SNR_MIN = 6, SNR_MAX = 147; // dB
const COUNTS_MIN = 2, COUNTS_MAX = Math.pow(2, 24); // counts
const PERCENT_MIN = 0.000001, PERCENT_MAX = 50; // percent
const POWERS_MIN = -6, POWERS_MAX = -1; // powers of 10
const PPM_MIN = 0.01, PPM_MAX = 500000; // ppm
const DVM_MIN = 1.5, DVM_MAX = 8; // DVM digits

// Logarithmic ranges for sliders
const ppmMinLog = Math.log10(PPM_MIN);
const ppmMaxLog = Math.log10(PPM_MAX);
const ppmLogRange = ppmMaxLog - ppmMinLog;

const percentMinLog = Math.log10(PERCENT_MIN);
const percentMaxLog = Math.log10(PERCENT_MAX);
const percentLogRange = percentMaxLog - percentMinLog;

const countsMinLog = Math.log2(COUNTS_MIN);
const countsMaxLog = Math.log2(COUNTS_MAX);
const countsLogRange = countsMaxLog - countsMinLog;

// Convert linear slider value (0 to 1) to logarithmic parameter value
function linearToLogValue(sliderValue, minLog, maxLog, logRange, base) {
    const logValue = minLog + sliderValue * logRange;
    return Math.pow(base, logValue);
}

// Convert logarithmic parameter value to linear slider value (0 to 1)
function logValueToLinear(value, minLog, maxLog, logRange, logFunc) {
    const logValue = logFunc(value);
    return (logValue - minLog) / logRange;
}

// Make logarithmic mapping functions and constants globally accessible
window.logarithmicMapping = {
    linearToLogValue,
    logValueToLinear,
    ppm: { minLog: ppmMinLog, maxLog: ppmMaxLog, logRange: ppmLogRange },
    percent: { minLog: percentMinLog, maxLog: percentMaxLog, logRange: percentLogRange },
    counts: { minLog: countsMinLog, maxLog: countsMaxLog, logRange: countsLogRange }
};

// Map x-coordinate to a normalized value (0 to 1) across the nomograph
function xToNormalized(x) {
    const nomographWidth = CANVAS_WIDTH - 2 * MARGIN;
    return Math.max(0, Math.min(1, (x - MARGIN) / nomographWidth));
}

// Map value to x-coordinate on the canvas (linear or logarithmic scale)
function valueToX(value, min, max, isLog = true, reverse = false) {
    const nomographWidth = CANVAS_WIDTH - 2 * MARGIN;
    let t;
    if (isLog) {
        const logMin = Math.log10(min);
        const logMax = Math.log10(max);
        const logValue = Math.log10(value);
        t = (logValue - logMin) / (logMax - logMin);
    } else {
        t = (value - min) / (max - min);
    }
    if (reverse) {
        t = 1 - t;
    }
    return MARGIN + t * nomographWidth;
}

// Map dB to x-coordinate on the canvas (linear scale)
function dbToX(db) {
    return valueToX(db, SNR_MIN, SNR_MAX, false, false);
}

// Convert various parameters to dB for consistent nomograph positioning
function countsToDb(counts) {
    const bits = Math.log2(counts);
    return 6.02 * bits + 1.76;
}

function bitsToDb(bits) {
    return 6.02 * bits + 1.76;
}

function percentToDb(percent) {
    const counts = 100 / percent;
    return countsToDb(counts);
}

function ppmToDb(ppm) {
    const percent = ppm / 10000;
    return percentToDb(percent);
}

function powersToDb(powers) {
    const percent = 100 * Math.pow(10, powers);
    return percentToDb(percent);
}

function dvmToDb(dvm) {
    const bits = dvm * 3.25; // Adjusted to align 6.5 DVM Digits with ~21 bits
    return bitsToDb(bits);
}

// Draw the nomograph with four horizontal axes
function drawNomograph() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw axes and labels
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.lineWidth = 1;

    // Calculate y-positions for each axis (4 axes)
    const axisSpacing = (CANVAS_HEIGHT - 2 * MARGIN) / 3;
    const yPositions = Array.from({ length: 4 }, (_, i) => MARGIN + i * axisSpacing);

    // Axis 1: DVM Digits (left, above)
    const dvmY = yPositions[0];
    ctx.beginPath();
    ctx.moveTo(MARGIN, dvmY);
    ctx.lineTo(CANVAS_WIDTH - MARGIN, dvmY);
    ctx.stroke();

    // DVM Digits markers (above the line, vertical text)
    const dvmMarkers = [3.5, 4.5, 5.5, 6.5];
    dvmMarkers.forEach(dvm => {
        const db = dvmToDb(dvm);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, dvmY - 5);
        ctx.lineTo(x, dvmY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, dvmY - 30);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(dvm.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('DVM Digits', MARGIN - 40, dvmY - 5);

    // Axis 2: PPM (left, above) and Powers of Ten (left, below)
    const ppmPowersY = yPositions[1];
    ctx.beginPath();
    ctx.moveTo(MARGIN, ppmPowersY);
    ctx.lineTo(CANVAS_WIDTH - MARGIN, ppmPowersY);
    ctx.stroke();

    // PPM markers (above the line, vertical text, 10,000 left, 0.1 right)
    const ppmMarkers = [10000, 1000, 500, 300, 200, 100, 50, 30, 20, 10, 5, 3, 2, 1, 0.5, 0.3, 0.2, 0.1];
    ppmMarkers.forEach(ppm => {
        const db = ppmToDb(ppm);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, ppmPowersY - 5);
        ctx.lineTo(x, ppmPowersY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, ppmPowersY - 10);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(ppm.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('PPM', MARGIN - 40, ppmPowersY - 5);

    // Powers of Ten markers (below the line, vertical text, -1 left, -6 right)
    const powersMarkers = [-1, -2, -3, -4, -5, -6, -7];
    powersMarkers.forEach(power => {
        const db = powersToDb(power);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, ppmPowersY - 5);
        ctx.lineTo(x, ppmPowersY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, ppmPowersY + 10);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(power.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('Powers of Ten', MARGIN - 40, ppmPowersY + 15);

    // Axis 3: Percent (left, above) and Bits (left, below)
    const percentBitsY = yPositions[2];
    ctx.beginPath();
    ctx.moveTo(MARGIN, percentBitsY);
    ctx.lineTo(CANVAS_WIDTH - MARGIN, percentBitsY);
    ctx.stroke();

    // Percent markers (above the line, vertical text)
    const percentMarkers = [50, 30, 20, 10, 5, 3, 2, 1, 0.5, 0.3, 0.2, 0.1, 0.05, 0.03, 0.02, 0.01, 0.001, 0.0001];
    percentMarkers.forEach(percent => {
        const db = percentToDb(percent);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, percentBitsY - 5);
        ctx.lineTo(x, percentBitsY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, percentBitsY - 10);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(percent.toString() + '%', 0, 0);
        ctx.restore();
    });
    ctx.fillText('Percent', MARGIN - 40, percentBitsY - 5);

    // Bits markers (below the line, vertical text)
    const bitsMarkers = Array.from({ length: 24 }, (_, i) => i + 1); // 1 to 24
    bitsMarkers.forEach(bits => {
        const db = bitsToDb(bits);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, percentBitsY - 5);
        ctx.lineTo(x, percentBitsY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, percentBitsY + 20);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillText(bits.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('Bits', MARGIN - 40, percentBitsY + 15);

    // Axis 4: dB (left, above) and Counts (left, below)
    const dbCountsY = yPositions[3];
    ctx.beginPath();
    ctx.moveTo(MARGIN, dbCountsY);
    ctx.lineTo(CANVAS_WIDTH - MARGIN, dbCountsY);
    ctx.stroke();

    // dB markers (above the line, vertical text)
    const dbMarkers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
    dbMarkers.forEach(db => {
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, dbCountsY - 5);
        ctx.lineTo(x, dbCountsY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, dbCountsY - 25);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(db.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('dB', MARGIN - 40, dbCountsY - 5);

    // Counts markers (below the line, vertical text)
    const countsMarkers = bitsMarkers.map(bits => Math.pow(2, bits)); // 2^1 to 2^24
    countsMarkers.forEach(counts => {
        const db = countsToDb(counts);
        const x = dbToX(db);
        ctx.beginPath();
        ctx.moveTo(x, dbCountsY - 5);
        ctx.lineTo(x, dbCountsY + 5);
        ctx.stroke();
        ctx.save();
        ctx.translate(x + 5, dbCountsY + 15);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'right';
        ctx.fillText(counts.toString(), 0, 0);
        ctx.restore();
    });
    ctx.fillText('Counts', MARGIN - 40, dbCountsY + 15);
}

// Draw the vertical line
let lineX = 600; // Default position (middle of canvas)
function drawLine(x) {
    lineX = Math.max(MARGIN, Math.min(CANVAS_WIDTH - MARGIN, x));
    drawNomograph(); // Redraw the nomograph background
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX, MARGIN);
    ctx.lineTo(lineX, CANVAS_HEIGHT - MARGIN);
    ctx.stroke();
}

// Update the nomograph with a new line position
function updateNomograph(x) {
    drawLine(x);
}

// Calculate metrics from nomograph position (x-coordinate)
function calculateFromNomograph(x) {
    const t = xToNormalized(x);

    // Use dB as the reference scale (linear)
    const snr = SNR_MIN + t * (SNR_MAX - SNR_MIN); // Linear interpolation

    // Calibrate ENOB to match 10 bits at 60 dB
    const enob = (snr - 1.76) / 6.02; // dB = 6.02 * ENOB + 1.76
    const counts = Math.pow(2, enob);
    const percent = 100 / counts;
    const ppm = percent * 10000;
    const powers = Math.log10(percent / 100);
    const dvm = enob / 3.25; // Updated to match calculateMetrics: bits / 3.25

    return {
        counts: math.round(counts, 0),
        db: math.round(snr, 2),
        bits: math.round(enob, 2),
        percent: math.round(percent, 4),
        powers: math.round(powers, 2),
        ppm: math.round(ppm, 0),
        dvm: math.round(dvm, 1)
    };
}

// Calculate metrics from direct input
function calculateMetrics(inputType, value) {
    let counts, db, bits, percent, powers, ppm, dvm;

    // Convert the input to dB as the reference parameter
    if (inputType === 'db') {
        db = parseFloat(value);
    } else if (inputType === 'bits') {
        bits = parseFloat(value);
        db = 6.02 * bits + 1.76;
    } else if (inputType === 'counts') {
        counts = parseFloat(value);
        bits = Math.log2(counts);
        db = 6.02 * bits + 1.76;
    } else if (inputType === 'percent') {
        percent = parseFloat(value);
        counts = 100 / percent;
        bits = Math.log2(counts);
        db = 6.02 * bits + 1.76;
    } else if (inputType === 'ppm') {
        ppm = parseFloat(value);
        percent = ppm / 10000;
        counts = 100 / percent;
        bits = Math.log2(counts);
        db = 6.02 * bits + 1.76;
    } else if (inputType === 'powers') {
        powers = parseFloat(value);
        percent = 100 * Math.pow(10, powers);
        counts = 100 / percent;
        bits = Math.log2(counts);
        db = 6.02 * bits + 1.76;
    } else if (inputType === 'dvm') {
        dvm = parseFloat(value);
        bits = dvm * 3.25; // Adjusted to align 6.5 DVM Digits with ~21 bits
        db = 6.02 * bits + 1.76;
    }

    // Calculate remaining parameters based on dB
    bits = (db - 1.76) / 6.02;
    counts = Math.pow(2, bits);
    percent = 100 / counts;
    ppm = percent * 10000;
    powers = Math.log10(percent / 100);
    dvm = bits / 3.25; // Adjusted formula

    // Debug log to verify powers calculation
    console.log(`calculateMetrics: inputType=${inputType}, value=${value}, percent=${percent}, powers=${powers}`);

    return {
        counts: math.round(counts, 0),
        db: math.round(db, 2),
        bits: math.round(bits, 2),
        percent: math.round(percent, 4),
        powers: math.round(powers, 2),
        ppm: math.round(ppm, 0),
        dvm: math.round(dvm, 1)
    };
}

// Update all values and the nomograph
function updateValues(inputType, value) {
    let counts, db, bits, percent, powers, ppm, dvm, x;

    if (inputType === 'nomograph') {
        ({ counts, db, bits, percent, powers, ppm, dvm } = calculateFromNomograph(value));
        x = value;
    } else {
        // Preserve the user's input for 'powers' to avoid recomputation
        if (inputType === 'powers') {
            powers = parseFloat(value);
            ({ counts, db, bits, percent, ppm, dvm } = calculateMetrics(inputType, value));
        } else {
            ({ counts, db, bits, percent, powers, ppm, dvm } = calculateMetrics(inputType, value));
        }
        x = dbToX(db);
    }

    // Ensure powers is within the slider range (-7 to -1) and negative, but only if not directly set by the user
    if (inputType !== 'powers') {
        powers = Math.min(-1, Math.max(-7, powers));
        if (powers > 0) {
            powers = -powers; // Force negative if positive
        }
    }

    // Clamp values to valid ranges to avoid NaN
    ppm = Math.max(PPM_MIN, Math.min(PPM_MAX, ppm));
    percent = Math.max(PERCENT_MIN, Math.min(PERCENT_MAX, percent));
    counts = Math.max(COUNTS_MIN, Math.min(COUNTS_MAX, counts));

    // Debug the powers value and slider position
    console.log('Powers value before setting:', powers);
    console.log('Powers slider value before setting:', document.getElementById('powers').value);

    // Update sliders and text boxes
    document.getElementById('dvm').value = dvm;
    document.getElementById('dvmValue').value = dvm;
    document.getElementById('ppmValue').value = ppm;
    document.getElementById('powers').value = powers;
    document.getElementById('powersValue').value = powers;
    document.getElementById('percentValue').value = percent;
    document.getElementById('bits').value = bits;
    document.getElementById('bitsValue').value = bits;
    document.getElementById('db').value = db;
    document.getElementById('dbValue').value = db;
    document.getElementById('countsValue').value = counts;
    document.getElementById('nomographPosition').value = x;

    // Update the logarithmic sliders (ppm, percent, counts)
    document.getElementById('ppm').value = window.logarithmicMapping.logValueToLinear(ppm, window.logarithmicMapping.ppm.minLog, window.logarithmicMapping.ppm.maxLog, window.logarithmicMapping.ppm.logRange, Math.log10);
    document.getElementById('percent').value = window.logarithmicMapping.logValueToLinear(percent, window.logarithmicMapping.percent.minLog, window.logarithmicMapping.percent.maxLog, window.logarithmicMapping.percent.logRange, Math.log10);
    document.getElementById('counts').value = window.logarithmicMapping.logValueToLinear(counts, window.logarithmicMapping.counts.minLog, window.logarithmicMapping.counts.maxLog, window.logarithmicMapping.counts.logRange, Math.log2);

    // Debug the powers slider value after setting
    console.log('Powers slider value after setting:', document.getElementById('powers').value);

    // Update the nomograph line position
    updateNomograph(x);
}

// Initialize the nomograph on page load
document.addEventListener('DOMContentLoaded', () => {
    drawNomograph();
    drawLine(lineX);
});