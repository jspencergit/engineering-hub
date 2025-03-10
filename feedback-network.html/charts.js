// feedback-network/charts.js

// Initialize Plant Bode Chart
const plantCtx = document.getElementById("plant-bode-chart").getContext("2d");
console.log("Initializing Plant Chart");
let plantChart = new Chart(plantCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
            legend: { display: false }, // Remove legend
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.dataset.label}: ${context.parsed.y.toFixed(1)}` } 
            } 
        }
    }
});

// Initialize Compensator Bode Chart
const compCtx = document.getElementById("comp-bode-chart").getContext("2d");
console.log("Initializing Compensator Chart");
let compChart = new Chart(compCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" },
            { 
                label: "Zero Marker", 
                data: [], 
                pointStyle: "circle", 
                pointRadius: 5, 
                pointBackgroundColor: "green", 
                pointBorderColor: "green", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Pole Marker", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "red", 
                pointBorderColor: "red", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Origin Pole Marker", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "purple", 
                pointBorderColor: "purple", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Zero Marker (Phase)", 
                data: [], 
                pointStyle: "circle", 
                pointRadius: 5, 
                pointBackgroundColor: "green", 
                pointBorderColor: "green", 
                showLine: false, 
                yAxisID: "y-phase" 
            },
            { 
                label: "Pole Marker (Phase)", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "red", 
                pointBorderColor: "red", 
                showLine: false, 
                yAxisID: "y-phase" 
            },
            { 
                label: "Origin Pole Marker (Phase)", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "purple", 
                pointBorderColor: "purple", 
                showLine: false, 
                yAxisID: "y-phase" 
            }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
            legend: { display: false }, // Remove legend
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.dataset.label}: ${context.parsed.y.toFixed(1)}` } 
            } 
        }
    }
});

// Initialize Feedback Bode Chart
const fbCtx = document.getElementById("fb-bode-chart").getContext("2d");
console.log("Initializing Feedback Chart");
let fbChart = new Chart(fbCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" },
            { 
                label: "Zero Marker", 
                data: [], 
                pointStyle: "circle", 
                pointRadius: 5, 
                pointBackgroundColor: "green", 
                pointBorderColor: "green", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Pole Marker", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "red", 
                pointBorderColor: "red", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Zero Marker (Phase)", 
                data: [], 
                pointStyle: "circle", 
                pointRadius: 5, 
                pointBackgroundColor: "green", 
                pointBorderColor: "green", 
                showLine: false, 
                yAxisID: "y-phase" 
            },
            { 
                label: "Pole Marker (Phase)", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "red", 
                pointBorderColor: "red", 
                showLine: false, 
                yAxisID: "y-phase" 
            }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
            legend: { display: false }, // Remove legend
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.dataset.label}: ${context.parsed.y.toFixed(1)}` } 
            } 
        }
    }
});

// Initialize Closed-Loop Bode Chart
const closedCtx = document.getElementById("closed-bode-chart").getContext("2d");
console.log("Initializing Closed-Loop Chart");
let closedChart = new Chart(closedCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
            legend: { display: false }, // Remove legend
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.dataset.label}: ${context.parsed.y.toFixed(1)}` } 
            } 
        }
    }
});

// Function to update all charts with data from calculator.js
function updateCharts(calcData) {
    console.log("Updating charts with:", { fbMags: calcData.fbMags.slice(0, 5), fbPhases: calcData.fbPhases.slice(0, 5) }); // Debug first 5 values
    console.log("Compensator data:", { compMags: calcData.compMags.slice(0, 5), compPhases: calcData.compPhases.slice(0, 5) }); // Debug first 5 values

    // Update Plant Chart
    plantChart.data.labels = calcData.freqs;
    plantChart.data.datasets[0].data = calcData.plantMags;
    plantChart.data.datasets[1].data = calcData.plantPhases;
    plantChart.update();

    // Update Compensator Chart
    compChart.data.labels = calcData.freqs;
    compChart.data.datasets[0].data = calcData.compMags;
    compChart.data.datasets[1].data = calcData.compPhases;

    // Add pole and zero markers for Compensator plot
    const compZeroValue = calcData.compZero; // Already in kHz
    const compPoleValue = calcData.compPole; // Already in kHz
    const compOriginPole = calcData.compOriginPole;

    const closestZeroIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
        const minDist = Math.abs(arr[minIndex] - compZeroValue);
        const currDist = Math.abs(curr - compZeroValue);
        return currDist < minDist ? idx : minIndex;
    }, 0);
    const closestPoleIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
        const minDist = Math.abs(arr[minIndex] - compPoleValue);
        const currDist = Math.abs(curr - compPoleValue);
        return currDist < minDist ? idx : minIndex;
    }, 0);
    const originFreq = calcData.freqs[0]; // Smallest frequency for origin pole marker

    console.log(`Closest zero index (Comp): ${closestZeroIndex}, value: ${calcData.freqs[closestZeroIndex]}, target: ${compZeroValue}`);
    console.log(`Closest pole index (Comp): ${closestPoleIndex}, value: ${calcData.freqs[closestPoleIndex]}, target: ${compPoleValue}`);

    compChart.data.datasets[2].data = closestZeroIndex >= 0 && closestZeroIndex < calcData.compMags.length 
        ? [{ x: compZeroValue, y: calcData.compMags[closestZeroIndex] }] 
        : [];
    compChart.data.datasets[3].data = closestPoleIndex >= 0 && closestPoleIndex < calcData.compMags.length 
        ? [{ x: compPoleValue, y: calcData.compMags[closestPoleIndex] }] 
        : [];
    compChart.data.datasets[4].data = compOriginPole && originFreq 
        ? [{ x: originFreq, y: calcData.compMags[0] }] 
        : [];
    compChart.data.datasets[5].data = closestZeroIndex >= 0 && closestZeroIndex < calcData.compPhases.length 
        ? [{ x: compZeroValue, y: calcData.compPhases[closestZeroIndex] }] 
        : [];
    compChart.data.datasets[6].data = closestPoleIndex >= 0 && closestPoleIndex < calcData.compPhases.length 
        ? [{ x: compPoleValue, y: calcData.compPhases[closestPoleIndex] }] 
        : [];
    compChart.data.datasets[7].data = compOriginPole && originFreq 
        ? [{ x: originFreq, y: calcData.compPhases[0] }] 
        : [];

    compChart.update();

    // Update Feedback Chart
    fbChart.data.labels = calcData.freqs;
    fbChart.data.datasets[0].data = calcData.fbMags;
    fbChart.data.datasets[1].data = calcData.fbPhases;

    // Add pole and zero markers for magnitude plot
    const fbZeroCheck = document.getElementById("fb-zero-check").checked;
    const fbPoleCheck = document.getElementById("fb-pole-check").checked;
    const fbZeroValue = fbZeroCheck ? parseFloat(document.getElementById("fb-zero").value) : null;
    const fbPoleValue = fbPoleCheck ? parseFloat(document.getElementById("fb-pole").value) : null;

    let closestZeroIndex = -1;
    let closestPoleIndex = -1;
    if (fbZeroCheck && calcData.freqs.length > 0) {
        closestZeroIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbZeroValue);
            const currDist = Math.abs(curr - fbZeroValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
        console.log(`Closest zero index: ${closestZeroIndex}, value: ${calcData.freqs[closestZeroIndex]}, target: ${fbZeroValue}`);
    }
    if (fbPoleCheck && calcData.freqs.length > 0) {
        closestPoleIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbPoleValue);
            const currDist = Math.abs(curr - fbPoleValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
        console.log(`Closest pole index: ${closestPoleIndex}, value: ${calcData.freqs[closestPoleIndex]}, target: ${fbPoleValue}`);
    }

    // Set markers using actual data values
    fbChart.data.datasets[2].data = fbZeroCheck && closestZeroIndex >= 0 && closestZeroIndex < calcData.fbMags.length 
        ? [{ x: fbZeroValue, y: calcData.fbMags[closestZeroIndex] }] 
        : [];
    fbChart.data.datasets[3].data = fbPoleCheck && closestPoleIndex >= 0 && closestPoleIndex < calcData.fbMags.length 
        ? [{ x: fbPoleValue, y: calcData.fbMags[closestPoleIndex] }] 
        : [];
    fbChart.data.datasets[4].data = fbZeroCheck && closestZeroIndex >= 0 && closestZeroIndex < calcData.fbPhases.length 
        ? [{ x: fbZeroValue, y: calcData.fbPhases[closestZeroIndex] }] 
        : [];
    fbChart.data.datasets[5].data = fbPoleCheck && closestPoleIndex >= 0 && closestPoleIndex < calcData.fbPhases.length 
        ? [{ x: fbPoleValue, y: calcData.fbPhases[closestPoleIndex] }] 
        : [];

    fbChart.update();

    // Update Closed-Loop Chart
    closedChart.data.labels = calcData.freqs;
    closedChart.data.datasets[0].data = calcData.closedMags;
    closedChart.data.datasets[1].data = calcData.closedPhases;
    closedChart.update();
}