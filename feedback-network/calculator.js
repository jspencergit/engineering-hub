//feedback-network/calculator.js
function calculateFeedbackNetwork() {
    // Get input values and convert units to Hz
    let plantGain = Math.pow(10, parseFloat(document.getElementById("plant-gain").value) / 20); // dB to linear
    let plantLowPole = parseFloat(document.getElementById("plant-low-pole-hz").value); // Hz (from hidden field)
    let plantZero = parseFloat(document.getElementById("plant-zero-hz").value); // Hz (from hidden field)
    let plantHighPole = parseFloat(document.getElementById("plant-high-pole-hz").value); // Hz (from hidden field)

    let compLowFreqGain = Math.pow(10, parseFloat(document.getElementById("comp-low-freq-gain").value) / 20); // dB to linear
    let compLowFreq = parseFloat(document.getElementById("comp-low-freq").value); // Hz
    let compPole = parseFloat(document.getElementById("comp-pole-hz").value); // Hz (from hidden field)
    let compZero = parseFloat(document.getElementById("comp-zero-hz").value); // Hz (from hidden field)

    let fbGain = Math.pow(10, parseFloat(document.getElementById("fb-gain").value) / 20); // dB to linear
    let fbZero = document.getElementById("fb-zero-check").checked ? parseFloat(document.getElementById("fb-zero-hz").value) : null; // Hz (from hidden field)
    let fbPole = document.getElementById("fb-pole-check").checked ? parseFloat(document.getElementById("fb-pole-hz").value) : null; // Hz (from hidden field)

    console.log("Feedback inputs:", { fbGain, fbZero, fbPole }); // Debug log
    console.log("Compensator inputs:", { compLowFreqGain, compLowFreq, compPole, compZero }); // Debug log
    console.log("Plant inputs:", { plantGain, plantLowPole, plantZero, plantHighPole }); // Debug log

    // Frequency range in Hz
    let xMin = 0.1 * 1000; // 0.1 kHz = 100 Hz
    let xMax = 1000 * 1000; // 1000 kHz = 1000000 Hz

    // Generate frequency array in Hz, convert to kHz for labels
    let freqs = [];
    let logMin = Math.log10(xMin);
    let logMax = Math.log10(xMax);
    for (let logF = logMin; logF <= logMax; logF += (logMax - logMin) / 100) {
        freqs.push(Math.pow(10, logF) / 1000); // Store as kHz for chart labels
    }

    // Calculate the gain factor to match compLowFreqGain at compLowFreq
    let wLowFreq = 2 * Math.PI * compLowFreq;
    let K = compLowFreqGain * wLowFreq; // Gain factor for compensator
    console.log("Calculated gain factor K:", K);

    // Calculate Bode data for each block
    let plantMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000 = rad/s
        let mag = plantGain * (1 + w / (2 * Math.PI * plantZero)) / ((1 + w / (2 * Math.PI * plantLowPole)) * (1 + w / (2 * Math.PI * plantHighPole)));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001);
    });

    let plantPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000
        let phasePole1 = -Math.atan(w / (2 * Math.PI * plantLowPole));
        let phaseZero = Math.atan(w / (2 * Math.PI * plantZero));
        let phasePole2 = -Math.atan(w / (2 * Math.PI * plantHighPole));
        return (phasePole1 + phaseZero + phasePole2) * 180 / Math.PI;
    });

    let compMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000
        let mag = (K / w) * (1 + w / (2 * Math.PI * compZero)) / (1 + w / (2 * Math.PI * compPole));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001);
    });

    let compPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000
        let phase = -Math.PI / 2; // Phase contribution from 1/s (integrator)
        phase += Math.atan(w / (2 * Math.PI * compZero));
        phase -= Math.atan(w / (2 * Math.PI * compPole));
        return phase * 180 / Math.PI;
    });

    let fbMags = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000
        let mag = fbGain; // Apply gain once
        if (fbZero) mag *= (1 + w / (2 * Math.PI * fbZero));
        if (fbPole) mag /= (1 + w / (2 * Math.PI * fbPole));
        return 20 * Math.log10(mag > 0 ? mag : 0.0001);
    });

    let fbPhases = freqs.map(f => {
        let w = 2 * Math.PI * f * 1000; // f in kHz, convert to Hz * 1000
        let phase = 0;
        if (fbZero) phase += Math.atan(w / (2 * Math.PI * fbZero));
        if (fbPole) phase -= Math.atan(w / (2 * Math.PI * fbPole));
        return phase * 180 / Math.PI;
    });

    // Calculate loop gain L(s) = P(s) * C(s) * F(s)
    let closedMags = [];
    let closedPhases = [];
    for (let i = 0; i < freqs.length; i++) {
        let loopGainMag = plantMags[i] + compMags[i] + fbMags[i]; // Sum in dB
        let loopGainPhase = plantPhases[i] + compPhases[i] + fbPhases[i] - 180; // Sum phases - 180° for negative feedback
        closedMags.push(loopGainMag);
        closedPhases.push(loopGainPhase);
    }

    // Placeholder bandwidth and phase margin (to be calculated later in charts.js)
    let bandwidth = 100; // kHz
    let phaseMargin = 45; // degrees

    let result = {
        freqs,
        plantMags, plantPhases,
        compMags, compPhases,
        compZero: compZero / 1000, // Convert back to kHz for charting
        compPole: compPole / 1000, // Convert back to kHz for charting
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