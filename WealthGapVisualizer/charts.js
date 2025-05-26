const financialChartCanvas = document.getElementById('financial-chart');
const ctx = financialChartCanvas.getContext('2d');

// Create gradients for income and spending
const incomeGradient = ctx.createLinearGradient(0, 0, 0, 400);
incomeGradient.addColorStop(0, 'rgba(0, 48, 135, 0.8)'); // #003087 at 80% opacity
incomeGradient.addColorStop(1, 'rgba(230, 240, 250, 0.2)'); // #E6F0FA at 20% opacity

const spendingGradient = ctx.createLinearGradient(0, 0, 0, 400);
spendingGradient.addColorStop(0, 'rgba(212, 160, 23, 0.8)'); // #D4A017 at 80% opacity
spendingGradient.addColorStop(1, 'rgba(253, 246, 227, 0.2)'); // #FDF6E3 at 20% opacity

// Gradient for positive wealth gap (income > spending)
const positiveWealthGapGradient = ctx.createLinearGradient(0, 0, 0, 400);
positiveWealthGapGradient.addColorStop(0, 'rgba(46, 204, 113, 0.5)'); // #2ECC71 at 50% opacity
positiveWealthGapGradient.addColorStop(1, 'rgba(46, 204, 113, 0.1)'); // Fades to 10% opacity

// Gradient for negative wealth gap (spending > income)
const negativeWealthGapGradient = ctx.createLinearGradient(0, 0, 0, 400);
negativeWealthGapGradient.addColorStop(0, 'rgba(255, 140, 0, 0.5)'); // Dark orange (#FF8C00) at 50% opacity
negativeWealthGapGradient.addColorStop(1, 'rgba(255, 140, 0, 0.1)'); // Fades to 10% opacity

// Gradients for wealth confidence bands
const wealthGradient1SD = ctx.createLinearGradient(0, 0, 0, 400);
wealthGradient1SD.addColorStop(0, 'rgba(255, 69, 0, 0.3)'); // Darker red for ±1 SD
wealthGradient1SD.addColorStop(1, 'rgba(255, 69, 0, 0.1)'); // Lighter red

const wealthGradient2SD = ctx.createLinearGradient(0, 0, 0, 400);
wealthGradient2SD.addColorStop(0, 'rgba(255, 69, 0, 0.1)'); // Lighter red for ±2 SD
wealthGradient2SD.addColorStop(1, 'rgba(255, 69, 0, 0.05)'); // Very light red

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
                label: 'Positive Wealth Gap ($)',
                data: [],
                borderColor: 'transparent',
                backgroundColor: positiveWealthGapGradient,
                borderWidth: 0,
                pointRadius: 0,
                fill: '-1', // Fill between this (Income when Income > Spending) and Spending
                yAxisID: 'y-left'
            },
            {
                label: 'Negative Wealth Gap ($)',
                data: [],
                borderColor: 'transparent',
                backgroundColor: negativeWealthGapGradient,
                borderWidth: 0,
                pointRadius: 0,
                fill: '-2', // Fill between this (Income when Spending > Income) and Spending
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
            },
            {
                label: 'Wealth +1 SD',
                data: [],
                borderColor: 'transparent',
                backgroundColor: wealthGradient1SD,
                borderWidth: 0,
                pointRadius: 0,
                fill: '+1',
                yAxisID: 'y-right'
            },
            {
                label: 'Wealth -1 SD',
                data: [],
                borderColor: 'transparent',
                backgroundColor: wealthGradient1SD,
                borderWidth: 0,
                pointRadius: 0,
                fill: '-2',
                yAxisID: 'y-right'
            },
            {
                label: 'Wealth +2 SD',
                data: [],
                borderColor: 'transparent',
                backgroundColor: wealthGradient2SD,
                borderWidth: 0,
                pointRadius: 0,
                fill: '+1',
                yAxisID: 'y-right'
            },
            {
                label: 'Wealth -2 SD',
                data: [],
                borderColor: 'transparent',
                backgroundColor: wealthGradient2SD,
                borderWidth: 0,
                pointRadius: 0,
                fill: '-2',
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
                    font: { size: 12 }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 14 },
                    color: '#333',
                    filter: function(item) {
                        // Only show labels for main curves, not gap or confidence bands
                        return !item.text.includes('Gap') && !item.text.includes('SD');
                    }
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

function updateFinancialChart(years, incomeData, spendingData, positiveWealthGapData, negativeWealthGapData, wealthData, wealthUpper1SD, wealthLower1SD, wealthUpper2SD, wealthLower2SD) {
    financialChart.data.labels = years;
    financialChart.data.datasets[0].data = incomeData;
    financialChart.data.datasets[1].data = spendingData;
    financialChart.data.datasets[2].data = positiveWealthGapData;
    financialChart.data.datasets[3].data = negativeWealthGapData;
    financialChart.data.datasets[4].data = wealthData;
    financialChart.data.datasets[5].data = wealthUpper1SD;
    financialChart.data.datasets[6].data = wealthLower1SD;
    financialChart.data.datasets[7].data = wealthUpper2SD;
    financialChart.data.datasets[8].data = wealthLower2SD;

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
        financialChart.data.datasets[4].yAxisID = 'y-left';
        financialChart.data.datasets[5].yAxisID = 'y-left';
        financialChart.data.datasets[6].yAxisID = 'y-left';
        financialChart.data.datasets[7].yAxisID = 'y-left';
        financialChart.data.datasets[8].yAxisID = 'y-left';
    } else {
        financialChart.options.scales['y-left'].max = maxIncomeSpending * 2;
        financialChart.options.scales['y-left'].title.text = 'Income & Spending ($)';
        financialChart.options.scales['y-right'].display = true;
        financialChart.data.datasets[4].yAxisID = 'y-right';
        financialChart.data.datasets[5].yAxisID = 'y-right';
        financialChart.data.datasets[6].yAxisID = 'y-right';
        financialChart.data.datasets[7].yAxisID = 'y-right';
        financialChart.data.datasets[8].yAxisID = 'y-right';
    }

    financialChart.update();
}

window.toggleSharedAxis = function() {
    sharedAxis = document.getElementById('share-y-axis').checked;
    window.calculate();
};