document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hysteresisChart');
  const ctx = canvas.getContext('2d');
  const inputs = {
    type: document.getElementById('comparator-type'),
    vcc: document.getElementById('vcc'),
    vccSlider: document.getElementById('vcc-slider'),
    vref: document.getElementById('vref'),
    vrefSlider: document.getElementById('vref-slider'),
    vhb: document.getElementById('vhb'),
    vhbSlider: document.getElementById('vhb-slider'),
    vthr: document.getElementById('vthr'),
    vthrSlider: document.getElementById('vthr-slider'),
    r4: document.getElementById('r4'),
    r4Slider: document.getElementById('r4-slider'),
    ir3: document.getElementById('ir3'),
    ir3Slider: document.getElementById('ir3-slider')
  };
  const outputs = {
    r1: document.getElementById('r1'),
    r2: document.getElementById('r2'),
    r3: document.getElementById('r3'),
    vthrResult: document.getElementById('vthr-result'),
    vthf: document.getElementById('vthf'),
    hysteresis: document.getElementById('hysteresis'),
    error: document.getElementById('error-message'),
    image: document.getElementById('circuit-image')
  };

  function updateHysteresis() {
    const params = {
      type: inputs.type.value,
      vcc: parseFloat(inputs.vcc.value),
      vref: parseFloat(inputs.vref.value),
      vhb: parseFloat(inputs.vhb.value),
      vthr: parseFloat(inputs.vthr.value),
      r4: parseFloat(inputs.r4.value),
      ir3: parseFloat(inputs.ir3.value)
    };

    // Validation
    const error = validateInputs(params);
    if (error) {
      outputs.error.textContent = error;
      return;
    }
    outputs.error.textContent = '';

    // Update sliders
    inputs.vccSlider.max = params.vcc > 50 ? params.vcc : 50;
    inputs.vccSlider.value = params.vcc;
    inputs.vrefSlider.max = params.vcc;
    inputs.vrefSlider.value = params.vref;
    inputs.vhbSlider.value = params.vhb;
    inputs.vthrSlider.max = params.vcc;
    inputs.vthrSlider.value = params.vthr;
    inputs.r4Slider.value = params.r4;
    inputs.ir3Slider.value = params.ir3;

    // Calculate
    const result = calculateHysteresis(params);

    // Update outputs
    outputs.r1.textContent = `${result.r1.toFixed(2)} kΩ`;
    outputs.r2.textContent = `${result.r2.toFixed(2)} kΩ`;
    outputs.r3.textContent = `${result.r3.toFixed(2)} MΩ`;
    outputs.vthrResult.textContent = result.vthrCalc.toFixed(3);
    outputs.vthf.textContent = result.vthf.toFixed(3);
    outputs.hysteresis.textContent = result.hysteresis.toFixed(2);

    // Update image placeholder
    outputs.image.textContent = params.type === 'push-pull' ? 'Push-Pull Circuit Diagram Placeholder' : 'Open-Drain Circuit Diagram Placeholder';

    // Draw hysteresis loop
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const yScale = 200 / params.vcc;
    const vthrY = 250 - result.vthrCalc * yScale;
    const vthfY = 250 - result.vthf * yScale;
    const vrefY = 250 - params.vref * yScale;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.moveTo(50, 250);
    ctx.lineTo(550, 250); // X-axis (time)
    ctx.moveTo(50, 250);
    ctx.lineTo(50, 50);   // Y-axis (voltage)
    ctx.stroke();

    // Y-axis labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText('Voltage (V)', 40, 40);
    ctx.fillText(params.vcc.toFixed(1), 40, 50);
    ctx.fillText('0', 40, 255);
    ctx.fillText(params.vref.toFixed(1), 40, 150);

    // Draw threshold lines
    ctx.beginPath();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.moveTo(50, vthrY);
    ctx.lineTo(550, vthrY);
    ctx.stroke();
    ctx.fillStyle = '#007bff';
    ctx.textAlign = 'left';
    ctx.fillText('Vthr = ' + result.vthrCalc.toFixed(2) + 'V', 560, vthrY);

    ctx.beginPath();
    ctx.strokeStyle = '#ff5733';
    ctx.lineWidth = 2;
    ctx.moveTo(50, vthfY);
    ctx.lineTo(550, vthfY);
    ctx.stroke();
    ctx.fillStyle = '#ff5733';
    ctx.textAlign = 'left';
    ctx.fillText('Vthf = ' + result.vthf.toFixed(2) + 'V', 560, vthfY);

    ctx.beginPath();
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 2;
    ctx.moveTo(50, vrefY);
    ctx.lineTo(550, vrefY);
    ctx.stroke();
    ctx.fillStyle = '#28a745';
    ctx.textAlign = 'left';
    ctx.fillText('Vref = ' + params.vref.toFixed(2) + 'V', 560, vrefY);

    // Draw hysteresis loop
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.moveTo(200, 250);
    ctx.lineTo(200, vthrY);
    ctx.lineTo(400, vthrY);
    ctx.lineTo(400, vthfY);
    ctx.lineTo(200, vthfY);
    ctx.lineTo(200, 250);
    ctx.stroke();
  }

  function updateFromSlider(inputId) {
    const input = inputs[inputId];
    const slider = inputs[inputId + 'Slider'];
    input.value = slider.value;
    updateHysteresis();
  }

  function resetTool() {
    inputs.type.value = 'push-pull';
    inputs.vcc.value = 5;
    inputs.vref.value = 1.24;
    inputs.vhb.value = 50;
    inputs.vthr.value = 3;
    inputs.r4.value = 1;
    inputs.ir3.value = 0.2;
    inputs.r4Group.style.display = 'none';
    updateHysteresis();
  }

  // Event listeners
  inputs.type.addEventListener('change', () => {
    inputs.r4Group.style.display = inputs.type.value === 'open-drain' ? 'block' : 'none';
    updateHysteresis();
  });
  inputs.vcc.addEventListener('input', updateHysteresis);
  inputs.vref.addEventListener('input', updateHysteresis);
  inputs.vhb.addEventListener('input', updateHysteresis);
  inputs.vthr.addEventListener('input', updateHysteresis);
  inputs.r4.addEventListener('input', updateHysteresis);
  inputs.ir3.addEventListener('input', updateHysteresis);

  inputs.vccSlider.addEventListener('input', () => updateFromSlider('vcc'));
  inputs.vrefSlider.addEventListener('input', () => updateFromSlider('vref'));
  inputs.vhbSlider.addEventListener('input', () => updateFromSlider('vhb'));
  inputs.vthrSlider.addEventListener('input', () => updateFromSlider('vthr'));
  inputs.r4Slider.addEventListener('input', () => updateFromSlider('r4'));
  inputs.ir3Slider.addEventListener('input', () => updateFromSlider('ir3'));

  document.getElementById('calculate-btn').addEventListener('click', updateHysteresis);
  document.getElementById('reset-btn').addEventListener('click', resetTool);
  document.getElementById('download-csv-btn').addEventListener('click', () => {
    const params = {
      type: inputs.type.value,
      vcc: parseFloat(inputs.vcc.value),
      vref: parseFloat(inputs.vref.value),
      vhb: parseFloat(inputs.vhb.value),
      vthr: parseFloat(inputs.vthr.value),
      r4: parseFloat(inputs.r4.value),
      ir3: parseFloat(inputs.ir3.value)
    };
    const result = calculateHysteresis(params);
    const csv = `Parameter,Value,Unit\nR1,${result.r1.toFixed(2)},kΩ\nR2,${result.r2.toFixed(2)},kΩ\nR3,${result.r3.toFixed(2)},MΩ\nVthr,${result.vthrCalc.toFixed(3)},V\nVthf,${result.vthf.toFixed(3)},V\nHysteresis,${result.hysteresis.toFixed(2)},mV`;
    const link = document.createElement('a');
    link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    link.setAttribute('download', 'hysteresis_data.csv');
    link.click();
  });

  // Initial calculation
  resetTool();
});