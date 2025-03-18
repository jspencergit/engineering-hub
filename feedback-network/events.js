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
            const calcData = calculateFeedbackNetwork();

            console.log("calcData:", calcData);

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

            const plantGain = parseFloat(document.getElementById("plant-gain").value) || 0;
            const plantLowPole = parseFloat(document.getElementById("plant-low-pole").value) || 1;
            const plantZero = parseFloat(document.getElementById("plant-zero").value) || 0.001;
            const plantHighPole = parseFloat(document.getElementById("plant-high-pole").value) || 0.001;

            console.log("Plant checks:", { plantGain, plantLowPole, plantZero, plantHighPole });

            let plantTf = `P(s) = ${plantGain.toFixed(1)} \\text{dB} \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${plantZero.toFixed(1)} \\text{kHz}}}{\\left(1 + \\frac{s}{2\\pi \\cdot ${plantLowPole.toFixed(1)} \\text{kHz}}\\right) \\left(1 + \\frac{s}{2\\pi \\cdot ${plantHighPole.toFixed(1)} \\text{kHz}}\\right)}`;

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

            const compLowFreqGain = parseFloat(document.getElementById("comp-low-freq-gain").value) || 0;
            const compLowFreq = parseFloat(document.getElementById("comp-low-freq").value) || 0;
            const compZero = parseFloat(document.getElementById("comp-zero").value) || 1;
            const compPole = parseFloat(document.getElementById("comp-pole").value) || 1;

            console.log("Compensator checks:", { compLowFreqGain, compLowFreq, compZero, compPole });

            let compTf = `C(s) = ${compLowFreqGain.toFixed(1)} \\text{dB} \\cdot \\frac{1}{s} \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${compZero.toFixed(1)} \\text{kHz}}}{1 + \\frac{s}{2\\pi \\cdot ${compPole.toFixed(1)} \\text{kHz}}}`;
            console.log("compTf string:", compTf);

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

            const fbGainInput = document.getElementById("fb-gain");
            const fbGain = parseFloat(fbGainInput.value) || parseFloat(fbGainInput.getAttribute("value")) || 0;
            const fbZeroCheck = document.getElementById("fb-zero-check").checked;
            const fbZero = fbZeroCheck ? parseFloat(document.getElementById("fb-zero").value) * 1000 : null;
            const fbPoleCheck = document.getElementById("fb-pole-check").checked;
            const fbPole = fbPoleCheck ? parseFloat(document.getElementById("fb-pole").value) * 1000 : null;

            console.log("Feedback checks:", { fbGain, fbZeroCheck, fbZero, fbPoleCheck, fbPole });

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

            if (typeof updateCharts === "function") {
                console.log("Calling updateCharts with calcData:", calcData);
                updateCharts(calcData);
            } else {
                console.error("updateCharts is not a function");
            }
        } catch (error) {
            console.error("Error in updateFeedbackNetwork:", error);
        }
    }

    const debouncedUpdate = debounce(updateFeedbackNetwork, 100);

    // Updated inputs configuration to be dynamic
    let inputs = {
        'plant-gain': { step: 1, min: -20, max: 20 },
        'plant-low-pole': { step: 0.1, min: 0.01, max: 10 },
        'plant-zero': { step: 1, min: 1, max: 100 },
        'plant-high-pole': { step: 1, min: 10, max: 500 },
        'comp-low-freq-gain': { step: 1, min: -100, max: 100 },
        'comp-low-freq': { step: 1, min: 1, max: 10000 },
        'comp-pole': { step: 0.1, min: 1, max: 500 },
        'comp-zero': { step: 0.1, min: 1, max: 100 },
        'fb-gain': { step: 0.1, min: -20, max: 20 },
        'fb-zero': { step: 0.1, min: 0.001, max: 1000 },
        'fb-pole': { step: 0.1, min: 1, max: 1000 }
    };

    // Function to update slider limits dynamically
    function updateSliderLimits(inputId) {
        const minInput = document.getElementById(`${inputId}-min`);
        const maxInput = document.getElementById(`${inputId}-max`);
        const slider = document.getElementById(`${inputId}-slider`);
        const textBox = document.getElementById(inputId);

        if (!minInput || !maxInput || !slider || !textBox) return;

        let newMin = parseFloat(minInput.value);
        let newMax = parseFloat(maxInput.value);

        // Ensure min is less than max
        if (newMin >= newMax) {
            newMin = newMax - inputs[inputId].step;
            minInput.value = newMin;
        }

        // Update the inputs configuration
        inputs[inputId].min = newMin;
        inputs[inputId].max = newMax;

        // Update slider and text box attributes
        slider.min = newMin;
        slider.max = newMax;
        textBox.min = newMin;
        textBox.max = newMax;

        // Clamp the current value within the new range
        let currentValue = parseFloat(textBox.value) || 0;
        currentValue = Math.max(newMin, Math.min(newMax, currentValue));
        textBox.value = currentValue.toFixed(inputs[inputId].step === 1 ? 0 : 1);
        slider.value = currentValue;

        // Update hidden Hz field if applicable
        if (['plant-low-pole', 'plant-zero', 'plant-high-pole', 'comp-pole', 'comp-zero', 'fb-zero', 'fb-pole'].includes(inputId)) {
            updateHzField(inputId, `${inputId}-hz`);
        }

        debouncedUpdate();
    }

    // Event listeners for limit inputs
    const limitInputs = [
        'plant-gain', 'plant-low-pole', 'plant-zero', 'plant-high-pole',
        'comp-low-freq-gain', 'comp-low-freq', 'comp-pole', 'comp-zero',
        'fb-gain', 'fb-zero', 'fb-pole'
    ];

    limitInputs.forEach(id => {
        const minInput = document.getElementById(`${id}-min`);
        const maxInput = document.getElementById(`${id}-max`);

        if (minInput && maxInput) {
            minInput.addEventListener('input', () => updateSliderLimits(id));
            maxInput.addEventListener('input', () => updateSliderLimits(id));
        } else {
            console.error(`Limit input for ${id} not found`);
        }
    });

    const inputsList = [
        "plant-gain", "plant-gain-slider", "plant-low-pole", "plant-low-pole-slider",
        "plant-zero", "plant-zero-slider", "plant-high-pole", "plant-high-pole-slider",
        "comp-low-freq-gain", "comp-low-freq-gain-slider", "comp-low-freq", "comp-low-freq-slider",
        "comp-pole", "comp-pole-slider", "comp-zero", "comp-zero-slider",
        "fb-gain", "fb-gain-slider", "fb-zero", "fb-zero-slider", "fb-pole", "fb-pole-slider"
    ];

    inputsList.forEach(id => {
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
                    document.getElementById("comp-low-freq-gain-slider").value = value.toFixed(1);
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
                    document.getElementById("comp-low-freq-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "comp-low-freq-gain-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-low-freq-gain").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "comp-low-freq-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-low-freq").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "comp-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-pole").value = this.value;
                    updateHzField('comp-pole', 'comp-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "comp-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("comp-pole-slider").value = this.value;
                    updateHzField('comp-pole', 'comp-pole-hz');
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
                    updateHzField('comp-pole', 'comp-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "comp-zero-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("comp-zero").value = this.value;
                    updateHzField('comp-zero', 'comp-zero-hz');
                    debouncedUpdate();
                });
            } else if (id === "comp-zero") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("comp-zero-slider").value = this.value;
                    updateHzField('comp-zero', 'comp-zero-hz');
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
                    updateHzField('comp-zero', 'comp-zero-hz');
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
                    let minValue = parseFloat(this.min) || -20;
                    let maxValue = parseFloat(this.max) || 20;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-gain-slider").value = value.toFixed(1);
                    debouncedUpdate();
                });
            } else if (id === "fb-zero-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("fb-zero").value = this.value;
                    updateHzField('fb-zero', 'fb-zero-hz');
                    debouncedUpdate();
                });
            } else if (id === "fb-zero") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("fb-zero-slider").value = this.value;
                    updateHzField('fb-zero', 'fb-zero-hz');
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    if (this.disabled) return;
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    let minValue = parseFloat(this.min) || 0.001;
                    let maxValue = parseFloat(this.max) || 1000;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-zero-slider").value = value.toFixed(1);
                    updateHzField('fb-zero', 'fb-zero-hz');
                    debouncedUpdate();
                });
            } else if (id === "fb-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("fb-pole").value = this.value;
                    updateHzField('fb-pole', 'fb-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "fb-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("fb-pole-slider").value = this.value;
                    updateHzField('fb-pole', 'fb-pole-hz');
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    if (this.disabled) return;
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 1000;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-pole-slider").value = value.toFixed(1);
                    updateHzField('fb-pole', 'fb-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-gain-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("plant-gain").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "plant-gain") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("plant-gain-slider").value = this.value;
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 1;
                    let minValue = parseFloat(this.min) || -20;
                    let maxValue = parseFloat(this.max) || 20;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(0);
                    document.getElementById("plant-gain-slider").value = this.value;
                    debouncedUpdate();
                });
            } else if (id === "plant-low-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("plant-low-pole").value = this.value;
                    updateHzField('plant-low-pole', 'plant-low-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-low-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("plant-low-pole-slider").value = this.value;
                    updateHzField('plant-low-pole', 'plant-low-pole-hz');
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    let minValue = parseFloat(this.min) || 0.01;
                    let maxValue = parseFloat(this.max) || 10;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("plant-low-pole-slider").value = value.toFixed(1);
                    updateHzField('plant-low-pole', 'plant-low-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-zero-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("plant-zero").value = this.value;
                    updateHzField('plant-zero', 'plant-zero-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-zero") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("plant-zero-slider").value = this.value;
                    updateHzField('plant-zero', 'plant-zero-hz');
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 1;
                    let minValue = parseFloat(this.min) || 1;
                    let maxValue = parseFloat(this.max) || 100;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(0);
                    document.getElementById("plant-zero-slider").value = this.value;
                    updateHzField('plant-zero', 'plant-zero-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-high-pole-slider") {
                element.addEventListener("input", function() {
                    console.log(`Slider ${id} changed to ${this.value}`);
                    document.getElementById("plant-high-pole").value = this.value;
                    updateHzField('plant-high-pole', 'plant-high-pole-hz');
                    debouncedUpdate();
                });
            } else if (id === "plant-high-pole") {
                element.addEventListener("input", function() {
                    console.log(`Input ${id} changed to ${this.value}`);
                    document.getElementById("plant-high-pole-slider").value = this.value;
                    updateHzField('plant-high-pole', 'plant-high-pole-hz');
                    debouncedUpdate();
                });
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 1;
                    let minValue = parseFloat(this.min) || 10;
                    let maxValue = parseFloat(this.max) || 500;
                    if (event.deltaY < 0 && value + step <= maxValue) value += step;
                    else if (event.deltaY > 0 && value - step >= minValue) value -= step;
                    this.value = value.toFixed(0);
                    document.getElementById("plant-high-pole-slider").value = this.value;
                    updateHzField('plant-high-pole', 'plant-high-pole-hz');
                    debouncedUpdate();
                });
            } else {
                element.addEventListener("input", () => debouncedUpdate());
            }
        } else {
            console.error(`Element with ID "${id}" not found`);
        }
    });

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

    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        resetButton.addEventListener("click", function() {
            // Reset Plant
            document.getElementById("plant-gain").value = "0";
            document.getElementById("plant-gain-slider").value = "0";
            document.getElementById("plant-low-pole").value = "1";
            document.getElementById("plant-low-pole-slider").value = "1";
            document.getElementById("plant-zero").value = "20";
            document.getElementById("plant-zero-slider").value = "20";
            document.getElementById("plant-high-pole").value = "100";
            document.getElementById("plant-high-pole-slider").value = "100";
            updateHzField('plant-low-pole', 'plant-low-pole-hz');
            updateHzField('plant-zero', 'plant-zero-hz');
            updateHzField('plant-high-pole', 'plant-high-pole-hz');

            // Reset Plant Limits
            document.getElementById("plant-gain-min").value = "-20";
            document.getElementById("plant-gain-max").value = "20";
            document.getElementById("plant-low-pole-min").value = "0.01";
            document.getElementById("plant-low-pole-max").value = "10";
            document.getElementById("plant-zero-min").value = "1";
            document.getElementById("plant-zero-max").value = "100";
            document.getElementById("plant-high-pole-min").value = "10";
            document.getElementById("plant-high-pole-max").value = "500";

            // Reset Compensator
            document.getElementById("comp-low-freq-gain").value = "60";
            document.getElementById("comp-low-freq-gain-slider").value = "60";
            document.getElementById("comp-low-freq").value = "100";
            document.getElementById("comp-low-freq-slider").value = "100";
            document.getElementById("comp-pole").value = "100";
            document.getElementById("comp-pole-slider").value = "100";
            document.getElementById("comp-zero").value = "10";
            document.getElementById("comp-zero-slider").value = "10";
            updateHzField('comp-pole', 'comp-pole-hz');
            updateHzField('comp-zero', 'comp-zero-hz');

            // Reset Compensator Limits
            document.getElementById("comp-low-freq-gain-min").value = "-100";
            document.getElementById("comp-low-freq-gain-max").value = "100";
            document.getElementById("comp-low-freq-min").value = "1";
            document.getElementById("comp-low-freq-max").value = "10000";
            document.getElementById("comp-pole-min").value = "1";
            document.getElementById("comp-pole-max").value = "500";
            document.getElementById("comp-zero-min").value = "1";
            document.getElementById("comp-zero-max").value = "100";

            // Reset Feedback
            document.getElementById("fb-gain").value = "0";
            document.getElementById("fb-gain-slider").value = "0";
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
            updateHzField('fb-zero', 'fb-zero-hz');
            updateHzField('fb-pole', 'fb-pole-hz');

            // Reset Feedback Limits
            document.getElementById("fb-gain-min").value = "-20";
            document.getElementById("fb-gain-max").value = "20";
            document.getElementById("fb-zero-min").value = "0.001";
            document.getElementById("fb-zero-max").value = "1000";
            document.getElementById("fb-pole-min").value = "1";
            document.getElementById("fb-pole-max").value = "1000";

            // Reset the inputs configuration
            inputs = {
                'plant-gain': { step: 1, min: -20, max: 20 },
                'plant-low-pole': { step: 0.1, min: 0.01, max: 10 },
                'plant-zero': { step: 1, min: 1, max: 100 },
                'plant-high-pole': { step: 1, min: 10, max: 500 },
                'comp-low-freq-gain': { step: 1, min: -100, max: 100 },
                'comp-low-freq': { step: 1, min: 1, max: 10000 },
                'comp-pole': { step: 0.1, min: 1, max: 500 },
                'comp-zero': { step: 0.1, min: 1, max: 100 },
                'fb-gain': { step: 0.1, min: -20, max: 20 },
                'fb-zero': { step: 0.1, min: 0.001, max: 1000 },
                'fb-pole': { step: 0.1, min: 1, max: 1000 }
            };

            // Update all sliders with default limits
            limitInputs.forEach(id => updateSliderLimits(id));

            console.log("Reset to default values, triggering update");
            debouncedUpdate();
        });
    } else {
        console.error("reset-button element not found");
    }

    function initializeCharts() {
        console.log("Attempting to initialize charts...");
        console.log("Document readyState:", document.readyState);
        console.log("updateCharts available:", typeof updateCharts);

        if (document.readyState === "complete" && typeof updateCharts === "function") {
            console.log("Document fully loaded and updateCharts is ready, running initial update");
            updateFeedbackNetwork();
        } else {
            console.log("Document not fully loaded or updateCharts not ready, retrying...");
            setTimeout(initializeCharts, 100);
        }
    }

    if (document.readyState === "complete") {
        console.log("Document already loaded, initializing charts immediately");
        initializeCharts();
    } else {
        console.log("Waiting for window.onload to initialize charts");
        window.onload = function() {
            console.log("window.onload triggered, initializing charts");
            initializeCharts();
        };
    }
});