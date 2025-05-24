/* calculator.js */

/* Fits a cubic spline to the user-placed points in log space for X-axis */
function fitCurve(points, maxCurrent, numPoints = 100) {
    // Sort points by current to ensure spline works correctly
    points.sort((a, b) => a.current - b.current);
    const x = points.map(p => Math.log10(p.current)); // Transform to log space
    const y = points.map(p => p.efficiency); // Efficiency remains linear
    const n = x.length - 1;

    // Ensure at least 2 points
    if (n < 1) return { splineData: [], minCurrent: points[0].current, maxCurrent: points[0].current };

    // Compute coefficients for cubic spline in log space
    const h = [];
    for (let i = 0; i < n; i++) {
        h[i] = x[i + 1] - x[i];
    }

    // Solve for second derivatives (c) using tridiagonal system
    const a = [], b = [], c = [], r = [];
    for (let i = 1; i < n; i++) {
        a[i] = h[i - 1];
        b[i] = 2 * (h[i - 1] + h[i]);
        c[i] = h[i];
        r[i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
    }

    // Thomas algorithm to solve tridiagonal system
    const m = new Array(n + 1).fill(0); // Second derivatives
    for (let i = 2; i < n; i++) {
        const factor = a[i] / b[i - 1];
        b[i] -= factor * c[i - 1];
        r[i] -= factor * r[i - 1];
    }
    m[n - 1] = r[n - 1] / b[n - 1];
    for (let i = n - 2; i >= 1; i--) {
        m[i] = (r[i] - c[i] * m[i + 1]) / b[i];
    }

    // Generate points for the fitted curve, sampling logarithmically
    const minCurrent = Math.min(...points.map(p => p.current));
    const logMin = Math.log10(minCurrent);
    const logMax = Math.log10(maxCurrent);
    const splineData = [];
    const step = (logMax - logMin) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        const logCurrent = logMin + i * step;
        const current = Math.pow(10, logCurrent);
        // Find the interval [x[j], x[j+1]] that logCurrent falls into
        let j = 0;
        while (j < n && logCurrent > x[j + 1]) j++;
        if (j === n) j--;

        // Compute spline value at logCurrent
        const t = (logCurrent - x[j]) / h[j];
        const t2 = t * t, t3 = t2 * t;
        const efficiency = (1 - t) * y[j] + t * y[j + 1] +
                          (h[j] * h[j] / 6) * ((t3 - t) * m[j] + (t - t3 + t2 - t) * m[j + 1]);
        // Clamp efficiency to 0–100%
        const clampedEfficiency = Math.max(0, Math.min(100, efficiency));
        splineData.push({ x: current, y: clampedEfficiency });
    }

    return { splineData, minCurrent, maxCurrent };
}

/* Generates table data by sampling the spline at 100 points */
function generateTableData(splineData, minCurrent, maxCurrent) {
    const tableData = splineData.map(point => ({
        current: point.x.toFixed(6), // 6 decimal places for microamps
        efficiency: point.y.toFixed(1)
    }));
    return tableData;
}

/* Generates CSV content from table data */
function generateCSV(tableData) {
    // Create CSV header
    let csv = "Current (mA),Efficiency (%)\n";
    // Add each row
    tableData.forEach(row => {
        csv += `${row.current},${row.efficiency}\n`;
    });
    return csv;
}