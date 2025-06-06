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
    ir3Slider: document.getElementById('ir3-slider'),
    r4Group: document.getElementById('r4-group')
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

    // Update image
    outputs.image.src = params.type === 'push-pull' ? 'images/Comparator_PushPull.jpg' : 'images/Comparator_OpenDrain.jpg';
    outputs.image.alt = params.type === 'push-pull' ? 'Push-Pull Circuit Diagram' : 'Open-Drain Circuit Diagram';

    // Draw new chart (Figure 10 style)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Define margins and sections
    const leftMargin = 80;
    const rightMargin = 80;
    const topSectionHeight = 250; // Height for input waveforms
    const bottomSectionHeight = 150; // Height for output waveform
    const sectionGap = 20; // Gap between sections

    // Top Section: Input Waveforms (IN-, IN+, Hysteresis Band)
    const topYStart = 20;
    const topYEnd = topYStart + topSectionHeight;
    const vhbV = params.vhb / 1000; // Convert mV to V
    const yScaleInput = 100 / vhbV; // Scale to focus on hysteresis band (±Vhb around Vref)
    const vrefY = topYStart + topSectionHeight / 2; // Center Vref
    const vthrY = vrefY - (vhbV / 2) * yScaleInput; // Vthr above Vref
    const vthfY = vrefY + (vhbV / 2) * yScaleInput; // Vthf below Vref

    // Draw X-axis (Time) for top section
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.moveTo(leftMargin, vrefY);
    ctx.lineTo(canvas.width - rightMargin, vrefY);
    ctx.stroke();

    // Y-axis labels for top section
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.fillText('IN-, IN+ (V)', leftMargin - 10, topYStart + 20);
    ctx.fillText(params.vref.toFixed(2), leftMargin - 10, vrefY + 5);
    ctx.fillText(result.vthrCalc.toFixed(2), leftMargin - 10, vthrY + 5);
    ctx.fillText(result.vthf.toFixed(2), leftMargin - 10, vthfY + 5);

    // Draw hysteresis band
    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(leftMargin, vthrY, canvas.width - leftMargin - rightMargin, vthfY - vthrY);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('Hysteresis Band', (leftMargin + (canvas.width - rightMargin)) / 2, (vthrY + vthfY) / 2);

    // Draw Vthr and Vthf as dashed lines
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(leftMargin, vthrY);
    ctx.lineTo(canvas.width - rightMargin, vthrY);
    ctx.moveTo(leftMargin, vthfY);
    ctx.lineTo(canvas.width - rightMargin, vthfY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Generate IN+ triangular waveform
    const timeSteps = 600;
    const amplitude = vhbV * 2; // Enough to cross the hysteresis band
    const period = timeSteps / 2; // One full cycle
    const inPlusData = [];
    let outData = [];
    let lastOut = 0; // Initial output state (low)
    for (let x = 0; x < timeSteps; x++) {
      const t = (x / period) * 2 * Math.PI;
      const inPlus = params.vref + amplitude * (Math.sin(t) > 0 ? 1 - (x % period) / (period / 2) : (x % period) / (period / 2) - 1);
      inPlusData.push({ x: leftMargin + x, y: vrefY - (inPlus - params.vref) * yScaleInput });

      // Determine OUT based on IN+ crossings
      if (inPlus > result.vthrCalc && lastOut === 0) {
        lastOut = params.vcc;
      } else if (inPlus < result.vthf && lastOut === params.vcc) {
        lastOut = 0;
      }
      outData.push(lastOut);
    }

    // Draw IN+ waveform
    ctx.beginPath();
    ctx.strokeStyle = '#ff5733';
    ctx.lineWidth = 2;
    inPlusData.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Bottom Section: Output Waveform (OUT)
    const bottomYStart = topYEnd + sectionGap;
    const bottomYEnd = bottomYStart + bottomSectionHeight;
    const yScaleOutput = bottomSectionHeight / params.vcc;
    const outYZero = bottomYEnd;
    const outYVcc = bottomYStart;

    // Draw X-axis (Time) for bottom section
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.moveTo(leftMargin, outYZero);
    ctx.lineTo(canvas.width - rightMargin, outYZero);
    ctx.stroke();

    // Y-axis labels for bottom section
    ctx.textAlign = 'right';
    ctx.fillText('OUT (V)', leftMargin - 10, bottomYStart + 20);
    ctx.fillText(params.vcc.toFixed(1), leftMargin - 10, outYVcc + 5);
    ctx.fillText('0', leftMargin - 10, outYZero - 5);

    // Draw OUT waveform
    ctx.beginPath();
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    let lastY = outYZero;
    for (let x = 0; x < timeSteps; x++) {
      const outY = outData[x] === 0 ? outYZero : outYVcc;
      if (x === 0) {
        ctx.moveTo(leftMargin + x, outY);
      } else if (lastY !== outY) {
        ctx.lineTo(leftMargin + x, lastY);
        ctx.lineTo(leftMargin + x, outY);
      } else {
        ctx.lineTo(leftMargin + x, outY);
      }
      lastY = outY;
    }
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

  function saveConfiguration() {
    const config = {
      type: inputs.type.value,
      vcc: parseFloat(inputs.vcc.value),
      vref: parseFloat(inputs.vref.value),
      vhb: parseFloat(inputs.vhb.value),
      vthr: parseFloat(inputs.vthr.value),
      r4: parseFloat(inputs.r4.value),
      ir3: parseFloat(inputs.ir3.value)
    };

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hysteresis_config.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function loadConfiguration(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);

        // Validate configuration
        if (!config || typeof config !== 'object') {
          outputs.error.textContent = 'Invalid configuration file.';
          return;
        }

        // Load values
        inputs.type.value = config.type || 'push-pull';
        inputs.vcc.value = config.vcc || 5;
        inputs.vref.value = config.vref || 1.24;
        inputs.vhb.value = config.vhb || 50;
        inputs.vthr.value = config.vthr || 3;
        inputs.r4.value = config.r4 || 1;
        inputs.ir3.value = config.ir3 || 0.2;
        inputs.r4Group.style.display = inputs.type.value === 'open-drain' ? 'block' : 'none';

        updateHysteresis();
      } catch (error) {
        outputs.error.textContent = 'Error loading configuration: ' + error.message;
      }

      // Clear the file input
      document.getElementById('load-config-input').value = '';
    };
    reader.readAsText(file);
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
    const csvContent = `Parameter,Value,Unit\nR1,${result.r1.toFixed(2)},kΩ\nR2,${result.r2.toFixed(2)},kΩ\nR3,${result.r3.toFixed(2)},MΩ\nVthr,${result.vthrCalc.toFixed(3)},V\nVthf,${result.vthf.toFixed(3)},V\nHysteresis,${result.hysteresis.toFixed(2)},mV`;
    const bom = '\uFEFF';
    const csv = bom + csvContent;
    const link = document.createElement('a');
    link.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    link.setAttribute('download', 'hysteresis_data.csv');
    link.click();
  });

  document.getElementById('save-config-btn').addEventListener('click', saveConfiguration);
  document.getElementById('load-config-btn').addEventListener('click', () => {
    document.getElementById('load-config-input').click();
  });
  document.getElementById('load-config-input').addEventListener('change', loadConfiguration);

  // Initial calculation
  resetTool();
});