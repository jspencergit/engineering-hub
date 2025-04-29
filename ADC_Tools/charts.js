const transferCtx = document.getElementById('transfer-chart').getContext('2d');
const transferChart = new Chart(transferCtx, {
    type: 'line',
    data: {
        datasets: []
    },
    options: {
        scales: {
            x: { title: { display: true, text: 'Analog Input (V)' } },
            y: { title: { display: true, text: 'Digital Output (V)' } }
        },
        plugins: { legend: { display: true } }
    }
});

const comparisonCtx = document.getElementById('comparison-chart').getContext('2d');
const comparisonChart = new Chart(comparisonCtx, {
    type: 'bar',
    data: {
        labels: ['LSB (µV)', 'INL (ppm)', 'ENOB (bits)', 'Dynamic Range (dB)'],
        datasets: []
    },
    options: {
        scales: {
            y: { title: { display: true, text: 'Value' } },
            x: { title: { display: true, text: 'Metric' } }
        },
        plugins: { legend: { display: true } }
    }
});

function updateCharts(calcData) {
    // Transfer function chart
    transferChart.data.datasets = calcData.transferData.map(adc => ({
        label: adc.id,
        data: adc.data,
        borderColor: ['#1a73e8', '#ff9500', '#34c759', '#ff2d55'][calcData.transferData.indexOf(adc) % 4],
        fill: false,
        stepped: true
    }));
    transferChart.update();

    // Comparison bar chart
    comparisonChart.data.datasets = calcData.adcs.map(adc => ({
        label: adc.id,
        data: [adc.lsb, adc.inlPpm, adc.enob, adc.dynamicRange],
        backgroundColor: ['#1a73e8', '#ff9500', '#34c759', '#ff2d55'][calcData.adcs.indexOf(adc) % 4]
    }));
    comparisonChart.update();

    // Metrics table
    const tbody = document.getElementById('metrics-body');
    tbody.innerHTML = calcData.adcs.map(adc => `
        <tr>
            <td>${adc.id}</td>
            <td>${adc.fsr.toFixed(3)}</td>
            <td>${adc.lsb.toFixed(2)}</td>
            <td>${adc.firstTransition.toFixed(6)}</td>
            <td>${adc.lastTransition.toFixed(6)}</td>
            <td>${adc.inlPpm.toFixed(2)}</td>
            <td>${adc.enob.toFixed(2)}</td>
            <td>${adc.dynamicRange.toFixed(2)}</td>
        </tr>
    `).join('');
}