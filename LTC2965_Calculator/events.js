/* events.js */
document.getElementById('calculateBtn').addEventListener('click', () => {
  const results = calculateValues();
  if (results) {
    document.getElementById('rangeResult').innerText = `Range: ${results.range}x (RS = ${results.range === 10 ? 'GND' : 'REF'})`;
    document.getElementById('polarityResult').innerText = `Polarity: ${results.polarity} (PS = ${results.polarity === 'noninverting' ? 'GND' : 'REF'})`;
    document.getElementById('hysteresisResult').innerText = `Hysteresis: ${results.hysteresis === 'external' ? 'External' : 'Built-In ' + results.hysteresis + ' edge'}`;
    document.getElementById('thresholdResult').innerText = `Actual Thresholds: V_IN(RISE) = ${results.vRiseActual.toFixed(2)}V, V_IN(FALL) = ${results.vFallActual.toFixed(2)}V`;
    document.getElementById('resistorResult').innerText = `Resistors: R1 = ${results.r1 / 1000}kΩ, R2 = ${results.r2 / 1000}kΩ, R3 = ${results.r3 / 1000}kΩ`;
    document.getElementById('errorResult').innerText = `Falling Threshold Error: ±${results.vErr.toFixed(2)}V (±${results.vErrPercent.toFixed(2)}%)`;
    document.getElementById('results').classList.remove('hidden');
  }
});

document.getElementById('downloadAscBtn').addEventListener('click', () => {
  const results = calculateValues();
  generateAscFile(results);
});

document.getElementById('saveConfigBtn').addEventListener('click', () => {
  const config = {
    range: parseFloat(document.getElementById('range').value),
    polarity: document.getElementById('polarity').value,
    hysteresis: document.getElementById('hysteresis').value,
    vRise: parseFloat(document.getElementById('vRise').value),
    vFall: parseFloat(document.getElementById('vFall').value),
    rSum: parseFloat(document.getElementById('rSum').value),
    tolerance: parseFloat(document.getElementById('tolerance').value)
  };
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LTC2965_config.json';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('saveModal').classList.remove('hidden');
});

document.getElementById('closeSaveModal').addEventListener('click', () => {
  document.getElementById('saveModal').classList.add('hidden');
});

document.getElementById('loadConfigInput').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        document.getElementById('range').value = config.range;
        document.getElementById('polarity').value = config.polarity;
        document.getElementById('hysteresis').value = config.hysteresis;
        document.getElementById('vRise').value = config.vRise;
        document.getElementById('vFall').value = config.vFall;
        document.getElementById('rSum').value = config.rSum;
        document.getElementById('tolerance').value = config.tolerance;
        document.getElementById('loadModal').classList.remove('hidden');
      } catch (error) {
        alert('Error loading configuration: Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }
});

document.getElementById('closeLoadModal').addEventListener('click', () => {
  document.getElementById('loadModal').classList.add('hidden');
});