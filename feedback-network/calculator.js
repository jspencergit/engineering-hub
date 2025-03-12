// feedback-network/calculator.js
function calculateFeedbackNetwork() {
    // Get input values and convert units
    let plantGain = Math.pow(10, parseFloat(document.getElementById("plant-gain").value) / 20); // dB to linear
    let plantLowPole = parseFloat(document.getElementById("plant-low-pole").value); // Hz
    let plantZero = parseFloat(document.getElementById("plant-zero").value) * 1000; // kHz to Hz
    let plantHighPole = parseFloat(document.getElementById("plant-high-pole").value) * 1000; // kHz to Hz

    let compLowFreqGain = Math.pow(10, parseFloat(document.getElementById("comp-low-freq-gain").value) / 20); // dB to linear
    let compLowFreq = parseFloat(document.getElementById("comp-low-freq").value); // Hz
    let compPole = parseFloat(document.getElementById("comp-pole").value) * 1000; // kHz to Hz
    let compZero = parseFloat(document.getElementById("comp-zero").value) * 1000; // kHz to Hz

    let fbGain = Math.pow(10, parseFloat(document.getElementById("fb-gain").value) / 20); // dB to linear
    let fbZero = document.getElementById("fb-zero-check").checked ? parseFloat(document.getElementById("fb-zero").value) * 1000 : null;
    let fbPole = document.getElementById("fb-pole-check").checked ? parseFloat(document.getElementById("fb-pole").value) * 1000 : null;

    console.log("Feedback inputs:", { fbGain, fbZero, fbPole }); // Debug log
    console.log("Compensator inputs:", { compLowFreqGain, compLowFreq, compPole, compZero }); // Debug log
    console.log("Plant inputs:", { plantGain, plantLowPole, plantZero, plantHighPole }); // Debug log

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

    // Calculate the gain factor to match compLowFreqGain at compLowFreq
    let wLowFreq = 2 * Math.PI * compLowFreq;
    let K = compLowFreqGain * wLowFreq; // Gain factor for compensator
    console.log("Calculated gain factor K:", K);

    // Calculate Bode data for each block
    let plantMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // Hz to rad/s
        let mag = plantGain * (1 + w / (2 * Math.PI * plantZero)) / ((1 + w / (2 * Math.PI * plantLowPole)) * (1 + w / (2 * Math.PI * plantHighPole)));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001);
    });

    let plantPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phasePole1 = -Math.atan(w / (2 * Math.PI * plantLowPole));
        let phaseZero = Math.atan(w / (2 * Math.PI * plantZero));
        let phasePole2 = -Math.atan(w / (2 * Math.PI * plantHighPole));
        return (phasePole1 + phaseZero + phasePole2) * 180 / Math.PI;
    });

    let compMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // Hz to rad/s
        let mag = (K / w) * (1 + w / (2 * Math.PI * compZero)) / (1 + w / (2 * Math.PI * compPole));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001);
    });

    let compPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phase = -Math.PI / 2; // Phase contribution from 1/s (integrator)
        phase += Math.atan(w / (2 * Math.PI * compZero));
        phase -= Math.atan(w / (2 * Math.PI * compPole));
        return phase * 180 / Math.PI;
    });

    let fbMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let mag = fbGain; // Apply gain once
        if (fbZero) mag *= (1 + w / (2 * Math.PI * fbZero));
        if (fbPole) mag /= (1 + w / (2 * Math.PI * fbPole));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001); // Fixed: no double fbGain
    });

    let fbPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000;
        let phase = 0;
        if (fbZero) phase += Math.atan(w / (2 * Math.PI * fbZero));
        if (fbPole) phase -= Math.atan(w / (2 * Math.PI * fbPole));
        return phase * 180 / Math.PI;
    });

    // Calculate loop gain L(s) = P(s) C(s) F(s)
    let closedMags = [];
    let closedPhases = [];
    for (let i = 0; i < freqs.length; i++) {
        // Loop gain magnitude (sum in dB)
        let loopGainMag = plantMags[i] + compMags[i] + fbMags[i];

        // Loop gain phase (sum of phases - 180° for negative feedback)
        let loopGainPhase = plantPhases[i] + compPhases[i] + fbPhases[i] - 180;

        closedMags.push(loopGainMag);
        closedPhases.push(loopGainPhase);
    }

    // Placeholder bandwidth and phase margin (to be calculated later)
    let bandwidth = 100; // kHz
    let phaseMargin = 45; // degrees

    let result = {
        freqs,
        plantMags, plantPhases,
        compMags, compPhases,
        compZero: compZero / 1000, // kHz for charting
        compPole: compPole / 1000, // kHz for charting
        fbMags, fbPhases,
        closedMags, closedPhases,
        bandwidth, phaseMargin
    };
    console.log("calcData sample:", {
        freqs: result.freqs.slice(0, 5),
        plantMags: result.plantMags.slice(0, 5),
        closedMags: result.closedMags.slice(0, 5),
        closedPhases: result.closedPhases.slice(0, 5)
    });
    return result;
}