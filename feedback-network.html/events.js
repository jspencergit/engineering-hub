// feedback-network/events.js

function updateFeedbackNetwork() {
    const calcData = calculateFeedbackNetwork(); // From calculator.js

    // Update DOM elements
    document.getElementById("bw-output").textContent = calcData.bandwidth.toFixed(1);
    document.getElementById("pm-output").textContent = calcData.phaseMargin.toFixed(1);

    // Update charts
    updateCharts(calcData); // From charts.js
}

// Event listeners for inputs
document.getElementById("plant-gain").addEventListener("input", updateFeedbackNetwork);
document.getElementById("plant-pole").addEventListener("input", updateFeedbackNetwork);
document.getElementById("plant-zero").addEventListener("input", updateFeedbackNetwork);
document.getElementById("comp-gain").addEventListener("input", updateFeedbackNetwork);
document.getElementById("comp-pole").addEventListener("input", updateFeedbackNetwork);
document.getElementById("comp-zero").addEventListener("input", updateFeedbackNetwork);
document.getElementById("fb-gain").addEventListener("input", updateFeedbackNetwork);

// Event listener for update button
document.getElementById("update-btn").addEventListener("click", updateFeedbackNetwork);

// Initial update
updateFeedbackNetwork();
