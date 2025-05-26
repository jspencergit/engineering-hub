(function() {
    // Initialize Cleave.js for currency fields
    const cleaveInstances = {
        'start-salary': new Cleave('#start-salary', { numeral: true, numeralThousandsGroupStyle: 'thousand' }),
        'start-spending': new Cleave('#start-spending', { numeral: true, numeralThousandsGroupStyle: 'thousand' }),
        'start-savings': new Cleave('#start-savings', { numeral: true, numeralThousandsGroupStyle: 'thousand' })
    };

    const inputs = [
        { numberId: 'start-salary', sliderId: 'start-salary-slider', type: 'currency' },
        { numberId: 'start-spending', sliderId: 'start-spending-slider', type: 'currency' },
        { numberId: 'start-savings', sliderId: 'start-savings-slider', type: 'currency' },
        { numberId: 'pay-increase', sliderId: 'pay-increase-slider', type: 'percentage' },
        { numberId: 'spending-increase', sliderId: 'spending-increase-slider', type: 'percentage' },
        { numberId: 'investment-return', sliderId: 'investment-return-slider', type: 'percentage' },
        { numberId: 'return-std-dev', sliderId: 'return-std-dev-slider', type: 'percentage' },
        { numberId: 'time-horizon', sliderId: 'time-horizon-slider', type: 'integer' }
    ];

    inputs.forEach(input => {
        const numberInput = document.getElementById(input.numberId);
        const sliderInput = document.getElementById(input.sliderId);

        numberInput.addEventListener('input', () => {
            let value = input.type === 'currency'
                ? parseFloat(cleaveInstances[input.numberId].getRawValue()) || 0
                : parseFloat(numberInput.value) || 0;

            if (input.type === 'currency') {
                value = Math.round(value / 1000) * 1000;
                sliderInput.value = Math.max(sliderInput.min, value);
            } else if (input.type === 'percentage') {
                value = Math.round(value * 10) / 10;
                numberInput.value = value.toFixed(1);
                sliderInput.value = value;
            } else {
                numberInput.value = Math.round(value);
                sliderInput.value = value;
            }
            window.calculate();
        });

        sliderInput.addEventListener('input', () => {
            let value = parseFloat(sliderInput.value);
            if (input.type === 'currency') {
                cleaveInstances[input.numberId].setRawValue(value);
            } else if (input.type === 'percentage') {
                value = Math.round(value * 10) / 10;
                numberInput.value = value.toFixed(1);
            } else {
                numberInput.value = value;
            }
            window.calculate();
        });

        numberInput.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let value = input.type === 'currency'
                ? parseFloat(cleaveInstances[input.numberId].getRawValue()) || 0
                : parseFloat(numberInput.value) || 0;

            const step = parseFloat(numberInput.step) || 1000;
            const delta = e.deltaY < 0 ? step : -step;
            value += delta;

            const min = parseFloat(numberInput.min) || 0;
            const max = parseFloat(numberInput.max);
            if (value < min) value = min;
            if (max && value > max) value = max;

            if (input.type === 'currency') {
                value = Math.round(value / 1000) * 1000;
                cleaveInstances[input.numberId].setRawValue(value);
                sliderInput.value = Math.max(sliderInput.min, value);
            } else if (input.type === 'percentage') {
                value = Math.round(value * 10) / 10;
                numberInput.value = value.toFixed(1);
                sliderInput.value = value;
            } else {
                numberInput.value = Math.round(value);
                sliderInput.value = value;
            }
            window.calculate();
        }, { passive: false });
    });

    window.calculate = function() {
        const startIncome = parseFloat(cleaveInstances['start-salary'].getRawValue()) || 0;
        const startSpending = parseFloat(cleaveInstances['start-spending'].getRawValue()) || 0;
        const startSavings = parseFloat(cleaveInstances['start-savings'].getRawValue()) || 0;
        const payIncrease = (parseFloat(document.getElementById('pay-increase').value) || 0) / 100;
        const spendingIncrease = (parseFloat(document.getElementById('spending-increase').value) || 0) / 100;
        const investmentReturn = (parseFloat(document.getElementById('investment-return').value) || 0) / 100;
        const returnStdDev = (parseFloat(document.getElementById('return-std-dev').value) || 0) / 100;
        const timeHorizon = parseInt(document.getElementById('time-horizon').value) || 20;

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: timeHorizon + 1 }, (_, i) => currentYear + i);

        let income = startIncome;
        let spending = startSpending;
        let wealth = startSavings;

        const incomeData = [income];
        const spendingData = [spending];
        const positiveWealthGapData = [income];
        const negativeWealthGapData = [spending];
        const wealthData = [wealth];
        const wealthUpper1SD = [wealth];
        const wealthLower1SD = [wealth];
        const wealthUpper2SD = [wealth];
        const wealthLower2SD = [wealth];

        for (let t = 0; t < timeHorizon; t++) {
            income *= 1 + payIncrease;
            spending *= 1 + spendingIncrease;
            const contribution = income - spending;

            if (wealth > 0) {
                wealth = wealth * (1 + investmentReturn) + contribution;
            } else {
                wealth = wealth + contribution;
            }

            // Calculate confidence intervals for wealth (only if wealth > 0)
            let sdWealth = 0;
            if (returnStdDev > 0 && wealth > 0) {
                sdWealth = wealth * Math.sqrt(t + 1) * returnStdDev;
            }

            incomeData.push(income);
            spendingData.push(spending);

            // Determine positive and negative wealth gaps
            if (income > spending) {
                positiveWealthGapData.push(income);
                negativeWealthGapData.push(spending);
            } else {
                positiveWealthGapData.push(spending);
                negativeWealthGapData.push(income);
            }

            wealthData.push(wealth);

            if (wealth > 0 && returnStdDev > 0) {
                wealthUpper1SD.push(wealth + sdWealth);
                wealthLower1SD.push(Math.max(wealth - sdWealth, 0));
                wealthUpper2SD.push(wealth + 2 * sdWealth);
                wealthLower2SD.push(Math.max(wealth - 2 * sdWealth, 0));
            } else {
                wealthUpper1SD.push(wealth);
                wealthLower1SD.push(wealth);
                wealthUpper2SD.push(wealth);
                wealthLower2SD.push(wealth);
            }
        }

        if (window.updateFinancialChart) {
            window.updateFinancialChart(years, incomeData, spendingData, positiveWealthGapData, negativeWealthGapData, wealthData, wealthUpper1SD, wealthLower1SD, wealthUpper2SD, wealthLower2SD);
        } else {
            console.error('Chart update function not available. Ensure charts.js is loaded.');
        }
    };

    window.reset = function() {
        cleaveInstances['start-salary'].setRawValue(50000);
        document.getElementById('start-salary-slider').value = 50000;
        cleaveInstances['start-spending'].setRawValue(40000);
        document.getElementById('start-spending-slider').value = 40000;
        cleaveInstances['start-savings'].setRawValue(10000);
        document.getElementById('start-savings-slider').value = 10000;
        document.getElementById('pay-increase').value = 3.0;
        document.getElementById('pay-increase-slider').value = 3;
        document.getElementById('spending-increase').value = 2.5;
        document.getElementById('spending-increase-slider').value = 2.5;
        document.getElementById('investment-return').value = 7.0;
        document.getElementById('investment-return-slider').value = 7;
        document.getElementById('return-std-dev').value = 0.0;
        document.getElementById('return-std-dev-slider').value = 0;
        document.getElementById('time-horizon').value = 20;
        document.getElementById('time-horizon-slider').value = 20;

        document.getElementById('share-y-axis').checked = false;
        window.toggleSharedAxis();
        window.calculate();
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.reset();
    });
})();