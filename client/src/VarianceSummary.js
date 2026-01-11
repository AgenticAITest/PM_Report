import React from 'react';
import './VarianceSummary.css';

function VarianceSummary({ projects, thresholds, compact = false }) {
  // Categorize projects based on variance thresholds
  const categorizeProject = (variance) => {
    if (variance === null) return null;

    for (let i = 0; i < thresholds.length; i++) {
      const threshold = thresholds[i];
      if (i === 0) {
        // First threshold: <= maxVariance
        if (variance <= threshold.maxVariance) {
          return threshold.label;
        }
      } else if (i === thresholds.length - 1) {
        // Last threshold: > previous maxVariance
        return threshold.label;
      } else {
        // Middle thresholds: > previous maxVariance AND <= current maxVariance
        const prevMax = thresholds[i - 1].maxVariance;
        if (variance > prevMax && variance <= threshold.maxVariance) {
          return threshold.label;
        }
      }
    }
    return thresholds[thresholds.length - 1].label;
  };

  // Count projects in each category
  const categoryCounts = {};
  thresholds.forEach(t => {
    categoryCounts[t.label] = 0;
  });

  let validProjectCount = 0;
  projects.forEach(project => {
    if (project.variance !== null) {
      const category = categorizeProject(project.variance);
      if (category) {
        categoryCounts[category]++;
        validProjectCount++;
      }
    }
  });

  // Calculate percentages
  const categoryPercentages = {};
  thresholds.forEach(t => {
    categoryPercentages[t.label] = validProjectCount > 0
      ? ((categoryCounts[t.label] / validProjectCount) * 100).toFixed(1)
      : '0.0';
  });

  return (
    <div className={`variance-summary ${compact ? 'compact' : ''}`}>
      <h3>Variance Summary</h3>
      <p className="summary-description">
        Projects categorized by variance (Budget Spent % - Progress %)
      </p>

      <div className="summary-table">
        <table>
          <thead>
            <tr>
              <th className="row-header"></th>
              {thresholds.map((t, i) => (
                <th key={i} style={{ backgroundColor: t.color, color: 'white' }}>
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="row-header">Total Projects</td>
              {thresholds.map((t, i) => (
                <td key={i} className="count-cell">
                  {categoryCounts[t.label]}
                </td>
              ))}
            </tr>
            <tr>
              <td className="row-header">Percentage</td>
              {thresholds.map((t, i) => (
                <td key={i} className="percentage-cell">
                  {categoryPercentages[t.label]}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="summary-footer">
        <span>Total projects analyzed: {validProjectCount}</span>
        {projects.length - validProjectCount > 0 && (
          <span className="skipped">
            ({projects.length - validProjectCount} projects skipped due to missing data)
          </span>
        )}
      </div>
    </div>
  );
}

export default VarianceSummary;
