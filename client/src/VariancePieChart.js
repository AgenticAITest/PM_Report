import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './VariancePieChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function VariancePieChart({ projects, thresholds, compact = false }) {
  // Categorize projects based on variance thresholds
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

  // Filter out categories with 0 count for cleaner chart
  const nonZeroThresholds = thresholds.filter(t => categoryCounts[t.label] > 0);

  const data = {
    labels: nonZeroThresholds.map(t => t.label),
    datasets: [
      {
        data: nonZeroThresholds.map(t => categoryCounts[t.label]),
        backgroundColor: nonZeroThresholds.map(t => t.color),
        borderColor: nonZeroThresholds.map(t => t.color),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: compact ? 10 : 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: compact ? 10 : 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = validProjectCount > 0
              ? ((value / validProjectCount) * 100).toFixed(1)
              : 0;
            return `${label}: ${value} projects (${percentage}%)`;
          },
        },
      },
    },
  };

  if (validProjectCount === 0) {
    return (
      <div className={`variance-pie-chart ${compact ? 'compact' : ''}`}>
        <h3>Variance Distribution</h3>
        <div className="no-data">No valid project data to display</div>
      </div>
    );
  }

  return (
    <div className={`variance-pie-chart ${compact ? 'compact' : ''}`}>
      <h3>Variance Distribution</h3>
      <p className="chart-description">
        Project distribution by variance category
      </p>
      <div className="chart-container">
        <Pie data={data} options={options} />
      </div>
      <div className="chart-footer">
        Total: {validProjectCount} projects
      </div>
    </div>
  );
}

export default VariancePieChart;
