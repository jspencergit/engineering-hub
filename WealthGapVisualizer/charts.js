const financialChartCanvas = document.getElementById('financial-chart');
const ctx = financialChartCanvas.getContext('2d');

// Create gradients for income and spending
const incomeGradient = ctx.createLinearGradient(0, 0, 0, 400);
incomeGradient.addColorStop(0, 'rgba(0, 48, 135, 0.8)'); // #003087 at 80% opacity
incomeGradient.addColorStop(1, 'rgba(230, 240, 250, 0.2)'); // #E6F0FA at 20% opacity

const spendingGradient = ctx.createLinearGradient(0, 0, 0, 400);
spendingGradient.addColorStop(0, 'rgba(212, 160, 23, 0.8)'); // #D4A017 at 80% opacity
spendingGradient.addColorStop(1, 'rgba(253, 246, 227, 0.2)'); // #FDF6E3 at 20% opacity

let sharedAxis = false;

const financialChart = new Chart(financialChartCanvas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Income ($)',
                data: [],
                borderColor: '#003087',
                backgroundColor: incomeGradient,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                yAxisID: 'y-left'
            },
            {
                label: 'Spending ($)',
                data: [],
                borderColor: '#d4a017',
                backgroundColor: spendingGradient,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                borderDash: [5, 3],
                yAxisID: 'y-left'
            },
            {
                label: 'Wealth Gap ($)',
                data: [],
                borderColor: 'transparent',
                backgroundColor: 'rgba(46, 204, 113, 0.5)', // #2ECC71 at 50% opacity
                borderWidth: 0,
                pointRadius: 0,
                fill: '-1',
                yAxisID: 'y-left'
            },
            {
                label: 'Wealth ($)',
                data: [],
                borderColor: '#ff4500',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                yAxisID: 'y-right'
            }
        ]
    },
    options: {
        scales: {
            'y-left': {
                position: 'left',
                title: {
                    display: true,
                    text: 'Income & Spending ($)',
                    color: '#003087',
                    font: { size: 14 }
                },
                grid: {
                    color: '#e0e0e0'
                },
                ticks: {
                    color: '#003087',
                    font: { size: 12 }
                },
                beginAtZero: true
            },
            'y-right': {
                position: 'right',
                title: {
                    display: true,
                    text: 'Wealth ($)',
                    color: '#ff4500',
                    font: { size: 14 }
                },
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    color: '#ff4500',
                    font: { size: 12 }
                },
                beginAtZero: true
            },
            x: {
                title: {
                    display: true,
                    text: 'Year',
                    color: '#003087',
                    font: { size: 14 }
                },
                grid: {
                    color: '#e0e0e0'
                },
                ticks: {
                    color: '#003087',
                    font: { size: 12 },
                    callback: function(value) {
                        return Number(value).toFixed(0);
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 14 },
                    color: '#333'
                }
            },
            tooltip: {
                enabled: false
            }
        },
        animation: {
            duration: 1000
        }
    }
});

function updateFinancialChart(years, incomeData, spendingData, wealthGapData, wealthData) {
    financialChart.data.labels = years;
    financialChart.data.datasets[0].data = incomeData;
    financialChart.data.datasets[1].data = spendingData;
    financialChart.data.datasets[2].data = wealthGapData;
    financialChart.data.datasets[3].data = wealthData;

    const maxIncomeSpending = Math.max(
        Math.max(...incomeData),
        Math.max(...spendingData)
    );
    const maxWealth = Math.max(...wealthData);

    financialChart.options.scales['y-left'].max = maxIncomeSpending * 2;

    if (sharedAxis) {
        financialChart.options.scales['y-left'].max = Math.max(maxIncomeSpending, maxWealth);
        financialChart.options.scales['y-left'].title.text = 'Amount ($)';
        financialChart.options.scales['y-right'].display = false;
        financialChart.data.datasets[3].yAxisID = 'y-left';
    } else {
        financialChart.options.scales['y-left'].max = maxIncomeSpending * 2;
        financialChart.options.scales['y-left'].title.text = 'Income & Spending ($)';
        financialChart.options.scales['y-right'].display = true;
        financialChart.data.datasets[3].yAxisID = 'y-right';
    }

    financialChart.update();
}

window.toggleSharedAxis = function() {
    sharedAxis = document.getElementById('share-y-axis').checked;
    window.calculate();
};