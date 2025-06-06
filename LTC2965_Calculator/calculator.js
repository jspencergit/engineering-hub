/* calculator.js */
const V_REF = 2.402; // Typical reference voltage from datasheet
const V_HYS_10X = 0.22; // Built-in hysteresis for 10x range (V)
const V_HYS_40X = 0.88; // Built-in hysteresis for 40x range (V)
const V_OS = 0.003; // Comparator offset, max (V)
const A_VERR = 0.004; // Internal divider range error, max
const DELTA_V_REF = 0.024; // REF voltage variation, max (V)

function findClosestStandardValue(resistor) {
  const standardValues = [
    10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39,
    43, 47, 51, 56, 62, 68, 75, 82, 91, 100, 110, 120, 130, 150, 160, 180,
    200, 220, 240, 270, 300, 330, 360, 390, 430, 470, 510, 560, 620, 680,
    750, 820, 910
  ];
  const magnitude = Math.floor(Math.log10(resistor));
  const scale = Math.pow(10, magnitude - 2);
  const normalized = resistor / scale;
  let closest = standardValues[0];
  let minDiff = Math.abs(normalized - closest);
  for (let val of standardValues) {
    const diff = Math.abs(normalized - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }
  return closest * scale;
}

function calculateValues() {
  const range = parseFloat(document.getElementById('range').value);
  const polarity = document.getElementById('polarity').value;
  const hysteresis = document.getElementById('hysteresis').value;
  const vRise = parseFloat(document.getElementById('vRise').value);
  const vFall = parseFloat(document.getElementById('vFall').value);
  const rSum = parseFloat(document.getElementById('rSum').value) * 1e6; // Convert MΩ to Ω
  const tolerance = parseFloat(document.getElementById('tolerance').value) / 100;

  // Validate thresholds against range
  const vMin = range === 10 ? 3.5 : 14;
  const vMax = range === 10 ? 24.5 : 98;
  if (vRise < vMin || vRise > vMax || vFall < vMin || vFall > vMax) {
    alert(`Thresholds must be between ${vMin}V and ${vMax}V for the selected range.`);
    return null;
  }
  if (hysteresis === 'external' && vFall > vRise) {
    alert('Falling threshold must be less than rising threshold for external hysteresis.');
    return null;
  }

  // Calculate INH and INL
  let vInh, vInl;
  const vHys = range === 10 ? V_HYS_10X : V_HYS_40X;
  if (hysteresis === 'external') {
    vInh = vRise / range;
    vInl = vFall / range;
  } else if (hysteresis === 'rising') {
    vInl = vFall / range;
    vInh = (vRise - vHys) / range;
  } else { // falling
    vInh = vRise / range;
    vInl = (vFall + vHys) / range;
  }

  // Validate INH and INL against V_CM (0.35V to 2.45V)
  if (vInh < 0.35 || vInh > 2.45 || vInl < 0.35 || vInl > 2.45) {
    alert('Calculated INH or INL voltages are outside the valid range (0.35V to 2.45V). Adjust thresholds or range.');
    return null;
  }

  // Calculate resistors (three-resistor configuration)
  let r1 = (vInl * rSum) / V_REF;
  r1 = findClosestStandardValue(r1);
  let r2 = (vInh * rSum) / V_REF - r1;
  r2 = findClosestStandardValue(r2);
  let r3 = rSum - r1 - r2;
  r3 = findClosestStandardValue(r3);

  // Recalculate actual thresholds
  const vInhActual = V_REF * (r1 + r2) / (r1 + r2 + r3);
  const vInlActual = V_REF * r1 / (r1 + r2 + r3);
  const vRiseActual = range * (hysteresis === 'rising' ? vInlActual + vHys : vInhActual);
  const vFallActual = range * (hysteresis === 'falling' ? vInhActual - vHys : vInlActual);

  // Error analysis
  const vErrRef = range * DELTA_V_REF * (vInlActual / V_REF);
  const aXerr = 2 * tolerance * (1 - vInlActual / V_REF);
  const vErrExt = range * vInlActual * aXerr;
  const vErrVos = range * V_OS;
  const vErrRs = range * A_VERR * vInlActual;
  const vErr = Math.sqrt(vErrRef ** 2 + vErrExt ** 2 + vErrVos ** 2 + vErrRs ** 2);
  const vErrPercent = (vErr / vFallActual) * 100;

  return {
    range,
    polarity,
    hysteresis,
    vRise,
    vFall,
    rSum,
    tolerance,
    vRiseActual,
    vFallActual,
    r1,
    r2,
    r3,
    vErr,
    vErrPercent
  };
}

function generateAscFile(results) {
  if (!results) return;
  const { range, polarity, r1, r2, r3, vRiseActual, vFallActual } = results;
  
  // Set V_PS and V_RS based on polarity and range
  const vPs = polarity === 'noninverting' ? 0 : 3.3;
  const vRs = range === 10 ? 0 : 3.3;
  
  // Define V_IN sweep: match good file's PWL structure with integers or single-decimal
  const vMax = Math.round(vRiseActual + 3); // e.g., 23 for vRiseActual = 20.01
  const vMid = Number(((vRiseActual + vFallActual) / 2).toFixed(1)); // e.g., 19.1 for vRiseActual = 20.01, vFallActual = 18.19
  const vLow = Math.round(vFallActual - 1); // e.g., 17 for vFallActual = 18.19
  const ascContent = `Version 4
SHEET 1 880 680
WIRE 224 -112 -720 -112
WIRE -720 -96 -720 -112
WIRE 224 -16 224 -112
WIRE 512 -16 448 -16
WIRE 576 -16 512 -16
WIRE -720 0 -720 -16
WIRE 576 0 576 -16
WIRE 32 16 -80 16
WIRE -80 32 -80 16
WIRE 448 32 448 -16
WIRE 32 64 32 16
WIRE 96 64 32 64
WIRE 576 96 576 80
WIRE -80 128 -80 112
WIRE 32 128 -80 128
WIRE -80 144 -80 128
WIRE 32 144 32 128
WIRE 96 144 32 144
WIRE 400 144 352 144
WIRE 448 144 448 112
WIRE 448 144 400 144
WIRE 96 224 32 224
WIRE -80 240 -80 224
WIRE 32 240 32 224
WIRE 32 240 -80 240
WIRE -80 256 -80 240
WIRE 304 336 304 320
WIRE -80 352 -80 336
WIRE 144 352 144 320
WIRE 144 352 80 352
WIRE 80 400 80 352
WIRE 224 400 224 320
WIRE 80 496 80 480
WIRE 224 496 224 480
FLAG 304 336 0
FLAG -80 352 0
FLAG -720 0 0
FLAG 576 96 0
FLAG -720 -112 IN
FLAG 224 496 0
FLAG 80 496 0
FLAG 400 144 OUT
FLAG 512 -16 V_Pullup
SYMBOL res -96 128 R0
SYMATTR InstName R2
SYMATTR Value ${r2 / 1000}K
SYMBOL res -96 16 R0
SYMATTR InstName R3
SYMATTR Value ${r3 / 1000}K
SYMBOL res -96 240 R0
SYMATTR InstName R1
SYMATTR Value ${r1 / 1000}K
SYMBOL voltage -720 -112 R0
WINDOW 123 0 0 Left 0
WINDOW 39 0 0 Left 0
SYMATTR InstName V1
SYMATTR Value PWL(0 0 20u 0 10m ${vLow} +20m ${vMax} +10m ${vMax} +10m ${vMid} +10m ${vLow})
SYMBOL res 432 16 R0
SYMATTR InstName R4
SYMATTR Value 100K
SYMBOL voltage 576 -16 R0
SYMATTR InstName V2
SYMATTR Value 5
SYMBOL LTC2965 224 144 R0
SYMATTR InstName U1
SYMBOL voltage 80 384 R0
WINDOW 123 0 0 Left 0
WINDOW 39 0 0 Left 0
SYMATTR InstName V_PS
SYMATTR Value ${vPs}
SYMBOL voltage 224 384 R0
WINDOW 123 0 0 Left 0
WINDOW 39 0 0 Left 0
SYMATTR InstName V_RS
SYMATTR Value ${vRs}
TEXT 504 248 Left 2 !.tran 100m startup
`;
  
  const blob = new Blob([ascContent], { type: 'text/plain;charset=ascii' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LTC2965_simulation.asc';
  a.click();
  URL.revokeObjectURL(url);
}