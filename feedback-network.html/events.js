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

            // Update transfer functions
            const fbGainInput = document.getElementById("fb-gain");
            const fbGain = parseFloat(fbGainInput.value) || parseFloat(fbGainInput.getAttribute("value")) || 0;
            const fbZeroCheck = document.getElementById("fb-zero-check").checked;
            const fbZero = fbZeroCheck ? parseFloat(document.getElementById("fb-zero").value) * 1000 : null;
            const fbPoleCheck = document.getElementById("fb-pole-check").checked;
            const fbPole = fbPoleCheck ? parseFloat(document.getElementById("fb-pole").value) * 1000 : null;

            console.log("Feedback checks:", { fbGain, fbZeroCheck, fbZero, fbPoleCheck, fbPole }); // Debug log

            let fbTf = `F(s) = ${fbGain.toFixed(1)}`;
            if (fbZeroCheck && fbPoleCheck) {
                fbTf += ` \\cdot \\frac{1 + \\frac{s}{2\\pi \\cdot ${(fbZero / 1000).toFixed(1)} \\text{kHz}}}{1 + \\frac{s}{2\\pi \\cdot ${(fbPole / 1000).toFixed(1)} \\text{kHz}}}`;
            } else if (fbZeroCheck) {
                fbTf += ` \\cdot \\left(1 + \\frac{s}{2\\pi \\cdot ${(fbZero / 1000).toFixed(1)} \\text{kHz}}\\right)`;
            } else if (fbPoleCheck) {
                fbTf += ` \\cdot \\frac{1}{1 + \\frac{s}{2\\pi \\cdot ${(fbPole / 1000).toFixed(1)} \\text{kHz}}}`;
            }

            // Update transfer function below feedback inputs
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

            // Update transfer function near the graph
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
        "plant-gain", "plant-pole", "plant-zero",
        "comp-gain", "comp-pole", "comp-zero",
        "fb-gain", "fb-gain-slider", "fb-zero", "fb-zero-slider", "fb-pole", "fb-pole-slider"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === "fb-gain-slider") {
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
            fbZero.disabled = !this.checked;
            fbZeroSlider.disabled = !this.checked;
            debouncedUpdate();
        });
    }
    if (fbPoleCheck) {
        fbPoleCheck.addEventListener("change", function() {
            const fbPole = document.getElementById("fb-pole");
            const fbPoleSlider = document.getElementById("fb-pole-slider");
            fbPole.disabled = !this.checked;
            fbPoleSlider.disabled = !this.checked;
            debouncedUpdate();
        });
    }

    // Initial update
    updateFeedbackNetwork();
});