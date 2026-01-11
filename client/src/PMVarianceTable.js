import React from 'react';
import './PMVarianceTable.css';

function PMVarianceTable({ projects, thresholds, compact = false }) {
  // Categorize project based on variance thresholds
  const categorizeProject = (variance) => {
    if (variance === null) return null;

    for (let i = 0; i < thresholds.length; i++) {
      const threshold = thresholds[i];
      if (i === 0) {
        if (variance <= threshold.maxVariance) {
          return threshold.label;
        }
      } else if (i === thresholds.length - 1) {
        return threshold.label;
      } else {
        const prevMax = thresholds[i - 1].maxVariance;
        if (variance > prevMax && variance <= threshold.maxVariance) {
          return threshold.label;
        }
      }
    }
    return thresholds[thresholds.length - 1].label;
  };

  // Group projects by PM and count categories
  const pmData = {};
  let totalValidProjects = 0;

  projects.forEach(project => {
    if (project.variance === null) return;

    const pm = project.pm || 'Unknown';
    const category = categorizeProject(project.variance);

    if (!pmData[pm]) {
      pmData[pm] = {
        pm,
        categories: {},
        total: 0,
      };
      // Initialize all categories to 0
      thresholds.forEach(t => {
        pmData[pm].categories[t.label] = 0;
      });
    }

    if (category) {
      pmData[pm].categories[category]++;
      pmData[pm].total++;
      totalValidProjects++;
    }
  });

  // Convert to array and sort by total descending
  const pmRows = Object.values(pmData).sort((a, b) => b.total - a.total);

  // Calculate totals row
  const totalsRow = {
    categories: {},
    total: totalValidProjects,
  };
  thresholds.forEach(t => {
    totalsRow.categories[t.label] = pmRows.reduce((sum, pm) => sum + pm.categories[t.label], 0);
  });

  if (pmRows.length === 0) {
    return (
      <div className={`pm-variance-table ${compact ? 'compact' : ''}`}>
        <h3>Variance by Project Manager</h3>
        <div className="no-data">No project data to display</div>
      </div>
    );
  }

  return (
    <div className={`pm-variance-table ${compact ? 'compact' : ''}`}>
      <h3>Variance by Project Manager</h3>
      <p className="section-description">
        Project distribution by PM and variance category
      </p>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="pm-col">PM</th>
              {thresholds.map((t, i) => (
                <th key={i} style={{ backgroundColor: t.color, color: 'white' }}>
                  {t.label}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="percent-col">%</th>
            </tr>
          </thead>
          <tbody>
            {pmRows.map((row, idx) => (
              <tr key={idx}>
                <td className="pm-col">{row.pm}</td>
                {thresholds.map((t, i) => (
                  <td key={i} className="count-cell">
                    {row.categories[t.label] || 0}
                  </td>
                ))}
                <td className="total-cell">{row.total}</td>
                <td className="percent-cell">
                  {totalValidProjects > 0
                    ? ((row.total / totalValidProjects) * 100).toFixed(1)
                    : '0.0'}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td className="pm-col">Total</td>
              {thresholds.map((t, i) => (
                <td key={i} className="count-cell">
                  {totalsRow.categories[t.label]}
                </td>
              ))}
              <td className="total-cell">{totalsRow.total}</td>
              <td className="percent-cell">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default PMVarianceTable;
