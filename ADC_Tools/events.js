// events.js
document.addEventListener('DOMContentLoaded', () => {
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
            }, wait);
        };
    }

    function updateADCComparison() {
        const calcData = calculateADCComparison();
        updateDisplay(calcData);
    }

    const debouncedUpdate = debounce(updateADCComparison, 100);

    // Input event listeners for ADC
    function addEventListeners(index) {
        ['resolution', 'vref', 'gain'].forEach(field => {
            const input = document.getElementById(`adc${index}-${field}`);
            const slider = document.getElementById(`adc${index}-${field}-slider`);
            
            if (input) {
                // Input event listener
                input.addEventListener('input', () => {
                    if (slider) slider.value = input.value;
                    debouncedUpdate();
                });

                // Mouse wheel event listener
                input.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const step = parseFloat(input.step) || 1;
                    const currentValue = parseFloat(input.value) || 0;
                    const delta = e.deltaY < 0 ? step : -step;
                    let newValue = currentValue + delta;
                    // Respect min and max attributes if they exist
                    const min = input.min ? parseFloat(input.min) : -Infinity;
                    const max = input.max ? parseFloat(input.max) : Infinity;
                    newValue = Math.max(min, Math.min(max, newValue));
                    input.value = newValue;
                    if (slider) slider.value = newValue;
                    debouncedUpdate();
                });
            }

            if (slider) {
                slider.addEventListener('input', () => {
                    if (input) input.value = slider.value;
                    debouncedUpdate();
                });
            }
        });

        const differentialInput = document.getElementById(`adc${index}-differential`);
        if (differentialInput) {
            differentialInput.addEventListener('change', debouncedUpdate);
        }

        ['inl', 'dnl', 'offset', 'gain-error', 'noise'].forEach(metric => {
            const valueInput = document.getElementById(`adc${index}-${metric}-value`);
            const unitSelect = document.getElementById(`adc${index}-${metric}-unit`);

            if (valueInput) {
                valueInput.addEventListener('input', debouncedUpdate);
                // Mouse wheel event listener for metric values
                valueInput.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const step = parseFloat(valueInput.step) || 1;
                    const currentValue = parseFloat(valueInput.value) || 0;
                    const delta = e.deltaY < 0 ? step : -step;
                    let newValue = currentValue + delta;
                    // Respect min attribute if it exists (e.g., noise and INL/DNL can't be negative)
                    const min = valueInput.min ? parseFloat(valueInput.min) : -Infinity;
                    newValue = Math.max(min, newValue);
                    valueInput.value = newValue;
                    debouncedUpdate();
                });
            }

            if (unitSelect) {
                unitSelect.addEventListener('change', debouncedUpdate);
            }
        });

        // Listener for name input
        const nameInput = document.getElementById(`adc${index}-name`);
        if (nameInput) {
            nameInput.addEventListener('input', debouncedUpdate);
        }
    }

    // Function to set up button event listeners
    function setupButtonListeners() {
        // Add ADC button
        const addAdcButton = document.getElementById('add-adc');
        if (addAdcButton) {
            addAdcButton.addEventListener('click', () => {
                if (adcCount >= 3) return;
                adcCount++;
                const newAdc = document.querySelector('.adc-group').cloneNode(true);
                newAdc.id = `adc-${adcCount}`;
                newAdc.querySelectorAll('input').forEach(input => {
                    input.id = input.id.replace(`adc${adcCount-1}`, `adc${adcCount}`);
                    if (input.type === 'range') input.id = input.id.replace(`adc${adcCount-1}`, `adc${adcCount}`) + '-slider';
                    if (input.type === 'number' || input.type === 'checkbox') input.value = input.defaultValue;
                    if (input.id === `adc${adcCount}-name`) input.value = `ADC ${adcCount}`;
                });
                newAdc.querySelectorAll('select').forEach(select => {
                    select.id = select.id.replace(`adc${adcCount-1}`, `adc${adcCount}`);
                    select.value = select.options[0].value;
                });
                newAdc.querySelectorAll('span').forEach(span => {
                    span.id = span.id.replace(`adc${adcCount-1}`, `adc${adcCount}`);
                });
                const buttonGroup = document.querySelector('.button-group');
                if (buttonGroup) {
                    document.querySelector('.input-container').insertBefore(newAdc, buttonGroup);
                    addEventListeners(adcCount);
                    debouncedUpdate();
                }
            });
        }

        // Reset button
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                adcCount = 1;
                document.querySelector('.input-container').innerHTML = `
                    <div class="adc-group" id="adc-1">
                        <div class="input-group">
                            <label for="adc1-name">Name:</label>
                            <input type="text" id="adc1-name" value="ADC 1">
                        </div>
                        <div class="input-group">
                            <label for="adc1-resolution">Resolution (bits):</label>
                            <input type="number" id="adc1-resolution" min="8" max="24" step="1" value="16">
                            <input type="range" id="adc1-resolution-slider" min="8" max="24" step="1" value="16">
                        </div>
                        <div class="input-group">
                            <label for="adc1-vref">Reference Voltage (V):</label>
                            <input type="number" id="adc1-vref" min="0.1" max="10" step="0.1" value="5">
                            <input type="range" id="adc1-vref-slider" min="0.1" max="10" step="0.1" value="5">
                        </div>
                        <div class="input-group">
                            <label for="adc1-gain">Gain:</label>
                            <input type="number" id="adc1-gain" min="0.1" max="10" step="0.1" value="1">
                        </div>
                        <div class="input-group">
                            <label for="adc1-differential">Differential:</label>
                            <input type="checkbox" id="adc1-differential" checked>
                        </div>
                        <div class="input-group">
                            <label>FSR (V):</label>
                            <span id="adc1-fsr">10.000</span>
                        </div>
                        <div class="input-group">
                            <label>LSB (µV):</label>
                            <span id="adc1-lsb">152.59</span>
                        </div>
                        <div class="metric-group">
                            <h4>INL</h4>
                            <div class="input-group">
                                <label for="adc1-inl-value">Value:</label>
                                <input type="number" id="adc1-inl-value" min="0" step="0.1" value="1">
                                <select id="adc1-inl-unit">
                                    <option value="lsb">LSB</option>
                                    <option value="ppm">ppm</option>
                                    <option value="uv">µV</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>LSB:</label><span id="adc1-inl-lsb">1.00</span>
                                <label>ppm:</label><span id="adc1-inl-ppm">15.26</span>
                                <label>µV:</label><span id="adc1-inl-uv">152.59</span>
                            </div>
                        </div>
                        <div class="metric-group">
                            <h4>DNL</h4>
                            <div class="input-group">
                                <label for="adc1-dnl-value">Value:</label>
                                <input type="number" id="adc1-dnl-value" min="0" step="0.1" value="0.5">
                                <select id="adc1-dnl-unit">
                                    <option value="lsb">LSB</option>
                                    <option value="ppm">ppm</option>
                                    <option value="uv">µV</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>LSB:</label><span id="adc1-dnl-lsb">0.50</span>
                                <label>ppm:</label><span id="adc1-dnl-ppm">7.63</span>
                                <label>µV:</label><span id="adc1-dnl-uv">76.29</span>
                            </div>
                        </div>
                        <div class="metric-group">
                            <h4>Offset</h4>
                            <div class="input-group">
                                <label for="adc1-offset-value">Value:</label>
                                <input type="number" id="adc1-offset-value" step="0.1" value="10">
                                <select id="adc1-offset-unit">
                                    <option value="ppm">ppm</option>
                                    <option value="lsb">LSB</option>
                                    <option value="uv">µV</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>LSB:</label><span id="adc1-offset-lsb">65.54</span>
                                <label>ppm:</label><span id="adc1-offset-ppm">10.00</span>
                                <label>µV:</label><span id="adc1-offset-uv">100.00</span>
                            </div>
                        </div>
                        <div class="metric-group">
                            <h4>Gain Error</h4>
                            <div class="input-group">
                                <label for="adc1-gain-error-value">Value:</label>
                                <input type="number" id="adc1-gain-error-value" step="0.01" value="0.1">
                                <select id="adc1-gain-error-unit">
                                    <option value="percent">%FSR</option>
                                    <option value="ppm">ppm</option>
                                    <option value="lsb">LSB</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>%FSR:</label><span id="adc1-gain-error-percent">0.10</span>
                                <label>LSB:</label><span id="adc1-gain-error-lsb">6553.60</span>
                                <label>ppm:</label><span id="adc1-gain-error-ppm">1000.00</span>
                            </div>
                        </div>
                        <div class="metric-group">
                            <h4>Noise</h4>
                            <div class="input-group">
                                <label for="adc1-noise-value">Value:</label>
                                <input type="number" id="adc1-noise-value" min="0" step="0.1" value="5">
                                <select id="adc1-noise-unit">
                                    <option value="uv">µV</option>
                                    <option value="lsb">LSB</option>
                                    <option value="ppm">ppm</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>LSB:</label><span id="adc1-noise-lsb">0.03</span>
                                <label>ppm:</label><span id="adc1-noise-ppm">0.50</span>
                                <label>µV:</label><span id="adc1-noise-uv">5.00</span>
                            </div>
                        </div>
                    </div>
                    <div class="button-group">
                        <button id="add-adc">Add ADC</button>
                        <button id="reset-button">Reset</button>
                        <div class="presets">
                            <button id="preset-16bit">16-bit ADC</button>
                            <button id="preset-18bit">18-bit ADC</button>
                            <button id="preset-20bit">20-bit ADC</button>
                        </div>
                    </div>
                `;
                addEventListeners(1);
                setupButtonListeners();
                setupStandaloneConverterListeners(); // Reattach listeners for standalone converter
                debouncedUpdate();
            });
        }

        // Presets
        const presets = {
            '16bit': {
                name: '16-bit ADC',
                resolution: 16,
                vref: 5,
                gain: 1,
                differential: true,
                inl: { value: 1, unit: 'lsb' },
                dnl: { value: 0.5, unit: 'lsb' },
                offset: { value: 10, unit: 'ppm' },
                gainError: { value: 0.1, unit: 'percent' },
                noise: { value: 5, unit: 'uv' }
            },
            '18bit': {
                name: '18-bit ADC',
                resolution: 18,
                vref: 2.5,
                gain: 1,
                differential: false,
                inl: { value: 0.5, unit: 'lsb' },
                dnl: { value: 0.3, unit: 'lsb' },
                offset: { value: 20, unit: 'ppm' },
                gainError: { value: 0.05, unit: 'percent' },
                noise: { value: 3, unit: 'uv' }
            },
            '20bit': {
                name: '20-bit ADC',
                resolution: 20,
                vref: 3.3,
                gain: 1,
                differential: true,
                inl: { value: 0.2, unit: 'lsb' },
                dnl: { value: 0.1, unit: 'lsb' },
                offset: { value: 5, unit: 'ppm' },
                gainError: { value: 0.02, unit: 'percent' },
                noise: { value: 2, unit: 'uv' }
            }
        };

        ['16bit', '18bit', '20bit'].forEach(type => {
            const presetButton = document.getElementById(`preset-${type}`);
            if (presetButton) {
                presetButton.addEventListener('click', () => {
                    if (adcCount >= 3) return;
                    document.getElementById('add-adc').click();
                    const adcId = `adc${adcCount}`;
                    const preset = presets[type];
                    const nameInput = document.getElementById(`${adcId}-name`);
                    const resolutionInput = document.getElementById(`${adcId}-resolution`);
                    const resolutionSlider = document.getElementById(`${adcId}-resolution-slider`);
                    const vrefInput = document.getElementById(`${adcId}-vref`);
                    const vrefSlider = document.getElementById(`${adcId}-vref-slider`);
                    const gainInput = document.getElementById(`${adcId}-gain`);
                    const differentialInput = document.getElementById(`${adcId}-differential`);

                    if (nameInput) nameInput.value = preset.name;
                    if (resolutionInput) resolutionInput.value = preset.resolution;
                    if (resolutionSlider) resolutionSlider.value = preset.resolution;
                    if (vrefInput) vrefInput.value = preset.vref;
                    if (vrefSlider) vrefSlider.value = preset.vref;
                    if (gainInput) gainInput.value = preset.gain;
                    if (differentialInput) differentialInput.checked = preset.differential;

                    ['inl', 'dnl', 'offset', 'gain-error', 'noise'].forEach(metric => {
                        const valueInput = document.getElementById(`${adcId}-${metric}-value`);
                        const unitSelect = document.getElementById(`${adcId}-${metric}-unit`);
                        if (valueInput) valueInput.value = preset[metric.replace('-', '')].value;
                        if (unitSelect) unitSelect.value = preset[metric.replace('-', '')].unit;
                    });
                    debouncedUpdate();
                });
            }
        });
    }

    // Function to set up event listeners for the standalone converter
    function setupStandaloneConverterListeners() {
        ['converter-resolution', 'converter-fsr', 'converter-value'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', debouncedUpdate);
                // Mouse wheel event listener
                input.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const step = parseFloat(input.step) || 1;
                    const currentValue = parseFloat(input.value) || 0;
                    const delta = e.deltaY < 0 ? step : -step;
                    let newValue = currentValue + delta;
                    // Respect min and max attributes if they exist
                    const min = input.min ? parseFloat(input.min) : -Infinity;
                    const max = input.max ? parseFloat(input.max) : Infinity;
                    newValue = Math.max(min, Math.min(max, newValue));
                    input.value = newValue;
                    debouncedUpdate();
                });
            }
        });

        ['converter-unit', 'converter-differential', 'converter-output-type'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', debouncedUpdate);
                if (id === 'converter-differential' || id === 'converter-output-type') {
                    element.addEventListener('change', debouncedUpdate);
                }
            }
        });

        const converterValueSlider = document.getElementById('converter-value-slider');
        if (converterValueSlider) {
            converterValueSlider.addEventListener('input', () => {
                const converterValueInput = document.getElementById('converter-value');
                if (converterValueInput) {
                    converterValueInput.value = converterValueSlider.value;
                    debouncedUpdate();
                }
            });
        }
    }

    // Initial setup
    let adcCount = 1;
    addEventListeners(1);
    setupButtonListeners();
    setupStandaloneConverterListeners();

    // Comparison unit selector
    const comparisonUnitSelect = document.getElementById('comparison-unit');
    if (comparisonUnitSelect) {
        comparisonUnitSelect.addEventListener('change', debouncedUpdate);
    }

    updateADCComparison();
});