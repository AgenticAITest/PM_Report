import React, { useState, useEffect, useCallback } from 'react';
import Settings, { DEFAULT_VARIANCE_THRESHOLDS } from './Settings';
import VarianceSummary from './VarianceSummary';
import VariancePieChart from './VariancePieChart';
import BudgetStatus from './BudgetStatus';
import PMVarianceTable from './PMVarianceTable';
import PMProjectAssignment from './PMProjectAssignment';
import PMVarianceBarChart from './PMVarianceBarChart';
import './App.css';

const API_URL = '/api';

// Load/save settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('pmreport-settings');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { varianceThresholds: DEFAULT_VARIANCE_THRESHOLDS };
};

const saveSettings = (settings) => {
  try {
    localStorage.setItem('pmreport-settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

function SettingsIcon({ onClick }) {
  return (
    <button className="settings-icon-btn" onClick={onClick} title="Settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}

function WeeklyDataManager({ weeks, onUploadTimesheet, onUploadCostEfficiency, onDeleteWeek, onDeleteFile, selectedWeek, onSelectWeek }) {
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState(null);

  const handleTimesheetUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading('timesheet');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/weeks/upload/timesheet`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onUploadTimesheet(data.weekId);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const handleCostEfficiencyUpload = async (e, weekId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(`ce-${weekId}`);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/weeks/${weekId}/upload/cost-efficiency`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onUploadCostEfficiency(weekId);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const formatWeekId = (weekId) => {
    const [year, week] = weekId.split('-W');
    return `Week ${week}, ${year}`;
  };

  return (
    <div className="weekly-data-manager">
      <div className="upload-section">
        <h3>Upload Timesheet</h3>
        <p className="hint">Upload timesheet CSV to create a new week entry. Week is auto-detected from dates.</p>
        <label className={`upload-btn ${uploading === 'timesheet' ? 'uploading' : ''}`}>
          <input type="file" accept=".csv" onChange={handleTimesheetUpload} disabled={uploading} />
          {uploading === 'timesheet' ? 'Uploading...' : 'Select Timesheet CSV'}
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="weeks-list">
        <h3>Weekly Data</h3>
        {weeks.length === 0 ? (
          <p className="no-data">No data uploaded yet. Upload a timesheet to get started.</p>
        ) : (
          weeks.map((week) => (
            <div
              key={week.weekId}
              className={`week-card ${selectedWeek === week.weekId ? 'selected' : ''}`}
              onClick={() => onSelectWeek(week.weekId)}
            >
              <div className="week-header">
                <span className="week-title">{formatWeekId(week.weekId)}</span>
                <button
                  className="delete-week-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete all data for ${formatWeekId(week.weekId)}?`)) {
                      onDeleteWeek(week.weekId);
                    }
                  }}
                  title="Delete week"
                >
                  &times;
                </button>
              </div>

              <div className="week-files">
                <div className="file-status">
                  <span className={`status-dot ${week.hasTimesheet ? 'complete' : 'missing'}`}></span>
                  <span>Timesheet</span>
                  {week.hasTimesheet && (
                    <button
                      className="delete-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(week.weekId, 'timesheet');
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="file-status">
                  <span className={`status-dot ${week.hasCostEfficiency ? 'complete' : 'missing'}`}></span>
                  <span>Cost Efficiency</span>
                  {week.hasCostEfficiency ? (
                    <button
                      className="delete-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(week.weekId, 'costEfficiency');
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <label
                      className={`upload-file-btn ${uploading === `ce-${week.weekId}` ? 'uploading' : ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCostEfficiencyUpload(e, week.weekId)}
                        disabled={uploading}
                      />
                      {uploading === `ce-${week.weekId}` ? '...' : 'Add'}
                    </label>
                  )}
                </div>
              </div>

              {selectedWeek === week.weekId && (
                <div className="selected-indicator">Selected</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GraphPanel({ weekData, settings, graphsGenerated }) {
  if (!graphsGenerated) {
    return (
      <div className="graph-panel empty">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-4-4-3 3" />
          </svg>
          <p>Select a week and click "Create Graphs" to generate visualizations</p>
        </div>
      </div>
    );
  }

  const weekLabel = weekData?.weekId
    ? `Week ${weekData.weekId.split('-W')[1]}, ${weekData.weekId.split('-W')[0]}`
    : '';

  return (
    <div className="graph-panel dashboard">
      <div className="dashboard-header">
        <h2>{weekLabel}</h2>
      </div>

      {weekData?.projects ? (
        <div className="dashboard-grid">
          {/* Row 1 */}
          <div className="grid-cell cell-1">
            <VarianceSummary
              projects={weekData.projects}
              thresholds={settings.varianceThresholds}
              compact
            />
          </div>
          <div className="grid-cell cell-5">
            <PMVarianceTable
              projects={weekData.projects}
              thresholds={settings.varianceThresholds}
              compact
            />
          </div>

          {/* Row 2 */}
          <div className="grid-cell cell-2">
            <VariancePieChart
              projects={weekData.projects}
              thresholds={settings.varianceThresholds}
              compact
            />
          </div>
          <div className="grid-cell cell-6">
            <PMProjectAssignment
              projects={weekData.projects}
              variant="pie"
              compact
            />
          </div>
          <div className="grid-cell cell-7">
            <PMProjectAssignment
              projects={weekData.projects}
              variant="bar"
              compact
            />
          </div>

          {/* Row 3 */}
          <div className="grid-cell cell-3">
            <BudgetStatus
              projects={weekData.projects}
              variant="table"
              compact
            />
          </div>
          <div className="grid-cell cell-4">
            <BudgetStatus
              projects={weekData.projects}
              variant="chart"
              compact
            />
          </div>
          <div className="grid-cell cell-8">
            <PMVarianceBarChart
              projects={weekData.projects}
              thresholds={settings.varianceThresholds}
              compact
            />
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          <p>No cost efficiency data available for this week.</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [graphsGenerated, setGraphsGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);

  const fetchWeeks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/weeks`);
      const data = await response.json();
      setWeeks(data.weeks || []);
    } catch (err) {
      console.error('Failed to fetch weeks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  const handleUploadTimesheet = (weekId) => {
    fetchWeeks();
    setSelectedWeek(weekId);
    setGraphsGenerated(false);
  };

  const handleUploadCostEfficiency = () => {
    fetchWeeks();
    setGraphsGenerated(false);
  };

  const handleDeleteWeek = async (weekId) => {
    try {
      await fetch(`${API_URL}/weeks/${weekId}`, { method: 'DELETE' });
      fetchWeeks();
      if (selectedWeek === weekId) {
        setSelectedWeek(null);
        setWeekData(null);
        setGraphsGenerated(false);
      }
    } catch (err) {
      console.error('Failed to delete week:', err);
    }
  };

  const handleDeleteFile = async (weekId, fileType) => {
    try {
      await fetch(`${API_URL}/weeks/${weekId}/${fileType}`, { method: 'DELETE' });
      fetchWeeks();
      if (selectedWeek === weekId) {
        setGraphsGenerated(false);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleCreateGraphs = async () => {
    if (!selectedWeek) return;

    try {
      const response = await fetch(`${API_URL}/weeks/${selectedWeek}/data`);
      const data = await response.json();
      setWeekData(data);
      setGraphsGenerated(true);
    } catch (err) {
      console.error('Failed to fetch week data:', err);
    }
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const selectedWeekData = weeks.find(w => w.weekId === selectedWeek);
  const canCreateGraphs = selectedWeek && selectedWeekData?.hasCostEfficiency;

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>PM Report</h1>
          <SettingsIcon onClick={() => setSettingsOpen(true)} />
        </div>
      </header>

      <div className="main-container">
        <aside className="left-panel">
          <WeeklyDataManager
            weeks={weeks}
            onUploadTimesheet={handleUploadTimesheet}
            onUploadCostEfficiency={handleUploadCostEfficiency}
            onDeleteWeek={handleDeleteWeek}
            onDeleteFile={handleDeleteFile}
            selectedWeek={selectedWeek}
            onSelectWeek={setSelectedWeek}
          />

          <div className="create-graphs-section">
            <button
              className={`create-graphs-btn ${canCreateGraphs ? '' : 'disabled'}`}
              onClick={handleCreateGraphs}
              disabled={!canCreateGraphs}
            >
              Create Graphs
            </button>
            {!selectedWeek && <p className="hint">Select a week first</p>}
            {selectedWeek && !selectedWeekData?.hasCostEfficiency && (
              <p className="hint">Upload cost efficiency data first</p>
            )}
          </div>
        </aside>

        <main className="right-panel">
          <GraphPanel
            weekData={weekData}
            settings={settings}
            graphsGenerated={graphsGenerated}
          />
        </main>
      </div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}

export default App;
