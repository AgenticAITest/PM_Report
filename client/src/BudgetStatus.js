import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './BudgetStatus.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const BUDGET_CATEGORIES = [
  { label: 'Underrun', color: '#4caf50' },
  { label: 'On Track', color: '#2196f3' },
  { label: 'Overrun', color: '#f44336' },
];

// variant: "table" | "chart" | "both" (default)
function BudgetStatus({ projects, variant = 'both', compact = false }) {
  const categorizeProject = (project) => {
    const hasOverrun = project.budgetOverrun !== null && project.budgetOverrun > 0;
    const hasUnderrun = project.budgetUnderrun !== null && project.budgetUnderrun > 0;

    if (hasOverrun) return 'Overrun';
    if (hasUnderrun) return 'Underrun';
    return 'On Track';
  };

  const categoryCounts = {
    'Underrun': 0,
    'On Track': 0,
    'Overrun': 0,
  };

  let validProjectCount = 0;
  projects.forEach(project => {
    const category = categorizeProject(project);
    categoryCounts[category]++;
    validProjectCount++;
  });

  const categoryPercentages = {};
  BUDGET_CATEGORIES.forEach(cat => {
    categoryPercentages[cat.label] = validProjectCount > 0
      ? ((categoryCounts[cat.label] / validProjectCount) * 100).toFixed(1)
      : '0.0';
  });

  const nonZeroCategories = BUDGET_CATEGORIES.filter(cat => categoryCounts[cat.label] > 0);

  const chartData = {
    labels: nonZeroCategories.map(cat => cat.label),
    datasets: [
      {
        data: nonZeroCategories.map(cat => categoryCounts[cat.label]),
        backgroundColor: nonZeroCategories.map(cat => cat.color),
        borderColor: nonZeroCategories.map(cat => cat.color),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: compact ? 9 : 11 },
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
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (validProjectCount === 0) {
    return (
      <div className={`budget-status ${compact ? 'compact' : ''}`}>
        <h3>Budget Status</h3>
        <div className="no-data">No data</div>
      </div>
    );
  }

  // Table only
  if (variant === 'table') {
    return (
      <div className={`budget-status ${compact ? 'compact' : ''}`}>
        <h3>Budget Status</h3>
        <div className="budget-table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th></th>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <th key={i} style={{ backgroundColor: cat.color, color: 'white' }}>
                    {cat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-header">Count</td>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <td key={i} className="count-cell">{categoryCounts[cat.label]}</td>
                ))}
              </tr>
              <tr>
                <td className="row-header">%</td>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <td key={i} className="percentage-cell">{categoryPercentages[cat.label]}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Chart only
  if (variant === 'chart') {
    return (
      <div className={`budget-status ${compact ? 'compact' : ''}`}>
        <h3>Budget Status</h3>
        <div className="budget-chart-only">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>
    );
  }

  // Both (default)
  return (
    <div className={`budget-status ${compact ? 'compact' : ''}`}>
      <h3>Budget Status (Overrun / Underrun)</h3>
      <div className="budget-content">
        <div className="budget-table-container">
          <table className="budget-table">
            <thead>
              <tr>
                <th></th>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <th key={i} style={{ backgroundColor: cat.color, color: 'white' }}>
                    {cat.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-header">Count</td>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <td key={i} className="count-cell">{categoryCounts[cat.label]}</td>
                ))}
              </tr>
              <tr>
                <td className="row-header">%</td>
                {BUDGET_CATEGORIES.map((cat, i) => (
                  <td key={i} className="percentage-cell">{categoryPercentages[cat.label]}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="budget-chart-container">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default BudgetStatus;
