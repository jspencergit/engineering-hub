// calculator.js
function calculateADCParameters(index) {
    const resolution = parseInt(document.getElementById(`adc${index}-resolution`).value) || 16;
    const vref = parseFloat(document.getElementById(`adc${index}-vref`).value) || 5;
    const gain = parseFloat(document.getElementById(`adc${index}-gain`).value) || 1;
    const differential = document.getElementById(`adc${index}-differential`).checked;

    // Calculate FSR
    const fsr = differential ? 2 * vref * gain : vref * gain;

    // Calculate LSB (V)
    const lsb = fsr / Math.pow(2, resolution);
    const lsbMicroV = lsb * 1e6;

    return { resolution, vref, gain, differential, fsr, lsb, lsbMicroV };
}

function convertMetric(value, unit, fsr, lsb, resolution) {
    let lsbValue, ppmValue, uvValue, percentValue;

    if (unit === 'lsb') {
        lsbValue = value;
        ppmValue = (lsbValue / Math.pow(2, resolution)) * 1e6;
        uvValue = lsbValue * (lsb * 1e6);
        percentValue = ppmValue / 10000;
    } else if (unit === 'ppm') {
        ppmValue = value;
        lsbValue = ppmValue * (Math.pow(2, resolution) / 1e6);
        uvValue = ppmValue * (fsr / 1e6) * 1e6;
        percentValue = ppmValue / 10000;
    } else if (unit === 'uv') {
        uvValue = value;
        ppmValue = (uvValue / 1e6) / fsr * 1e6;
        lsbValue = uvValue / (lsb * 1e6);
        percentValue = ppmValue / 10000;
    } else if (unit === 'percent') {
        percentValue = value;
        ppmValue = percentValue * 10000;
        lsbValue = ppmValue * (Math.pow(2, resolution) / 1e6);
        uvValue = ppmValue * (fsr / 1e6) * 1e6;
    }

    return { lsb: lsbValue, ppm: ppmValue, uv: uvValue, percent: percentValue };
}

function toBinaryString(code, resolution) {
    // Handle negative numbers for two's complement
    if (code < 0) {
        code = (1 << resolution) + code; // Convert to unsigned equivalent
    }
    let binary = code.toString(2);
    // Pad to the resolution length
    return binary.padStart(resolution, '0');
}

function toHexString(code, resolution) {
    // Handle negative numbers for two's complement
    if (code < 0) {
        code = (1 << resolution) + code; // Convert to unsigned equivalent
    }
    let hex = code.toString(16).toUpperCase();
    // Pad to the appropriate number of hex digits
    const hexDigits = Math.ceil(resolution / 4);
    return '0x' + hex.padStart(hexDigits, '0');
}

function calculateADCComparison() {
    const adcs = [];
    document.querySelectorAll('.adc-group').forEach((group, index) => {
        const idx = index + 1;
        const name = document.getElementById(`adc${idx}-name`).value || `ADC ${idx}`;
        const params = calculateADCParameters(idx);

        // Convert metrics
        const metrics = ['inl', 'dnl', 'offset', 'gain-error', 'noise'];
        const convertedMetrics = {};
        let totalErrorPpm = 0;

        metrics.forEach(metric => {
            const value = parseFloat(document.getElementById(`adc${idx}-${metric}-value`).value) || 0;
            const unit = document.getElementById(`adc${idx}-${metric}-unit`).value;
            const converted = convertMetric(value, unit, params.fsr, params.lsb, params.resolution);
            convertedMetrics[metric] = converted;
            if (metric !== 'noise') {
                totalErrorPpm += converted.ppm;
            }
        });

        adcs.push({
            id: name,
            resolution: params.resolution,
            fsr: params.fsr,
            lsbMicroV: params.lsbMicroV,
            metrics: convertedMetrics,
            totalErrorPpm
        });
    });

    // Standalone converter
    const converterResolution = parseInt(document.getElementById('converter-resolution').value) || 16;
    const converterFsr = parseFloat(document.getElementById('converter-fsr').value) || 10;
    const converterDifferential = document.getElementById('converter-differential').checked;
    const converterOutputType = document.getElementById('converter-output-type').value; // 'unsigned' or 'twos-complement'
    const converterLsb = converterFsr / Math.pow(2, converterResolution);
    const converterLsbMicroV = converterLsb * 1e6;

    // Determine the input range based on differential mode
    const maxVoltage = converterDifferential ? converterFsr / 2 : converterFsr;
    const minVoltage = converterDifferential ? -converterFsr / 2 : 0;

    // Convert the input value
    let converterValue = parseFloat(document.getElementById('converter-value').value) || 0;
    const converterUnit = document.getElementById('converter-unit').value;
    let outOfRange = false;

    // Round the input value to an integer
    converterValue = Math.round(converterValue);

    // Convert input to µV for range checking
    let inputMicroV;
    if (converterUnit === 'uv') {
        inputMicroV = converterValue;
    } else if (converterUnit === 'lsb') {
        inputMicroV = converterValue * converterLsbMicroV;
    } else if (converterUnit === 'ppm') {
        inputMicroV = (converterValue / 1e6) * converterFsr * 1e6;
    }

    // Clamp the input value if out of range
    const minMicroV = minVoltage * 1e6;
    const maxMicroV = maxVoltage * 1e6;
    if (inputMicroV < minMicroV) {
        inputMicroV = minMicroV;
        outOfRange = true;
    } else if (inputMicroV > maxMicroV) {
        inputMicroV = maxMicroV;
        outOfRange = true;
    }

    // Convert back to the appropriate unit if needed
    if (converterUnit === 'uv') {
        converterValue = Math.round(inputMicroV);
    } else if (converterUnit === 'lsb') {
        converterValue = Math.round(inputMicroV / converterLsbMicroV);
    } else if (converterUnit === 'ppm') {
        converterValue = Math.round((inputMicroV / (converterFsr * 1e6)) * 1e6);
    }

    // Update the input field to reflect the rounded value
    document.getElementById('converter-value').value = converterValue;

    // Calculate slider range in the selected unit
    let sliderMin, sliderMax;
    if (converterUnit === 'uv') {
        sliderMin = Math.round(minMicroV);
        sliderMax = Math.round(maxMicroV);
    } else if (converterUnit === 'lsb') {
        sliderMin = Math.round(minMicroV / converterLsbMicroV);
        sliderMax = Math.round(maxMicroV / converterLsbMicroV);
    } else if (converterUnit === 'ppm') {
        sliderMin = Math.round((minMicroV / (converterFsr * 1e6)) * 1e6);
        sliderMax = Math.round((maxMicroV / (converterFsr * 1e6)) * 1e6);
    }

    // Update the slider attributes
    const slider = document.getElementById('converter-value-slider');
    slider.min = sliderMin;
    slider.max = sliderMax;
    slider.step = 1; // Ensure the slider moves in integer steps
    slider.value = converterValue; // Sync the slider with the input value

    // Convert to LSB for binary/hex output
    const converterResult = convertMetric(converterValue, converterUnit, converterFsr, converterLsb, converterResolution);
    let code = Math.round(converterResult.lsb); // Digital code in LSB

    // Adjust code based on differential mode and output type
    const maxCode = Math.pow(2, converterResolution) - 1;
    const midCode = Math.pow(2, converterResolution - 1);
    if (converterDifferential) {
        if (converterOutputType === 'unsigned') {
            // Map -FSR/2 to 0, +FSR/2 to maxCode
            code = Math.round(((inputMicroV / 1e6 + converterFsr / 2) / converterFsr) * maxCode);
        } else {
            // Two's complement: Map -FSR/2 to -midCode, +FSR/2 to midCode-1
            code = Math.round((inputMicroV / 1e6 / (converterFsr / 2)) * midCode);
        }
    } else {
        if (converterOutputType === 'unsigned') {
            // Map 0 to 0, FSR to maxCode
            code = Math.round((inputMicroV / 1e6 / converterFsr) * maxCode);
        } else {
            // Two's complement: Map 0 to -midCode, FSR to midCode-1
            code = Math.round(((inputMicroV / 1e6 / converterFsr) * maxCode) - midCode);
        }
    }

    // Clamp the code
    if (converterOutputType === 'unsigned') {
        if (code < 0) {
            code = 0;
            outOfRange = true;
        } else if (code > maxCode) {
            code = maxCode;
            outOfRange = true;
        }
    } else {
        const minCode = -midCode;
        const maxCodeSigned = midCode - 1;
        if (code < minCode) {
            code = minCode;
            outOfRange = true;
        } else if (code > maxCodeSigned) {
            code = maxCodeSigned;
            outOfRange = true;
        }
    }

    // Convert to binary and hex
    const binaryOutput = toBinaryString(code, converterResolution);
    const hexOutput = toHexString(code, converterResolution);

    return {
        adcs,
        converter: {
            lsb: converterLsbMicroV,
            result: converterResult,
            code: code,
            binary: binaryOutput,
            hex: hexOutput,
            outOfRange: outOfRange,
            sliderMin: sliderMin,
            sliderMax: sliderMax
        }
    };
}

function updateDisplay(calcData) {
    // Update ADC sections
    calcData.adcs.forEach((adc, index) => {
        const idx = index + 1;
        document.getElementById(`adc${idx}-fsr`).textContent = adc.fsr.toFixed(3);
        document.getElementById(`adc${idx}-lsb`).textContent = adc.lsbMicroV.toFixed(2);

        ['inl', 'dnl', 'offset', 'noise'].forEach(metric => {
            const converted = adc.metrics[metric];
            document.getElementById(`adc${idx}-${metric}-lsb`).textContent = converted.lsb.toFixed(2);
            document.getElementById(`adc${idx}-${metric}-ppm`).textContent = converted.ppm.toFixed(2);
            document.getElementById(`adc${idx}-${metric}-uv`).textContent = converted.uv.toFixed(2);
        });

        const gainError = adc.metrics['gain-error'];
        document.getElementById(`adc${idx}-gain-error-percent`).textContent = gainError.percent.toFixed(2);
        document.getElementById(`adc${idx}-gain-error-lsb`).textContent = gainError.lsb.toFixed(2);
        document.getElementById(`adc${idx}-gain-error-ppm`).textContent = gainError.ppm.toFixed(2);
    });

    // Update comparison table
    const displayUnit = document.getElementById('comparison-unit').value;
    const tbody = document.getElementById('comparison-body');
    tbody.innerHTML = calcData.adcs.map(adc => {
        const inl = displayUnit === 'lsb' ? adc.metrics.inl.lsb.toFixed(2) :
                    displayUnit === 'ppm' ? adc.metrics.inl.ppm.toFixed(2) :
                    adc.metrics.inl.uv.toFixed(2);
        const dnl = displayUnit === 'lsb' ? adc.metrics.dnl.lsb.toFixed(2) :
                    displayUnit === 'ppm' ? adc.metrics.dnl.ppm.toFixed(2) :
                    adc.metrics.dnl.uv.toFixed(2);
        const offset = displayUnit === 'lsb' ? adc.metrics.offset.lsb.toFixed(2) :
                      displayUnit === 'ppm' ? adc.metrics.offset.ppm.toFixed(2) :
                      adc.metrics.offset.uv.toFixed(2);
        const gainError = displayUnit === 'lsb' ? adc.metrics['gain-error'].lsb.toFixed(2) :
                          displayUnit === 'ppm' ? adc.metrics['gain-error'].ppm.toFixed(2) :
                          (adc.metrics['gain-error'].ppm / 10000 * adc.fsr * 1e6).toFixed(2);
        const noise = displayUnit === 'lsb' ? adc.metrics.noise.lsb.toFixed(2) :
                      displayUnit === 'ppm' ? adc.metrics.noise.ppm.toFixed(2) :
                      adc.metrics.noise.uv.toFixed(2);
        const totalError = displayUnit === 'lsb' ? (adc.totalErrorPpm * (Math.pow(2, adc.resolution) / 1e6)).toFixed(2) :
                           displayUnit === 'ppm' ? adc.totalErrorPpm.toFixed(2) :
                           (adc.totalErrorPpm * (adc.fsr / 1e6) * 1e6).toFixed(2);

        return `
            <tr>
                <td>${adc.id}</td>
                <td>${adc.resolution}</td>
                <td>${adc.fsr.toFixed(3)}</td>
                <td>${adc.lsbMicroV.toFixed(2)}</td>
                <td${adc.metrics.inl[displayUnit] === Math.min(...calcData.adcs.map(a => a.metrics.inl[displayUnit])) ? ' class="best"' : ''}>${inl}</td>
                <td${adc.metrics.dnl[displayUnit] === Math.min(...calcData.adcs.map(a => a.metrics.dnl[displayUnit])) ? ' class="best"' : ''}>${dnl}</td>
                <td${Math.abs(adc.metrics.offset[displayUnit]) === Math.min(...calcData.adcs.map(a => Math.abs(a.metrics.offset[displayUnit]))) ? ' class="best"' : ''}>${offset}</td>
                <td${Math.abs(adc.metrics['gain-error'][displayUnit === 'uv' ? 'ppm' : displayUnit]) === Math.min(...calcData.adcs.map(a => Math.abs(a.metrics['gain-error'][displayUnit === 'uv' ? 'ppm' : displayUnit]))) ? ' class="best"' : ''}>${gainError}</td>
                <td${adc.metrics.noise[displayUnit] === Math.min(...calcData.adcs.map(a => a.metrics.noise[displayUnit])) ? ' class="best"' : ''}>${noise}</td>
                <td${adc.totalErrorPpm === Math.min(...calcData.adcs.map(a => a.totalErrorPpm)) ? ' class="best"' : ''}>${totalError}</td>
            </tr>
        `;
    }).join('');

    // Update standalone converter
    document.getElementById('converter-lsb').textContent = calcData.converter.lsb.toFixed(2);
    document.getElementById('converter-to-lsb').textContent = calcData.converter.result.lsb.toFixed(2);
    document.getElementById('converter-to-ppm').textContent = calcData.converter.result.ppm.toFixed(2);
    document.getElementById('converter-to-uv').textContent = calcData.converter.result.uv.toFixed(2);
    document.getElementById('converter-to-binary').textContent = calcData.converter.binary;
    document.getElementById('converter-to-hex').textContent = calcData.converter.hex;
    document.getElementById('converter-out-of-range').style.display = calcData.converter.outOfRange ? 'inline' : 'none';
}