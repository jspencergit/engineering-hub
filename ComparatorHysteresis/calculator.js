function calculateHysteresis(params) {
  const { type, vcc, vref, vhb, vthr, r4, ir3 } = params;
  let r1, r2, r3, vthrCalc, vthf, hysteresis;

  // Step 1: Calculate R3
  const ir3A = ir3 * 1e-6; // Convert µA to A
  let r3_1 = vref / ir3A;
  let r3_2;
  if (type === 'push-pull') {
    r3_2 = (vcc - vref) / ir3A;
  } else {
    r3_2 = (vcc - vref) / ir3A - (r4 * 1e6); // R4 in Ω
  }
  r3 = Math.min(r3_1, r3_2) / 1e6; // Convert to MΩ

  // Step 2: Hysteresis band (already provided as vhb in mV)

  // Step 3: Calculate R1
  const vhbV = vhb / 1000; // Convert mV to V
  if (type === 'push-pull') {
    r1 = r3 * 1e6 * (vhbV / vcc) / 1e3; // Convert to kΩ
  } else {
    r1 = ((r3 * 1e6) + (r4 * 1e6)) * (vhbV / vcc) / 1e3; // Convert to kΩ
  }

  // Step 4: Rising trip point (already provided as vthr)

  // Step 5: Calculate R2 (Corrected)
  const r1Ohms = r1 * 1e3; // Convert R1 to ohms
  const r3Ohms = r3 * 1e6; // Convert R3 to ohms
  const parallelTerm = (vthr / (vref * r1Ohms)) - (1 / r1Ohms) - (1 / r3Ohms);
  r2 = (1 / parallelTerm) / 1e3; // Convert to kΩ

  // Step 6: Verify trip voltages
  const parallelRes = 1 / ((1 / r1Ohms) + (1 / (r2 * 1e3)) + (1 / r3Ohms));
  vthrCalc = vref * (parallelRes / r1Ohms);
  if (type === 'push-pull') {
    vthf = vthrCalc - (r1Ohms * vcc / r3Ohms);
  } else {
    vthf = vref * (parallelRes / r1Ohms) - (r1Ohms / (r3Ohms + (r4 * 1e6))) * vcc;
  }
  hysteresis = (vthrCalc - vthf) * 1000; // Convert to mV

  return { r1, r2, r3, vthrCalc, vthf, hysteresis };
}

function validateInputs(params) {
  const { vcc, vref, vhb, vthr } = params;
  const vhbV = vhb / 1000; // Convert mV to V
  const minVthr = vref * (1 + (vhbV / vcc));

  if (vref > vcc) return "Vref must be less than or equal to Vcc.";
  if (vthr < minVthr) return `Vthr must be greater than ${minVthr.toFixed(3)} V.`;
  if (vcc <= 0 || vref < 0 || vhb <= 0 || vthr <= 0) return "All inputs must be positive.";
  return null;
}