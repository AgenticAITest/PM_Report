import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './PMVarianceBarChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PMVarianceBarChart({ projects, thresholds, compact = false }) {
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

  projects.forEach(project => {
    if (project.variance === null) return;

    const pm = project.pm || 'Unknown';
    const category = categorizeProject(project.variance);

    if (!pmData[pm]) {
      pmData[pm] = { total: 0 };
      thresholds.forEach(t => {
        pmData[pm][t.label] = 0;
      });
    }

    if (category) {
      pmData[pm][category]++;
      pmData[pm].total++;
    }
  });

  // Convert to array and sort by total descending
  const pmRows = Object.entries(pmData)
    .map(([pm, data]) => ({ pm, ...data }))
    .sort((a, b) => b.total - a.total);

  // Prepare chart data
  const labels = pmRows.map(row => row.pm);

  const datasets = thresholds.map(threshold => ({
    label: threshold.label,
    data: pmRows.map(row => row[threshold.label] || 0),
    backgroundColor: threshold.color,
    borderColor: threshold.color,
    borderWidth: 1,
    borderRadius: 2,
  }));

  const chartData = {
    labels,
    datasets,
  };

  const chartOptions = {
    indexAxis: 'y', // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: compact ? 8 : 15,
          usePointStyle: true,
          pointStyle: 'rect',
          font: { size: compact ? 9 : 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} project${value !== 1 ? 's' : ''}`;
          },
          afterBody: function(tooltipItems) {
            const pmIndex = tooltipItems[0].dataIndex;
            const pm = pmRows[pmIndex];
            return `\nTotal: ${pm.total} projects`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
          font: { size: compact ? 9 : 11 },
        },
        title: {
          display: !compact,
          text: 'Number of Projects',
          font: { size: 12 },
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: compact ? 9 : 11 },
        },
      },
    },
  };

  if (pmRows.length === 0) {
    return (
      <div className={`pm-variance-bar-chart ${compact ? 'compact' : ''}`}>
        <h3>Project Variance by PM</h3>
        <div className="no-data">No project data to display</div>
      </div>
    );
  }

  return (
    <div className={`pm-variance-bar-chart ${compact ? 'compact' : ''}`}>
      <h3>Project Variance by PM</h3>
      <p className="section-description">
        Stacked view of variance categories per Project Manager
      </p>

      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="chart-footer">
        {pmRows.length} PMs | {pmRows.reduce((sum, pm) => sum + pm.total, 0)} total projects
      </div>
    </div>
  );
}

export default PMVarianceBarChart;
