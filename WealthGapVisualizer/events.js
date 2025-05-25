(function() {
    const inputs = [
        { numberId: 'start-salary', sliderId: 'start-salary-slider', type: 'currency' },
        { numberId: 'start-spending', sliderId: 'start-spending-slider', type: 'currency' },
        { numberId: 'start-savings', sliderId: 'start-savings-slider', type: 'currency' },
        { numberId: 'pay-increase', sliderId: 'pay-increase-slider', type: 'percentage' },
        { numberId: 'spending-increase', sliderId: 'spending-increase-slider', type: 'percentage' },
        { numberId: 'investment-return', sliderId: 'investment-return-slider', type: 'percentage' },
        { numberId: 'time-horizon', sliderId: 'time-horizon-slider', type: 'integer' }
    ];

    inputs.forEach(input => {
        const numberInput = document.getElementById(input.numberId);
        const sliderInput = document.getElementById(input.sliderId);

        numberInput.addEventListener('input', () => {
            let value = parseFloat(numberInput.value) || 0;
            if (input.type === 'currency') {
                value = Math.round(value / 1000) * 1000;
                numberInput.value = value;
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
            if (input.type === 'percentage') {
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
            let value = parseFloat(numberInput.value) || 0;
            const step = parseFloat(numberInput.step) || 1000;
            const delta = e.deltaY < 0 ? step : -step;
            value += delta;
            const min = parseFloat(numberInput.min) || 0;
            const max = parseFloat(numberInput.max);
            if (value < min) value = min;
            if (max && value > max) value = max;
            if (input.type === 'currency') {
                value = Math.round(value / 1000) * 1000;
                numberInput.value = value;
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
        const startIncome = parseFloat(document.getElementById('start-salary').value) || 0;
        const startSpending = parseFloat(document.getElementById('start-spending').value) || 0;
        const startSavings = parseFloat(document.getElementById('start-savings').value) || 0;
        const payIncrease = (parseFloat(document.getElementById('pay-increase').value) || 0) / 100;
        const spendingIncrease = (parseFloat(document.getElementById('spending-increase').value) || 0) / 100;
        const investmentReturn = (parseFloat(document.getElementById('investment-return').value) || 0) / 100;
        const timeHorizon = parseInt(document.getElementById('time-horizon').value) || 20;

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: timeHorizon + 1 }, (_, i) => currentYear + i);

        let income = startIncome;
        let spending = startSpending;
        let wealth = startSavings;

        const incomeData = [income];
        const spendingData = [spending];
        const wealthGapData = [income];
        const wealthData = [wealth];

        for (let i = 0; i < timeHorizon; i++) {
            income *= 1 + payIncrease;
            spending *= 1 + spendingIncrease;
            const contribution = income - spending;
            wealth = wealth > 0 ? wealth * (1 + investmentReturn) + contribution : wealth + contribution;
            incomeData.push(income);
            spendingData.push(spending);
            wealthGapData.push(income);
            wealthData.push(wealth);
        }

        if (window.updateFinancialChart) {
            window.updateFinancialChart(years, incomeData, spendingData, wealthGapData, wealthData);
        } else {
            console.error('Chart update function not available. Ensure charts.js is loaded.');
        }
    };

    window.reset = function() {
        document.getElementById('start-salary').value = 50000;
        document.getElementById('start-salary-slider').value = 50000;
        document.getElementById('start-spending').value = 40000;
        document.getElementById('start-spending-slider').value = 40000;
        document.getElementById('start-savings').value = 10000;
        document.getElementById('start-savings-slider').value = 10000;
        document.getElementById('pay-increase').value = 3.0;
        document.getElementById('pay-increase-slider').value = 3;
        document.getElementById('spending-increase').value = 2.5;
        document.getElementById('spending-increase-slider').value = 2.5;
        document.getElementById('investment-return').value = 7.0;
        document.getElementById('investment-return-slider').value = 7;
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