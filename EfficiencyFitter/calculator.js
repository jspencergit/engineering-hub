/* calculator.js */

/* Fits a cubic spline to the user-placed points in log space for X-axis */
function fitCurve(points, maxCurrent, numPoints = 100) {
    points.sort((a, b) => a.current - b.current);
    const x = points.map(p => Math.log10(p.current));
    const y = points.map(p => p.efficiency);
    const n = x.length - 1;

    if (n < 1) return { splineData: [], minCurrent: points[0]?.current || 0, maxCurrent: points[0]?.current || 0 };

    const h = [];
    for (let i = 0; i < n; i++) {
        h[i] = x[i + 1] - x[i];
    }

    const a = [], b = [], c = [], r = [];
    for (let i = 1; i < n; i++) {
        a[i] = h[i - 1];
        b[i] = 2 * (h[i - 1] + h[i]);
        c[i] = h[i];
        r[i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
    }

    const m = new Array(n + 1).fill(0);
    for (let i = 2; i < n; i++) {
        const factor = a[i] / b[i - 1];
        b[i] -= factor * c[i - 1];
        r[i] -= factor * r[i - 1];
    }
    m[n - 1] = r[n - 1] / b[n - 1];
    for (let i = n - 2; i >= 1; i--) {
        m[i] = (r[i] - c[i] * m[i + 1]) / b[i];
    }

    // Use the min/max of the actual data points for interpolation range
    const minCurrent = points[0].current; // Lowest data point
    const dataMaxCurrent = points[points.length - 1].current; // Highest data point
    const logMin = Math.log10(minCurrent);
    const logMax = Math.log10(dataMaxCurrent);
    const splineData = [];
    const step = (logMax - logMin) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        const logCurrent = logMin + i * step;
        const current = Math.pow(10, logCurrent);
        let j = 0;
        while (j < n && logCurrent > x[j + 1]) j++;
        if (j === n) j--;

        const t = (logCurrent - x[j]) / h[j];
        const t2 = t * t, t3 = t2 * t;
        const efficiency = (1 - t) * y[j] + t * y[j + 1] +
                          (h[j] * h[j] / 6) * ((t3 - t) * m[j] + (t - t3 + t2 - t) * m[j + 1]);
        const clampedEfficiency = Math.max(0, Math.min(100, efficiency));
        splineData.push({ x: current, y: clampedEfficiency });
    }

    return { splineData, minCurrent, maxCurrent: dataMaxCurrent };
}

/* Generates table data by sampling the spline at 100 points */
function generateTableData(splineData, minCurrent, maxCurrent) {
    const tableData = splineData.map(point => ({
        current: point.x.toFixed(6),
        efficiency: point.y.toFixed(1)
    }));
    return tableData;
}

/* Generates CSV content for multiple series */
function generateCSVForMultipleSeries(fittedSeries) {
    if (fittedSeries.length === 0) return "Series Name,Current (mA),Efficiency (%),Power Loss (W)\n";

    // Use the first series to define the common X-axis points
    const xValues = fittedSeries[0].splineData.map(point => point.x);
    const numPoints = xValues.length;

    // Create CSV header
    let csv = "Current (mA)";
    fittedSeries.forEach(s => {
        csv += `,${s.name} Efficiency (%),${s.name} Power Loss (W)`;
    });
    csv += "\n";

    // Add data rows
    for (let i = 0; i < numPoints; i++) {
        const current = xValues[i].toFixed(6);
        csv += current;
        fittedSeries.forEach(s => {
            const efficiency = s.splineData[i].y.toFixed(1);
            const powerLoss = s.powerLossData[i].toFixed(3); // Power loss in Watts, 3 decimal places
            csv += `,${efficiency},${powerLoss}`;
        });
        csv += "\n";
    }

    return csv;
}

/* Calculates power loss for a series based on efficiency, current, and Vout */
function calculatePowerLoss(splineData, vout) {
    const powerLossData = [];
    const absVout = Math.abs(vout); // Use absolute value of Vout

    splineData.forEach(point => {
        const currentA = point.x / 1000; // Convert mA to A
        let efficiency = point.y; // Efficiency in %

        // Clamp efficiency to avoid division by zero or extreme values
        efficiency = Math.max(0.1, Math.min(99.9, efficiency));

        // Calculate power loss: P_loss = I_out * |V_out| * (100 / η - 1)
        const powerLossW = currentA * absVout * (100 / efficiency - 1);
        powerLossData.push(powerLossW);
    });

    return powerLossData;
}