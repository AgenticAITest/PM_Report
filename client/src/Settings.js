import React, { useState } from 'react';
import './Settings.css';

const DEFAULT_VARIANCE_THRESHOLDS = [
  { label: 'Excellent', maxVariance: 0, color: '#4caf50' },
  { label: 'Normal', maxVariance: 10, color: '#2196f3' },
  { label: 'Warning', maxVariance: 20, color: '#ff9800' },
  { label: 'Need Attention', maxVariance: 30, color: '#f57c00' },
  { label: 'Need Action', maxVariance: Infinity, color: '#f44336' },
];

function Settings({ isOpen, onClose, settings, onSaveSettings }) {
  const [thresholds, setThresholds] = useState(settings.varianceThresholds || DEFAULT_VARIANCE_THRESHOLDS);

  const handleThresholdChange = (index, field, value) => {
    const updated = [...thresholds];
    if (field === 'maxVariance') {
      updated[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
    setThresholds(updated);
  };

  const handleSave = () => {
    onSaveSettings({ ...settings, varianceThresholds: thresholds });
    onClose();
  };

  const handleReset = () => {
    setThresholds(DEFAULT_VARIANCE_THRESHOLDS);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Variance Thresholds</h3>
            <p className="settings-description">
              Variance = Budget Spent (%) - Project Progress (%)
            </p>

            <div className="thresholds-table">
              <div className="threshold-header">
                <span>Category</span>
                <span>Max Variance (%)</span>
                <span>Color</span>
              </div>

              {thresholds.map((threshold, index) => (
                <div key={index} className="threshold-row">
                  <input
                    type="text"
                    value={threshold.label}
                    onChange={(e) => handleThresholdChange(index, 'label', e.target.value)}
                    className="threshold-label-input"
                  />
                  <div className="threshold-value">
                    {index === thresholds.length - 1 ? (
                      <span className="infinity">&gt; {thresholds[index - 1]?.maxVariance || 0}</span>
                    ) : (
                      <input
                        type="number"
                        value={threshold.maxVariance}
                        onChange={(e) => handleThresholdChange(index, 'maxVariance', e.target.value)}
                        min="0"
                        className="threshold-number-input"
                      />
                    )}
                  </div>
                  <input
                    type="color"
                    value={threshold.color}
                    onChange={(e) => handleThresholdChange(index, 'color', e.target.value)}
                    className="threshold-color-input"
                  />
                </div>
              ))}
            </div>

            <div className="threshold-legend">
              <p><strong>How it works:</strong></p>
              <ul>
                {thresholds.map((t, i) => (
                  <li key={i}>
                    <span className="legend-color" style={{ backgroundColor: t.color }}></span>
                    <strong>{t.label}:</strong> Variance {i === 0 ? '≤' : '>'} {i === 0 ? t.maxVariance : thresholds[i - 1].maxVariance}%
                    {i < thresholds.length - 1 && t.maxVariance !== Infinity && ` and ≤ ${t.maxVariance}%`}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="reset-btn" onClick={handleReset}>Reset to Default</button>
          <div className="footer-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="save-btn" onClick={handleSave}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_VARIANCE_THRESHOLDS };
export default Settings;
