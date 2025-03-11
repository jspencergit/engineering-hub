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
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -80, max: 10 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 90, grid: { drawOnChartArea: false } }
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
                label: "Low Freq Gain Marker (Mag)", 
                data: [], 
                pointStyle: "crossRot", 
                pointRadius: 5, 
                pointBackgroundColor: "red", 
                pointBorderColor: "red", 
                showLine: false, 
                yAxisID: "y-mag" 
            },
            { 
                label: "Low Freq Gain Marker (Phase)", 
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
            "y-mag": { position: "left", title: { display: true, text: "Magnitude (dB)" }, min: -40, max: 80 },
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -180, max: 0, grid: { drawOnChartArea: false } }
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

// Initialize Loop Gain Bode Chart (renamed from Closed-Loop)
const closedCtx = document.getElementById("closed-bode-chart").getContext("2d");
console.log("Initializing Loop Gain Chart with context:", closedCtx);
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
            "y-phase": { position: "right", title: { display: true, text: "Phase (degrees)" }, min: -360, max: -180, grid: { drawOnChartArea: false } }
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

    console.log(`Closest zero index (Comp): ${compClosestZeroIndex}, value: ${calcData.freqs[compClosestZeroIndex]}, target: ${compZeroValue}`);
    console.log(`Closest pole index (Comp): ${compClosestPoleIndex}, value: ${calcData.freqs[compClosestPoleIndex]}, target: ${compPoleValue}`);

    compChart.data.datasets[2].data = compClosestZeroIndex >= 0 && compClosestZeroIndex < calcData.compMags.length 
        ? [{ x: compZeroValue, y: calcData.compMags[compClosestZeroIndex] }] 
        : [];
    compChart.data.datasets[3].data = compClosestPoleIndex >= 0 && compClosestPoleIndex < calcData.compMags.length 
        ? [{ x: compPoleValue, y: calcData.compMags[compClosestPoleIndex] }] 
        : [];
    compChart.data.datasets[4].data = compClosestZeroIndex >= 0 && compClosestZeroIndex < calcData.compPhases.length 
        ? [{ x: compZeroValue, y: calcData.compPhases[compClosestZeroIndex] }] 
        : [];
    compChart.data.datasets[5].data = compClosestPoleIndex >= 0 && compClosestPoleIndex < calcData.compPhases.length 
        ? [{ x: compPoleValue, y: calcData.compPhases[compClosestPoleIndex] }] 
        : [];

    // Add low-frequency gain marker
    const compLowFreqGain = parseFloat(document.getElementById("comp-low-freq-gain").value) || 0;
    const compLowFreq = parseFloat(document.getElementById("comp-low-freq").value) / 1000 || 0.1; // Convert Hz to kHz
    compChart.data.datasets[6].data = [{ x: compLowFreq, y: compLowFreqGain }]; // Magnitude marker
    compChart.data.datasets[7].data = [{ x: compLowFreq, y: -90 }]; // Phase marker at -90 degrees

    compChart.update();

    // Update Feedback Chart
    fbChart.data.labels = calcData.freqs;
    fbChart.data.datasets[0].data = calcData.fbMags;
    fbChart.data.datasets[1].data = calcData.fbPhases;

    // Add pole and zero markers for Feedback plot
    const fbZeroCheck = document.getElementById("fb-zero-check").checked;
    const fbPoleCheck = document.getElementById("fb-pole-check").checked;
    const fbZeroValue = fbZeroCheck ? parseFloat(document.getElementById("fb-zero").value) : null;
    const fbPoleValue = fbPoleCheck ? parseFloat(document.getElementById("fb-pole").value) : null;

    // Find exact or closest indices for zero and pole
    let fbClosestZeroIndex = fbZeroCheck && calcData.freqs.length > 0 ? calcData.freqs.findIndex(f => Math.abs(f - fbZeroValue) < 0.1) : -1;
    let fbClosestPoleIndex = fbPoleCheck && calcData.freqs.length > 0 ? calcData.freqs.findIndex(f => Math.abs(f - fbPoleValue) < 0.1) : -1;

    if (fbClosestZeroIndex === -1 && fbZeroCheck) {
        fbClosestZeroIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbZeroValue);
            const currDist = Math.abs(curr - fbZeroValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
    }
    if (fbClosestPoleIndex === -1 && fbPoleCheck) {
        fbClosestPoleIndex = calcData.freqs.reduce((minIndex, curr, idx, arr) => {
            const minDist = Math.abs(arr[minIndex] - fbPoleValue);
            const currDist = Math.abs(curr - fbPoleValue);
            return currDist < minDist ? idx : minIndex;
        }, 0);
    }

    console.log(`Closest zero index (FB): ${fbClosestZeroIndex}, value: ${fbClosestZeroIndex >= 0 ? calcData.freqs[fbClosestZeroIndex] : 'N/A'}, target: ${fbZeroValue}`);
    console.log(`Closest pole index (FB): ${fbClosestPoleIndex}, value: ${fbClosestPoleIndex >= 0 ? calcData.freqs[fbClosestPoleIndex] : 'N/A'}, target: ${fbPoleValue}`);

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

    // Update Loop Gain Chart
    closedChart.data.labels = calcData.freqs;
    closedChart.data.datasets[0].data = calcData.closedMags;
    closedChart.data.datasets[1].data = calcData.closedPhases;

    // Remove any existing gain crossover line to prevent multiple lines
    closedChart.data.datasets = closedChart.data.datasets.filter(dataset => dataset.label !== 'Gain Crossover');

    // Calculate bandwidth and phase margin
    let bandwidth = 0;
    let phaseMargin = 0;
    let gainCrossoverIndex = -1;
    for (let i = 0; i < calcData.closedMags.length; i++) {
        if (calcData.closedMags[i] >= -1 && calcData.closedMags[i] <= 1) {
            gainCrossoverIndex = i;
            bandwidth = calcData.freqs[i];
            break;
        }
    }
    if (gainCrossoverIndex === -1 && calcData.closedMags.length > 1) {
        for (let i = 0; i < calcData.closedMags.length - 1; i++) {
            if ((calcData.closedMags[i] > 0 && calcData.closedMags[i + 1] < 0) || 
                (calcData.closedMags[i] < 0 && calcData.closedMags[i + 1] > 0)) {
                const mag1 = calcData.closedMags[i];
                const mag2 = calcData.closedMags[i + 1];
                const freq1 = calcData.freqs[i];
                const freq2 = calcData.freqs[i + 1];
                bandwidth = freq1 + (freq2 - freq1) * (0 - mag1) / (mag2 - mag1);
                gainCrossoverIndex = i; // Use the first index for phase margin
                break;
            }
        }
    }
    if (gainCrossoverIndex !== -1) {
        // Updated phase margin calculation: phase - (-360)
        phaseMargin = calcData.closedPhases[gainCrossoverIndex] - (-360);
    }

    // Update display
    const lgBwElement = document.getElementById("lg-bw");
    const lgPmElement = document.getElementById("lg-pm");
    const loopGainStatsElement = document.getElementById("loop-gain-stats");
    if (lgBwElement && lgPmElement && loopGainStatsElement) {
        lgBwElement.textContent = bandwidth.toFixed(1);
        lgPmElement.textContent = phaseMargin.toFixed(1);
        loopGainStatsElement.innerHTML = `Bandwidth: <span id="lg-bw">${bandwidth.toFixed(1)}</span> kHz, Phase Margin: <span id="lg-pm">${phaseMargin.toFixed(1)}</span>°`;
        if (typeof MathJax !== "undefined" && MathJax.typeset) {
            MathJax.typeset([loopGainStatsElement]);
        }
    } else {
        console.error("Loop gain stats elements not found");
    }

    // Add vertical dashed line at 0 dB gain crossover
    if (gainCrossoverIndex !== -1) {
        const crossoverFreq = bandwidth; // Use calculated bandwidth
        closedChart.data.datasets.push({
            label: 'Gain Crossover',
            data: [{ x: crossoverFreq, y: -60 }, { x: crossoverFreq, y: 60 }],
            borderColor: 'gray',
            borderDash: [5, 5], // Dashed line
            borderWidth: 1,
            pointRadius: 0,
            yAxisID: 'y-mag'
        });
    }

    closedChart.update();
}

// Expose updateCharts globally to ensure accessibility
window.updateCharts = updateCharts;
console.log("updateCharts exposed globally:", window.updateCharts);