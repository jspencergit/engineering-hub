// calculator.js
function calculateCompensator() {
    // Get input values from the DOM and convert units
    let rth = parseFloat(document.getElementById("rth").value) * 1000; // kΩ to Ω
    let cth = parseFloat(document.getElementById("cth").value) * 1e-12; // pF to F
    let cthp = parseFloat(document.getElementById("cthp").value) * 1e-12; // pF to F
    let gm = parseFloat(document.getElementById("gm").value) * 1e-3; // mS to S
    let ro = parseFloat(document.getElementById("ro").value) * 1000; // kΩ to Ω
    let xMin = parseFloat(document.getElementById("x-min").value) * 1000; // kHz to Hz
    let xMax = parseFloat(document.getElementById("x-max").value) * 1000; // kHz to Hz

    // Calculate poles and zeros (in kHz)
    let fz1 = 1 / (2 * Math.PI * rth * cth) / 1000; // Zero in kHz
    let fp2 = (cth + cthp) / (2 * Math.PI * rth * cth * cthp) / 1000; // High-frequency pole in kHz
    let fp0 = 1 / (2 * Math.PI * ro * cth) / 1000; // Low-frequency pole in kHz

    // Calculate low-frequency gain in dB
    let lowFreqGain = gm * ro; // Linear gain
    let gainDb = 20 * Math.log10(lowFreqGain); // Convert to dB

    // Calculate phase boost
    let fBoost = Math.sqrt(fz1 * fp2 * 1e6) / 1000; // Geometric mean in kHz
    let wBoost = 2 * Math.PI * fBoost * 1000;
    let phaseBoost = Math.atan(wBoost / (2 * Math.PI * fz1 * 1000)) * 180 / Math.PI - 
                    Math.atan(wBoost / (2 * Math.PI * fp2 * 1000)) * 180 / Math.PI;

    // Generate frequency array and Bode plot data
    let freqs = [];
    let mags = [];
    let phases = [];
    let logMin = Math.log10(xMin);
    let logMax = Math.log10(xMax);
    for (let logF = logMin; logF <= logMax; logF += (logMax - logMin) / 100) {
        let f = Math.pow(10, logF);
        let w = 2 * Math.PI * f;
        let numMag = Math.sqrt(1 + Math.pow(w / (2 * Math.PI * fz1 * 1000), 2));
        let denMag = Math.sqrt(1 + Math.pow(w / (2 * Math.PI * fp0 * 1000), 2)) * 
                     Math.sqrt(1 + Math.pow(w / (2 * Math.PI * fp2 * 1000), 2));
        let mag = lowFreqGain * numMag / denMag;
        let db = 20 * Math.log10(mag);
        let phaseZero = Math.atan(w / (2 * Math.PI * fz1 * 1000)) * 180 / Math.PI;
        let phasePole0 = -Math.atan(w / (2 * Math.PI * fp0 * 1000)) * 180 / Math.PI;
        let phasePole2 = -Math.atan(w / (2 * Math.PI * fp2 * 1000)) * 180 / Math.PI;
        let phase = phaseZero + phasePole0 + phasePole2;
        freqs.push(f / 1000); // Hz to kHz
        mags.push(db);
        phases.push(phase);
    }

    // Return all calculated values
    return {
        rth, cth, cthp, gm, ro, xMin, xMax,
        fz1, fp2, fp0, gainDb,
        phaseBoost, fBoost,
        freqs, mags, phases
    };
}
