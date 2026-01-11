import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './PMProjectAssignment.css';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PM_COLORS = [
  '#1a73e8',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
  '#00bcd4',
  '#f44336',
  '#3f51b5',
  '#8bc34a',
  '#ff5722',
  '#607d8b',
];

// variant: "pie" | "bar" | "both" (default)
function PMProjectAssignment({ projects, variant = 'both', compact = false }) {
  const pmCounts = {};

  projects.forEach(project => {
    const pm = project.pm || 'Unknown';
    pmCounts[pm] = (pmCounts[pm] || 0) + 1;
  });

  const pmData = Object.entries(pmCounts)
    .map(([pm, count]) => ({ pm, count }))
    .sort((a, b) => b.count - a.count);

  const totalProjects = projects.length;
  const pmColors = pmData.map((_, idx) => PM_COLORS[idx % PM_COLORS.length]);

  const pieData = {
    labels: pmData.map(d => d.pm),
    datasets: [
      {
        data: pmData.map(d => d.count),
        backgroundColor: pmColors,
        borderColor: pmColors,
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: compact ? 8 : 12,
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
            const percentage = totalProjects > 0
              ? ((value / totalProjects) * 100).toFixed(1)
              : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barData = {
    labels: pmData.map(d => d.pm),
    datasets: [
      {
        label: 'Projects',
        data: pmData.map(d => d.count),
        backgroundColor: pmColors,
        borderColor: pmColors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            const percentage = totalProjects > 0
              ? ((value / totalProjects) * 100).toFixed(1)
              : 0;
            return `${value} projects (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: compact ? 8 : 10 },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { stepSize: 1, font: { size: compact ? 9 : 11 } },
      },
    },
  };

  if (pmData.length === 0) {
    return (
      <div className={`pm-project-assignment ${compact ? 'compact' : ''}`}>
        <h3>PM Assignment</h3>
        <div className="no-data">No data</div>
      </div>
    );
  }

  // Pie only
  if (variant === 'pie') {
    return (
      <div className={`pm-project-assignment ${compact ? 'compact' : ''}`}>
        <h3>PM Assignment %</h3>
        <div className="chart-only">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>
    );
  }

  // Bar only
  if (variant === 'bar') {
    return (
      <div className={`pm-project-assignment ${compact ? 'compact' : ''}`}>
        <h3>PM Assignment Count</h3>
        <div className="chart-only bar">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    );
  }

  // Both (default)
  return (
    <div className={`pm-project-assignment ${compact ? 'compact' : ''}`}>
      <h3>Project Assignment by PM</h3>
      <div className="charts-row">
        <div className="chart-box">
          <h4>Assignment %</h4>
          <div className="chart-container pie-chart">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
        <div className="chart-box">
          <h4>Assignment Count</h4>
          <div className="chart-container bar-chart">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PMProjectAssignment;
