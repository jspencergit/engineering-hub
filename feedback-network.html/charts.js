// feedback-network/charts.js
console.log("charts.js loaded, checking window:", window);

// Initialize Plant Bode Chart
const plantCtx = document.getElementById("plant-bode-chart").getContext("2d");
console.log("Initializing Plant Chart with context:", plantCtx);
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
console.log("Initializing Compensator Chart with context:", compCtx);
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
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -40, max: 80 },
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
console.log("Initializing Feedback Chart with context:", fbCtx);
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
console.log("Initializing Closed-Loop Chart with context:", closedCtx);
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
    console.log("updateCharts called with:", {
        freqs: calcData.freqs.slice(0, 5),
        plantMags: calcData.plantMags.slice(0, 5),
        fbMags: calcData.fbMags.slice(0, 5)
    });
    if (!calcData || !Array.isArray(calcData.freqs)) {
        console.error("Invalid calcData:", calcData);
        return;
    }

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

    let compClosestZeroIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
        const minDist = Math.abs(arr[minIndex] - compZeroValue);
        const currDist = Math.abs(curr - compZeroValue);
        return currDist < minDist ? idx : minIndex;
    }, 0);
    let compClosestPoleIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
        const minDist = Math.abs(arr[minIndex] - compPoleValue);
        const currDist = Math.abs(curr - compPoleValue);
        return currDist < minDist ? idx : minIndex;
    }, 0);
    const originFreq = calcData.freqs[0]; // Smallest frequency for origin pole marker

    console.log(`Closest zero index (Comp): ${compClosestZeroIndex}, value: ${calcData.freqs[compClosestZeroIndex]}, target: ${compZeroValue}`);
    console.log(`Closest pole index (Comp): ${compClosestPoleIndex}, value: ${calcData.freqs[compClosestPoleIndex]}, target: ${compPoleValue}`);

    compChart.data.datasets[2].data = compClosestZeroIndex >= 0 && compClosestZeroIndex < calcData.compMags.length 
        ? [{ x: compZeroValue, y: calcData.compMags[compClosestZeroIndex] }] 
        : [];
    compChart.data.datasets[3].data = compClosestPoleIndex >= 0 && compClosestPoleIndex < calcData.compMags.length 
        ? [{ x: compPoleValue, y: calcData.compMags[compClosestPoleIndex] }] 
        : [];
    compChart.data.datasets[4].data = compOriginPole && originFreq 
        ? [{ x: originFreq, y: calcData.compMags[0] }] 
        : [];
    compChart.data.datasets[5].data = compClosestZeroIndex >= 0 && compClosestZeroIndex < calcData.compPhases.length 
        ? [{ x: compZeroValue, y: calcData.compPhases[compClosestZeroIndex] }] 
        : [];
    compChart.data.datasets[6].data = compClosestPoleIndex >= 0 && compClosestPoleIndex < calcData.compPhases.length 
        ? [{ x: compPoleValue, y: calcData.compPhases[compClosestPoleIndex] }] 
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

    let fbClosestZeroIndex = -1;
    let fbClosestPoleIndex = -1;
    if (fbZeroCheck && calcData.freqs.length > 0) {
        fbClosestZeroIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbZeroValue);
            const currDist = Math.abs(curr - fbZeroValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
        console.log(`Closest zero index (FB): ${fbClosestZeroIndex}, value: ${calcData.freqs[fbClosestZeroIndex]}, target: ${fbZeroValue}`);
    }
    if (fbPoleCheck && calcData.freqs.length > 0) {
        fbClosestPoleIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbPoleValue);
            const currDist = Math.abs(curr - fbPoleValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
        console.log(`Closest pole index (FB): ${fbClosestPoleIndex}, value: ${calcData.freqs[fbClosestPoleIndex]}, target: ${fbPoleValue}`);
    }

    fbChart.data.datasets[2].data = fbZeroCheck && fbClosestZeroIndex >= 0 && fbClosestZeroIndex < calcData.fbMags.length 
        ? [{ x: fbZeroValue, y: calcData.fbMags[fbClosestZeroIndex] }] 
        : [];
    fbChart.data.datasets[3].data = fbPoleCheck && fbClosestPoleIndex >= 0 && fbClosestPoleIndex < calcData.fbMags.length 
        ? [{ x: fbPoleValue, y: calcData.fbMags[fbClosestPoleIndex] }] 
        : [];
    fbChart.data.datasets[4].data = fbZeroCheck && fbClosestZeroIndex >= 0 && fbClosestZeroIndex < calcData.fbPhases.length 
        ? [{ x: fbZeroValue, y: calcData.fbPhases[fbClosestZeroIndex] }] 
        : [];
    fbChart.data.datasets[5].data = fbPoleCheck && fbClosestPoleIndex >= 0 && fbClosestPoleIndex < calcData.fbPhases.length 
        ? [{ x: fbPoleValue, y: calcData.fbPhases[fbClosestPoleIndex] }] 
        : [];

    fbChart.update();

    // Update Closed-Loop Chart
    closedChart.data.labels = calcData.freqs;
    closedChart.data.datasets[0].data = calcData.closedMags;
    closedChart.data.datasets[1].data = calcData.closedPhases;
    closedChart.update();
}

// Expose updateCharts globally to ensure accessibility
window.updateCharts = updateCharts;
console.log("updateCharts exposed globally:", window.updateCharts);