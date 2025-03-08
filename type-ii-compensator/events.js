// events.js
function updateCompensator() {
    const calcData = calculateCompensator(); // From calculator.js

    // Update DOM elements
    document.getElementById("zero-output").textContent = calcData.fz1.toFixed(1);
    document.getElementById("pole-output").textContent = calcData.fp2.toFixed(1);
    document.getElementById("transfer-output").innerHTML = `\\( A(s) = ${calcData.gainDb.toFixed(1)} \\, \\text{dB} \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${calcData.fz1.toFixed(1)} \\, \\text{kHz}}}{\\left(1 + \\frac{s}{2\\pi \\cdot ${calcData.fp0.toFixed(1)} \\, \\text{kHz}}\\right) \\cdot \\left(1 + \\frac{s}{2\\pi \\cdot ${calcData.fp2.toFixed(1)} \\, \\text{kHz}}\\right)} \\)`;
    document.getElementById("phase-boost-output").textContent = `${calcData.phaseBoost.toFixed(1)}° at ${calcData.fBoost.toFixed(1)} kHz`;

    // Update charts
    updateCharts(calcData); // From charts.js

    // Re-render MathJax
    MathJax.typeset();
}

function updateFromSlider(type) {
    let inputId = type;
    let sliderId = type + "-slider";
    let value = parseFloat(document.getElementById(sliderId).value);
    document.getElementById(inputId).value = value;
    updateCompensator();
}

function resetCompensator() {
    document.getElementById("rth").value = 10;
    document.getElementById("rth-slider").value = 10;
    document.getElementById("cth").value = 1000;
    document.getElementById("cth-slider").value = 1000;
    document.getElementById("cthp").value = 100;
    document.getElementById("cthp-slider").value = 100;
    document.getElementById("gm").value = 2;
    document.getElementById("gm-slider").value = 2;
    document.getElementById("ro").value = 500;
    document.getElementById("ro-slider").value = 500;
    document.getElementById("x-min").value = 0.1;
    document.getElementById("x-min-slider").value = 0.1;
    document.getElementById("x-max").value = 1000;
    document.getElementById("x-max-slider").value = 1000;
    updateCompensator();
}

// Event listeners for inputs
document.getElementById("rth").addEventListener("input", updateCompensator);
document.getElementById("cth").addEventListener("input", updateCompensator);
document.getElementById("cthp").addEventListener("input", updateCompensator);
document.getElementById("gm").addEventListener("input", updateCompensator);
document.getElementById("ro").addEventListener("input", updateCompensator);
document.getElementById("x-min").addEventListener("input", updateCompensator);
document.getElementById("x-max").addEventListener("input", updateCompensator);

// Event listeners for sliders
document.getElementById("rth-slider").addEventListener("input", () => updateFromSlider("rth"));
document.getElementById("cth-slider").addEventListener("input", () => updateFromSlider("cth"));
document.getElementById("cthp-slider").addEventListener("input", () => updateFromSlider("cthp"));
document.getElementById("gm-slider").addEventListener("input", () => updateFromSlider("gm"));
document.getElementById("ro-slider").addEventListener("input", () => updateFromSlider("ro"));
document.getElementById("x-min-slider").addEventListener("input", () => updateFromSlider("x-min"));
document.getElementById("x-max-slider").addEventListener("input", () => updateFromSlider("x-max"));

// Event listeners for mousewheel
document.getElementById("rth").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 10;
    let step = 0.1;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value.toFixed(1);
    updateCompensator();
});

document.getElementById("cth").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 1000;
    let step = 100;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value;
    updateCompensator();
});

document.getElementById("cthp").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 100;
    let step = 10;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value;
    updateCompensator();
});

document.getElementById("gm").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 2;
    let step = 0.1;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value.toFixed(1);
    updateCompensator();
});

document.getElementById("ro").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 500;
    let step = 10;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value;
    updateCompensator();
});

document.getElementById("x-min").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 0.1;
    let step = 0.1;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value.toFixed(1);
    updateCompensator();
});

document.getElementById("x-max").addEventListener("wheel", function(event) {
    event.preventDefault();
    let value = parseFloat(this.value) || 1000;
    let step = 10;
    if (event.deltaY < 0) value += step;
    else if (value > step) value -= step;
    this.value = value.toFixed(1);
    updateCompensator();
});

// Event listener for reset button
document.getElementById("reset-btn").addEventListener("click", resetCompensator);

// Initial update
updateCompensator();
