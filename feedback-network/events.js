// feedback-network/events.js

document.addEventListener("DOMContentLoaded", function() {
    function typesetMathJax(element) {
        const maxAttempts = 10;
        let attempts = 0;
        const interval = setInterval(() => {
            if (typeof MathJax !== "undefined" && MathJax.typeset) {
                MathJax.typeset([element]);
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                console.error(`MathJax failed to load after ${maxAttempts} attempts for element`, element);
                clearInterval(interval);
            }
            attempts++;
        }, 500);
    }

    // Debounce function to prevent rapid updates
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function updateFeedbackNetwork() {
        try {
            const calcData = calculateFeedbackNetwork(); // From calculator.js

            // Debug: Log calcData to check values
            console.log("calcData:", calcData);

            // Update DOM elements
            const bwOutput = document.getElementById("bw-output");
            const pmOutput = document.getElementById("pm-output");
            if (!bwOutput || !pmOutput) {
                console.error("Missing DOM elements: bw-output or pm-output not found");
                return;
            }

            if (calcData.bandwidth !== undefined && calcData.phaseMargin !== undefined) {
                bwOutput.textContent = calcData.bandwidth.toFixed(1);
                pmOutput.textContent = calcData.phaseMargin.toFixed(1);
            } else {
                console.error("calcData is missing bandwidth or phaseMargin:", calcData);
                bwOutput.textContent = "N/A";
                pmOutput.textContent = "N/A";
            }

            // Update Plant transfer function
            const plantGain = parseFloat(document.getElementById("plant-gain").value) || 0;
            const plantLowPole = parseFloat(document.getElementById("plant-low-pole").value) || 1;
            const plantZero = parseFloat(document.getElementById("plant-zero").value) || 0.001;
            const plantHighPole = parseFloat(document.getElementById("plant-high-pole").value) || 0.001;

            console.log("Plant checks:", { plantGain, plantLowPole, plantZero, plantHighPole }); // Debug log

            let plantTf = `P(s) = ${plantGain.toFixed(1)} \\text{dB} \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${plantZero.toFixed(1)} \\text{kHz}}}{\\left(1 + \\frac{s}{2\\pi \\cdot ${plantLowPole.toFixed(1)} \\text{Hz}}\\right) \\left(1 + \\frac{s}{2\\pi \\cdot ${plantHighPole.toFixed(1)} \\text{kHz}}\\right)}`;

            const plantTfElement = document.getElementById("plant-tf");
            if (plantTfElement) {
                plantTfElement.innerHTML = `\\(${plantTf}\\)`;
                console.log("Attempting to typeset plant-tf:", plantTfElement.innerHTML);
                if (typeof MathJax !== "undefined" && MathJax.typeset) {
                    MathJax.typeset([plantTfElement]);
                } else {
                    typesetMathJax(plantTfElement);
                }
            } else {
                console.error("plant-tf element not found");
            }

            // Update Compensator transfer function
            const compLowFreqGain = parseFloat(document.getElementById("comp-low-freq-gain").value) || 0;
            const compLowFreq = parseFloat(document.getElementById("comp-low-freq").value) || 0;
            const compZero = parseFloat(document.getElementById("comp-zero").value) || 1; // Default to 1 if invalid
            const compPole = parseFloat(document.getElementById("comp-pole").value) || 1; // Default to 1 if invalid

            console.log("Compensator checks:", { compLowFreqGain, compLowFreq, compZero, compPole }); // Debug log

            let compTf = `C(s) = ${compLowFreqGain.toFixed(1)} \\text{dB} \\cdot \\frac{1}{s} \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${compZero.toFixed(1)} \\cdot 1000}}{1 + \\frac{s}{2\\pi \\cdot ${compPole.toFixed(1)} \\cdot 1000}}`; // Convert kHz to Hz
            console.log("compTf string:", compTf); // Debug the string

            const compTfElement = document.getElementById("comp-tf");
            if (compTfElement) {
                compTfElement.innerHTML = `\\(${compTf}\\)`;
                console.log("Attempting to typeset comp-tf:", compTfElement.innerHTML);
                if (typeof MathJax !== "undefined" && MathJax.typeset) {
                    MathJax.typeset([compTfElement]);
                } else {
                    typesetMathJax(compTfElement);
                }
            } else {
                console.error("comp-tf element not found");
            }

            const compTfChartElement = document.getElementById("comp-tf-chart");
            if (compTfChartElement) {
                compTfChartElement.innerHTML = `\\(${compTf}\\)`;
                console.log("Attempting to typeset comp-tf-chart:", compTfChartElement.innerHTML);
                if (typeof MathJax !== "undefined" && MathJax.typeset) {
                    MathJax.typeset([compTfChartElement]);
                } else {
                    typesetMathJax(compTfChartElement);
                }
            } else {
                console.error("comp-tf-chart element not found");
            }

            // Update Feedback transfer function
            const fbGainInput = document.getElementById("fb-gain");
            const fbGain = parseFloat(fbGainInput.value) || parseFloat(fbGainInput.getAttribute("value")) || 0;
            const fbZeroCheck = document.getElementById("fb-zero-check").checked;
            const fbZero = fbZeroCheck ? parseFloat(document.getElementById("fb-zero").value) * 1000 : null;
            const fbPoleCheck = document.getElementById("fb-pole-check").checked;
            const fbPole = fbPoleCheck ? parseFloat(document.getElementById("fb-pole").value) * 1000 : null;

            console.log("Feedback checks:", { fbGain, fbZeroCheck, fbZero, fbPoleCheck, fbPole }); // Debug log

            let fbTf = `F(s) = ${fbGain.toFixed(1)} \\text{dB}`;
            if (fbZeroCheck && fbPoleCheck) {
                fbTf += ` \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${(fbZero / 1000).toFixed(1)} \\text{kHz}}}{1 + \\frac{s}{2\\pi \\cdot ${(fbPole / 1000).toFixed(1)} \\text{kHz}}}`;
            } else if (fbZeroCheck) {
                fbTf += ` \\cdot \\left(1 + \\frac{s}{2\\pi \\cdot ${(fbZero / 1000).toFixed(1)} \\text{kHz}}\\right)`;
            } else if (fbPoleCheck) {
                fbTf += ` \\cdot \\frac{1}{1 + \\frac{s}{2\\pi \\cdot ${(fbPole / 1000).toFixed(1)} \\text{kHz}}}`;
            }

            const fbTfElement = document.getElementById("fb-tf");
            if (fbTfElement) {
                fbTfElement.innerHTML = `\\(${fbTf}\\)`;
                console.log("Attempting to typeset fb-tf:", fbTfElement.innerHTML);
                if (typeof MathJax !== "undefined" && MathJax.typeset) {
                    MathJax.typeset([fbTfElement]);
                } else {
                    typesetMathJax(fbTfElement);
                }
            } else {
                console.error("fb-tf element not found");
            }

            const fbTfChartElement = document.getElementById("fb-tf-chart");
            if (fbTfChartElement) {
                fbTfChartElement.innerHTML = `\\(${fbTf}\\)`;
                console.log("Attempting to typeset fb-tf-chart:", fbTfChartElement.innerHTML);
                if (typeof MathJax !== "undefined" && MathJax.typeset) {
                    MathJax.typeset([fbTfChartElement]);
                } else {
                    typesetMathJax(fbTfChartElement);
                }
            } else {
                console.error("fb-tf-chart element not found");
            }

            // Update charts
            if (typeof updateCharts === "function") {
                console.log("Calling updateCharts with calcData:", calcData);
                updateCharts(calcData); // From charts.js
            } else {
                console.error("updateCharts is not a function");
            }
        } catch (error) {
            console.error("Error in updateFeedbackNetwork:", error);
        }
    }

    // Debounced update function
    const debouncedUpdate = debounce(updateFeedbackNetwork, 100);

    // Event listeners for inputs
    const inputs = [
        "plant-gain", "plant-low-pole", "plant-zero", "plant-high-pole",
        "comp-low-freq-gain", "comp-low-freq",
        "comp-pole", "comp-pole-slider", "comp-zero", "comp-zero-slider",
        "fb-gain", "fb-gain-slider", "fb-zero", "fb-zero-slider", "fb-pole", "fb-pole-slider"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === "comp-low-freq-gain") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 1;
                    let minValue = parseFloat(this.min) || -100;
                    let maxValue = parseFloat(this.max) || 100;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "comp-low-freq") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 1;
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 10000;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "comp-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-pole").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "comp-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("comp-pole-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 500;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("comp-pole-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "comp-zero-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-zero").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "comp-zero") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("comp-zero-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 100;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("comp-zero-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "fb-gain-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("fb-gain").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "fb-gain") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("fb-gain-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    if (event.deltaY < 0) value += step;
                    else if (value - step >= -20) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-gain-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "fb-zero-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("fb-zero").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "fb-zero") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("fb-zero-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    if (this.disabled) return; // Skip if disabled
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1; // 0.1 kHz increments
                    let minValue = parseFloat(this.min) || 0.001;
                    if (event.deltaY < 0) value += step;
                    else if (value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-zero-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "fb-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("fb-pole").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "fb-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("fb-pole-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    if (this.disabled) return; // Skip if disabled
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1; // 0.1 kHz increments
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 1000;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-pole-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else {
                element.addEventListener("input", () => debouncedUpdate());
            }
        } else {
            console.error(`Element with ID "${id}" not found`);
        }
    });

    // Checkbox event listeners with debounced update
    const fbZeroCheck = document.getElementById("fb-zero-check");
    const fbPoleCheck = document.getElementById("fb-pole-check");
    if (fbZeroCheck) {
        fbZeroCheck.addEventListener("change", function() {
            const fbZero = document.getElementById("fb-zero");
            const fbZeroSlider = document.getElementById("fb-zero-slider");
            if (fbZero && fbZeroSlider) {
                fbZero.disabled = !this.checked;
                fbZeroSlider.disabled = !this.checked;
                console.log(`fb-zero-check changed to ${this.checked}, updating chart`);
                debouncedUpdate();
            } else {
                console.error("fb-zero or fb-zero-slider element not found");
            }
        });
    }
    if (fbPoleCheck) {
        fbPoleCheck.addEventListener("change", function() {
            const fbPole = document.getElementById("fb-pole");
            const fbPoleSlider = document.getElementById("fb-pole-slider");
            if (fbPole && fbPoleSlider) {
                fbPole.disabled = !this.checked;
                fbPoleSlider.disabled = !this.checked;
                console.log(`fb-pole-check changed to ${this.checked}, updating chart`);
                debouncedUpdate();
            } else {
                console.error("fb-pole or fb-pole-slider element not found");
            }
        });
    }

    // Reset button functionality
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        resetButton.addEventListener("click", function() {
            // Reset Plant
            document.getElementById("plant-gain").value = "0";
            document.getElementById("plant-low-pole").value = "1000"; // Default to 1000 Hz
            document.getElementById("plant-zero").value = "20";
            document.getElementById("plant-high-pole").value = "100";

            // Reset Compensator
            document.getElementById("comp-low-freq-gain").value = "60";
            document.getElementById("comp-low-freq").value = "100";
            document.getElementById("comp-pole").value = "100";
            document.getElementById("comp-pole-slider").value = "100";
            document.getElementById("comp-zero").value = "10";
            document.getElementById("comp-zero-slider").value = "10";

            // Reset Feedback
            document.getElementById("fb-gain").value = "0"; // Default to 0 dB
            document.getElementById("fb-gain-slider").value = "0"; // Default to 0 dB
            document.getElementById("fb-zero-check").checked = false;
            document.getElementById("fb-zero").value = "10.8";
            document.getElementById("fb-zero-slider").value = "10.8";
            document.getElementById("fb-zero").disabled = true;
            document.getElementById("fb-zero-slider").disabled = true;
            document.getElementById("fb-pole-check").checked = false;
            document.getElementById("fb-pole").value = "155.7";
            document.getElementById("fb-pole-slider").value = "155.7";
            document.getElementById("fb-pole").disabled = true;
            document.getElementById("fb-pole-slider").disabled = true;

            console.log("Reset to default values, triggering update");
            debouncedUpdate();
        });
    } else {
        console.error("reset-button element not found");
    }

    // Initial update with delay to ensure updateCharts is ready
    function waitForCharts() {
        console.log("Checking for updateCharts:", typeof updateCharts, window.updateCharts);
        if (typeof updateCharts === "function") {
            console.log("updateCharts ready, running initial update");
            updateFeedbackNetwork();
        } else {
            console.log("Waiting for updateCharts...");
            setTimeout(waitForCharts, 100);
        }
    }
    waitForCharts();
});