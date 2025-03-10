// feedback-network/charts.js

// Initialize Plant Bode Chart
const plantCtx = document.getElementById("plant-bode-chart").getContext("2d");
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
        plugins: { 
            title: { 
                display: true, 
                text: "Plant Response", 
                align: "center", 
                font: { size: 16 } 
            } 
        },
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
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
let compChart = new Chart(compCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" }
        ]
    },
    options: {
        plugins: { 
            title: { 
                display: true, 
                text: "Compensator Response", 
                align: "center", 
                font: { size: 16 } 
            } 
        },
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
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
let fbChart = new Chart(fbCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0, yAxisID: "y-mag" },
            { label: "Phase (degrees)", data: [], borderColor: "#ff9500", fill: false, pointRadius: 0, yAxisID: "y-phase" }
        ]
    },
    options: {
        plugins: { 
            title: { 
                display: true, 
                text: "Feedback Response", 
                align: "center", 
                font: { size: 16 } 
            } 
        },
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -90, max: 90, grid: { drawOnChartArea: false } }
        },
        plugins: { 
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
        plugins: { 
            title: { 
                display: true, 
                text: "Closed-Loop Response", 
                align: "center", 
                font: { size: 16 } 
            } 
        },
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -60, max: 60 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 180, grid: { drawOnChartArea: false } }
        },
        plugins: { 
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
    compChart.update();

    // Update Feedback Chart
    fbChart.data.labels = calcData.freqs;
    fbChart.data.datasets[0].data = calcData.fbMags;
    fbChart.data.datasets[1].data = calcData.fbPhases;
    fbChart.update();

    // Update Closed-Loop Chart
    closedChart.data.labels = calcData.freqs;
    closedChart.data.datasets[0].data = calcData.closedMags;
    closedChart.data.datasets[1].data = calcData.closedPhases;
    closedChart.update();
}
