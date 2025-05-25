(function() {
    const inputs = [
        { numberId: 'start-salary', sliderId: 'start-salary-slider' },
        { numberId: 'start-age', sliderId: 'start-age-slider' },
        { numberId: 'start-savings', sliderId: 'start-savings-slider' },
        { numberId: 'annual-spending', sliderId: 'annual-spending-slider' },
        { numberId: 'pay-increase', sliderId: 'pay-increase-slider' },
        { numberId: 'spending-increase', sliderId: 'spending-increase-slider' },
        { numberId: 'investment-return', sliderId: 'investment-return-slider' },
        { numberId: 'time-horizon', sliderId: 'time-horizon-slider' }
    ];

    inputs.forEach(input => {
        const numberInput = document.getElementById(input.numberId);
        const sliderInput = document.getElementById(input.sliderId);

        numberInput.addEventListener('input', () => {
            sliderInput.value = numberInput.value;
            window.calculate();
        });
        sliderInput.addEventListener('input', () => {
            numberInput.value = sliderInput.value;
            window.calculate();
        });

        numberInput.addEventListener('wheel', (e) => {
            e.preventDefault();
            const step = parseFloat(numberInput.step) || 1;
            const delta = e.deltaY < 0 ? step : -step;
            numberInput.value = Math.max(numberInput.min, Math.min(numberInput.max, parseFloat(numberInput.value) + delta));
            sliderInput.value = numberInput.value;
            window.calculate();
        });
    });

    window.calculate = function() {
        const startSalary = parseFloat(document.getElementById('start-salary').value);
        const startAge = parseInt(document.getElementById('start-age').value);
        const startSavings = parseFloat(document.getElementById('start-savings').value);
        const annualSpending = parseFloat(document.getElementById('annual-spending').value);
        const payIncrease = parseFloat(document.getElementById('pay-increase').value) / 100;
        const spendingIncrease = parseFloat(document.getElementById('spending-increase').value) / 100;
        const investmentReturn = parseFloat(document.getElementById('investment-return').value) / 100;
        const timeHorizon = parseInt(document.getElementById('time-horizon').value);

        if (annualSpending > startSalary) {
            alert('Annual spending cannot exceed starting salary.');
            return;
        }

        const years = Array.from({ length: timeHorizon + 1 }, (_, i) => startAge + i);
        let income = startSalary;
        let spending = annualSpending;
        let savings = startSavings;

        const incomeData = [income];
        const spendingData = [spending];
        const wealthGapData = [income]; // Same as income, will fill between income and spending
        const savingsData = [savings];

        for (let i = 0; i < timeHorizon; i++) {
            income = income * (1 + payIncrease);
            spending = spending * (1 + spendingIncrease);
            const contribution = Math.max(0, income - spending);
            savings = savings * (1 + investmentReturn) + contribution;

            incomeData.push(income);
            spendingData.push(spending);
            wealthGapData.push(income); // Wealth gap dataset matches income, fills down to spending
            savingsData.push(savings);
        }

        if (window.updateFinancialChart) {
            window.updateFinancialChart(years, incomeData, spendingData, wealthGapData, savingsData);
        } else {
            console.error('Chart update function is not available. Ensure charts.js is loaded correctly.');
        }
    };

    window.reset = function() {
        document.getElementById('start-salary').value = 50000;
        document.getElementById('start-salary-slider').value = 50000;
        document.getElementById('start-age').value = 30;
        document.getElementById('start-age-slider').value = 30;
        document.getElementById('start-savings').value = 10000;
        document.getElementById('start-savings-slider').value = 10000;
        document.getElementById('annual-spending').value = 40000;
        document.getElementById('annual-spending-slider').value = 40000;
        document.getElementById('pay-increase').value = 3;
        document.getElementById('pay-increase-slider').value = 3;
        document.getElementById('spending-increase').value = 2.5;
        document.getElementById('spending-increase-slider').value = 2.5;
        document.getElementById('investment-return').value = 7;
        document.getElementById('investment-return-slider').value = 7;
        document.getElementById('time-horizon').value = 20;
        document.getElementById('time-horizon-slider').value = 20;

        if (window.updateFinancialChart) {
            window.updateFinancialChart([], [], [], [], []);
        }
        document.getElementById('chart-coords').textContent = 'Hover over the graph to see values.';
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.calculate();
    });
})();