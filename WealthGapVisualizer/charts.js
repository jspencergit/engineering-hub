const incomeSpendingChartCanvas = document.getElementById('income-spending-chart');
const incomeSpendingChart = new Chart(incomeSpendingChartCanvas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Income ($)',
                data: [],
                borderColor: '#003087',
                pointBackgroundColor: '#ff4500',
                pointRadius: 4,
                fill: false
            },
            {
                label: 'Spending ($)',
                data: [],
                borderColor: '#d4a017',
                pointBackgroundColor: '#ff4500',
                pointRadius: 4,
                fill: false
            }
        ]
    },
    options: {
        scales: {
            x: {
                title: { display: true, text: 'Year' },
                ticks: {
                    callback: function(value) {
                        return Number(value).toFixed(0);
                    }
                }
            },
            y: {
                title: { display: true, text: 'Amount ($)' },
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        onHover: (event, chartElement) => {
            const coordsDisplay = document.getElementById('income-spending-coords');
            if (chartElement.length) {
                const { x, y } = chartElement[0].element.parsed;
                const label = chartElement[0].dataset.label;
                coordsDisplay.textContent = `Year: ${x}, ${label}: $${y.toFixed(2)}`;
            } else {
                coordsDisplay.textContent = 'Coordinates: --';
            }
        }
    }
});

const savingsChartCanvas = document.getElementById('savings-chart');
const savingsChart = new Chart(savingsChartCanvas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Savings ($)',
                data: [],
                borderColor: '#ff4500',
                pointBackgroundColor: '#ff4500',
                pointRadius: 4,
                fill: false
            }
        ]
    },
    options: {
        scales: {
            x: {
                title: { display: true, text: 'Year' },
                ticks: {
                    callback: function(value) {
                        return Number(value).toFixed(0);
                    }
                }
            },
            y: {
                title: { display: true, text: 'Savings ($)' },
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Savings: $${context.parsed.y.toFixed(2)}`;
                    }
                }
            }
        },
        onHover: (event, chartElement) => {
            const coordsDisplay = document.getElementById('savings-coords');
            if (chartElement.length) {
                const { x, y } = chartElement[0].element.parsed;
                coordsDisplay.textContent = `Year: ${x}, Savings: $${y.toFixed(2)}`;
            } else {
                coordsDisplay.textContent = 'Coordinates: --';
            }
        }
    }
});

function updateIncomeSpendingChart(years, incomeData, spendingData) {
    incomeSpendingChart.data.labels = years;
    incomeSpendingChart.data.datasets[0].data = incomeData;
    incomeSpendingChart.data.datasets[1].data = spendingData;
    incomeSpendingChart.update();
}

function updateSavingsChart(years, savingsData) {
    savingsChart.data.labels = years;
    savingsChart.data.datasets[0].data = savingsData;
    savingsChart.update();
}