// feedback-network/calculator.js
function calculateFeedbackNetwork() {
    // Get input values and convert units
    let plantGain = Math.pow(10, parseFloat(document.getElementById("plant-gain").value) / 20); // dB to linear
    let plantPole = parseFloat(document.getElementById("plant-pole").value) * 1000; // kHz to Hz
    let plantZero = parseFloat(document.getElementById("plant-zero").value) * 1000; // kHz to Hz

    let compGain = Math.pow(10, parseFloat(document.getElementById("comp-gain").value) / 20); // dB to linear
    let compPole = parseFloat(document.getElementById("comp-pole").value) * 1000; // kHz to Hz
    let compZero = parseFloat(document.getElementById("comp-zero").value) * 1000; // kHz to Hz

    let fbGain = Math.pow(10, parseFloat(document.getElementById("fb-gain").value) / 20); // dB to linear
    let fbZero = document.getElementById("fb-zero-check").checked ? parseFloat(document.getElementById("fb-zero").value) * 1000 : null;
    let fbPole = document.getElementById("fb-pole-check").checked ? parseFloat(document.getElementById("fb-pole").value) * 1000 : null;

    console.log("Feedback inputs:", { fbGain, fbZero, fbPole }); // Debug log
    console.log("Compensator inputs:", { compGain, compZero, compPole }); // Debug log

    // Frequency range
    let xMin = 0.1 * 1000; // 0.1 kHz to Hz
    let xMax = 1000 * 1000; // 1000 kHz to Hz

    // Generate frequency array
    let freqs = [];
    let logMin = Math.log10(xMin);
    let logMax = Math.log10(xMax);
    for (let logF = logMin; logF <= logMax; logF += (logMax - logMin) / 100) {
        freqs.push(Math.pow(10, logF) / 1000); // Hz to kHz for labels
    }

    // Calculate Bode data for each block
    let plantMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // Hz to rad/s
        let mag = plantGain * (1 + w / (2 * Math.PI * plantZero)) / (1 + w / (2 * Math.PI * plantPole));
        return 20 * Math.log10(mag);
    });

    let compMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // Hz to rad/s
        let mag = compGain * (1 + w / (2 * Math.PI * compZero)) / (1 + w / (2 * Math.PI * compPole));
        return 20 * Math.log10(mag);
    });

    let fbMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let mag = fbGain; // Apply gain first
        if (fbZero) mag *= (1 + w / (2 * Math.PI * fbZero));
        if (fbPole) mag /= (1 + w / (2 * Math.PI * fbPole));
        return 20 * Math.log10(mag > 0 ? mag : 0);
    });

    let closedMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let openLoop = plantMags[freqs.indexOf(f)] + compMags[freqs.indexOf(f)] - fbMags[freqs.indexOf(f)];
        let loopGain = Math.pow(10, openLoop / 20); // Convert dB to linear
        let closedLoopGain = loopGain / (1 + loopGain); // Basic feedback formula
        return 20 * Math.log10(closedLoopGain > 0 ? closedLoopGain : 0);
    });

    // Phase calculations
    let plantPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phaseZero = Math.atan(w / (2 * Math.PI * plantZero));
        let phasePole = -Math.atan(w / (2 * Math.PI * plantPole));
        return (phaseZero + phasePole) * 180 / Math.PI;
    });

    let compPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phaseZero = Math.atan(w / (2 * Math.PI * compZero));
        let phasePole = -Math.atan(w / (2 * Math.PI * compPole));
        return (phaseZero + phasePole) * 180 / Math.PI;
    });

    let fbPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phase = 0;
        if (fbZero) phase += Math.atan(w / (2 * Math.PI * fbZero));
        if (fbPole) phase -= Math.atan(w / (2 * Math.PI * fbPole));
        return phase * 180 / Math.PI;
    });

    let closedPhases = freqs.map(f => {
        let phase = plantPhases[freqs.indexOf(f)] + compPhases[freqs.indexOf(f)] - fbPhases[freqs.indexOf(f)];
        return phase;
    });

    // Placeholder bandwidth and phase margin
    let bandwidth = 100; // kHz (to be calculated later)
    let phaseMargin = 45; // degrees (to be calculated later)

    return {
        freqs,
        plantMags, plantPhases,
        compMags, compPhases,
        fbMags, fbPhases,
        closedMags, closedPhases,
        bandwidth, phaseMargin
    };
}
