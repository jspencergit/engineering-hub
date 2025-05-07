// Event listeners for sliders and text boxes
document.addEventListener('DOMContentLoaded', () => {
    // Helper function to update values from a text input
    function handleTextUpdate(inputType, inputElement) {
        const value = inputElement.value;
        updateValues(inputType, value);
        // Sync the corresponding slider
        const slider = document.getElementById(inputType);
        if (slider) {
            slider.value = value;
        }
    }

    // Nomograph position slider
    const nomographSlider = document.getElementById('nomographPosition');
    nomographSlider.addEventListener('input', () => {
        updateValues('nomograph', nomographSlider.value);
    });

    // DVM Digits inputs
    const dvmSlider = document.getElementById('dvm');
    const dvmText = document.getElementById('dvmValue');
    dvmSlider.addEventListener('input', () => {
        dvmText.value = dvmSlider.value;
        updateValues('dvm', dvmSlider.value);
    });
    dvmText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('dvm', dvmText);
        }
    });

    // PPM inputs
    const ppmSlider = document.getElementById('ppm');
    const ppmText = document.getElementById('ppmValue');
    ppmSlider.addEventListener('input', () => {
        ppmText.value = ppmSlider.value;
        updateValues('ppm', ppmSlider.value);
    });
    ppmText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('ppm', ppmText);
        }
    });

    // Powers of Ten inputs
    const powersSlider = document.getElementById('powers');
    const powersText = document.getElementById('powersValue');
    powersSlider.addEventListener('input', () => {
        powersText.value = powersSlider.value;
        updateValues('powers', powersSlider.value);
    });
    powersText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('powers', powersText);
        }
    });

    // Percent inputs
    const percentSlider = document.getElementById('percent');
    const percentText = document.getElementById('percentValue');
    percentSlider.addEventListener('input', () => {
        percentText.value = percentSlider.value;
        updateValues('percent', percentSlider.value);
    });
    percentText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('percent', percentText);
        }
    });

    // Bits inputs
    const bitsSlider = document.getElementById('bits');
    const bitsText = document.getElementById('bitsValue');
    bitsSlider.addEventListener('input', () => {
        bitsText.value = bitsSlider.value;
        updateValues('bits', bitsSlider.value);
    });
    bitsText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('bits', bitsText);
        }
    });

    // dB inputs
    const dbSlider = document.getElementById('db');
    const dbText = document.getElementById('dbValue');
    dbSlider.addEventListener('input', () => {
        dbText.value = dbSlider.value;
        updateValues('db', dbSlider.value);
    });
    dbText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('db', dbText);
        }
    });

    // Counts inputs
    const countsSlider = document.getElementById('counts');
    const countsText = document.getElementById('countsValue');
    countsSlider.addEventListener('input', () => {
        countsText.value = countsSlider.value;
        updateValues('counts', countsSlider.value);
    });
    countsText.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleTextUpdate('counts', countsText);
        }
    });

    // Update buttons
    const updateButtons = document.querySelectorAll('.update-button');
    updateButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputType = button.getAttribute('data-input');
            const textInput = document.getElementById(`${inputType}Value`);
            handleTextUpdate(inputType, textInput);
        });
    });

    // Reset button
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', () => {
        // Reset to values corresponding to 60 dB (1024 counts, 10 bits, etc.)
        const db = 60;
        const x = dbToX(db);
        nomographSlider.value = x;
        dvmSlider.value = 3.5;
        dvmText.value = 3.5;
        ppmSlider.value = 1000;
        ppmText.value = 1000;
        powersSlider.value = -3;
        powersText.value = -3;
        percentSlider.value = 0.1;
        percentText.value = 0.1;
        bitsSlider.value = 10;
        bitsText.value = 10;
        dbSlider.value = 60;
        dbText.value = 60;
        countsSlider.value = 1024;
        countsText.value = 1024;

        // Update the nomograph
        updateValues('nomograph', x);
    });
});