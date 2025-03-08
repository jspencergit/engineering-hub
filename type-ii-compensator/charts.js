// charts.js
// Initialize magnitude chart
const magCtx = document.getElementById("bodeMagChart").getContext("2d");
let magChart = new Chart(magCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Magnitude (dB)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0 },
            { label: "Pole (fp2)", data: [], pointRadius: 8, pointStyle: "cross", borderColor: "red", showLine: false },
            { label: "Zero (fz1)", data: [], pointRadius: 5, pointStyle: "circle", borderColor: "green", showLine: false },
            { label: "Pole (fp0)", data: [], pointRadius: 8, pointStyle: "cross", borderColor: "red", showLine: false }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            y: { title: { display: true, text: "Magnitude (dB)" }, min: -20 } // Max set dynamically later
        },
        plugins: { 
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.parsed.y.toFixed(1)} dB` } 
            } 
        }
    }
});

// Initialize phase chart
const phaseCtx = document.getElementById("bodePhaseChart").getContext("2d");
let phaseChart = new Chart(phaseCtx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            { label: "Phase (degrees)", data: [], borderColor: "#1a73e8", fill: false, pointRadius: 0 },
            { label: "Pole (fp2)", data: [], pointRadius: 8, pointStyle: "cross", borderColor: "red", showLine: false },
            { label: "Zero (fz1)", data: [], pointRadius: 5, pointStyle: "circle", borderColor: "green", showLine: false },
            { label: "Pole (fp0)", data: [], pointRadius: 8, pointStyle: "cross", borderColor: "red", showLine: false }
        ]
    },
    options: {
        scales: {
            x: { type: "logarithmic", title: { display: true, text: "Frequency (kHz)" }, ticks: { callback: value => value.toFixed(1) } },
            y: { title: { display: true, text: "Phase (degrees)" }, min: -90, max: 0 }
        },
        plugins: { 
            tooltip: { 
                mode: "nearest", 
                intersect: false, 
                callbacks: { label: context => `${context.parsed.x.toFixed(1)} kHz, ${context.parsed.y.toFixed(1)}°` } 
            } 
        }
    }
});

// Function to update charts with data from calculator.js
function updateCharts(calcData) {
    // Set dynamic Y-axis max for magnitude plot
    let baseMax = Math.ceil(calcData.gainDb / 10) * 10;
    let yMax = baseMax + 10;
    if (yMax - calcData.gainDb < 10) yMax += 10;
    if (yMax - calcData.gainDb > 20) yMax = baseMax + 10;
    magChart.options.scales.y.max = yMax;

    // Marker data for fp2
    let wPole2 = 2 * Math.PI * calcData.fp2 * 1000;
    let magPole2 = calcData.gainDb * Math.sqrt(1 + Math.pow(wPole2 / (2 * Math.PI * calcData.fz1 * 1000), 2)) / 
                   (Math.sqrt(1 + Math.pow(wPole2 / (2 * Math.PI * calcData.fp0 * 1000), 2)) * Math.sqrt(1 + Math.pow(wPole2 / (2 * Math.PI * calcData.fp2 * 1000), 2)));
    let dbPole2 = 20 * Math.log10(magPole2);
    let phasePole2Marker = Math.atan(wPole2 / (2 * Math.PI * calcData.fz1 * 1000)) * 180 / Math.PI - 
                           Math.atan(wPole2 / (2 * Math.PI * calcData.fp0 * 1000)) * 180 / Math.PI - 45;

    // Marker data for fz1
    let wZero = 2 * Math.PI * calcData.fz1 * 1000;
    let magZero = calcData.gainDb * Math.sqrt(1 + Math.pow(wZero / (2 * Math.PI * calcData.fz1 * 1000), 2)) / 
                  (Math.sqrt(1 + Math.pow(wZero / (2 * Math.PI * calcData.fp0 * 1000), 2)) * Math.sqrt(1 + Math.pow(wZero / (2 * Math.PI * calcData.fp2 * 1000), 2)));
    let dbZero = 20 * Math.log10(magZero);
    let phaseZeroMarker = 45 - Math.atan(wZero / (2 * Math.PI * calcData.fp0 * 1000)) * 180 / Math.PI - 
                          Math.atan(wZero / (2 * Math.PI * calcData.fp2 * 1000)) * 180 / Math.PI;

    // Marker data for fp0
    let wPole0 = 2 * Math.PI * calcData.fp0 * 1000;
    let magPole0 = calcData.gainDb / Math.sqrt(1 + Math.pow(wPole0 / (2 * Math.PI * calcData.fp0 * 1000), 2));
    let dbPole0 = 20 * Math.log10(magPole0);
    let phasePole0Marker = -45;

    // Update magnitude chart
    magChart.data.labels = calcData.freqs;
    magChart.data.datasets[0].data = calcData.mags;
    magChart.data.datasets[1].data = [{x: calcData.fp2, y: dbPole2}];
    magChart.data.datasets[2].data = [{x: calcData.fz1, y: dbZero}];
    magChart.data.datasets[3].data = [{x: calcData.fp0, y: dbPole0}];
    magChart.options.scales.x.min = calcData.xMin / 1000;
    magChart.options.scales.x.max = calcData.xMax / 1000;
    magChart.update();

    // Update phase chart
    phaseChart.data.labels = calcData.freqs;
    phaseChart.data.datasets[0].data = calcData.phases;
    phaseChart.data.datasets[1].data = [{x: calcData.fp2, y: phasePole2Marker}];
    phaseChart.data.datasets[2].data = [{x: calcData.fz1, y: phaseZeroMarker}];
    phaseChart.data.datasets[3].data = [{x: calcData.fp0, y: phasePole0Marker}];
    phaseChart.options.scales.x.min = calcData.xMin / 1000;
    phaseChart.options.scales.x.max = calcData.xMax / 1000;
    phaseChart.update();
}
