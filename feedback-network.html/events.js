// feedback-network/events.js

document.addEventListener("DOMContentLoaded", function() {
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
            const fbGain = parseFloat(document.getElementById("fb-gain").value) || 0;
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
            const fbTfElement = document.getElementById("fb-tf");
            if (fbTfElement) {
                fbTfElement.innerHTML = `\\(${fbTf}\\)`;
                if (typeof MathJax !== "undefined" && MathJax.Hub) {
                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, fbTfElement]);
                }
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

    // Event listeners for inputs
    const inputs = [
        "plant-gain", "plant-pole", "plant-zero",
        "comp-gain", "comp-pole", "comp-zero",
        "fb-gain", "fb-gain-slider", "fb-zero", "fb-pole", "update-btn"
    ];

    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === "update-btn") {
                element.addEventListener("click", updateFeedbackNetwork);
            } else if (id === "fb-gain-slider") {
                element.addEventListener("input", function() {
                    document.getElementById("fb-gain").value = this.value;
                    updateFeedbackNetwork();
                });
            } else if (id === "fb-gain") {
                element.addEventListener("wheel", function(event) {
                    event.preventDefault();
                    let value = parseFloat(this.value) || 0;
                    let step = 0.1;
                    if (event.deltaY < 0) value += step;
                    else if (value - step >= -20) value -= step;
                    this.value = value.toFixed(1);
                    document.getElementById("fb-gain-slider").value = value.toFixed(1);
                    updateFeedbackNetwork();
                });
            } else {
                element.addEventListener("input", updateFeedbackNetwork);
            }
        } else {
            console.error(`Element with ID "${id}" not found`);
        }
    });

    // Checkbox event listeners
    const fbZeroCheck = document.getElementById("fb-zero-check");
    const fbPoleCheck = document.getElementById("fb-pole-check");
    if (fbZeroCheck) {
        fbZeroCheck.addEventListener("change", function() {
            document.getElementById("fb-zero").disabled = !this.checked;
            updateFeedbackNetwork();
        });
    }
    if (fbPoleCheck) {
        fbPoleCheck.addEventListener("change", function() {
            document.getElementById("fb-pole").disabled = !this.checked;
            updateFeedbackNetwork();
        });
    }

    // Initial update
    updateFeedbackNetwork();
});
