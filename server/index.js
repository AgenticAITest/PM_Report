const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Helper function to parse European number format (comma as decimal separator)
function parseEuropeanNumber(str) {
  if (!str || str === '') return null;
  const cleaned = str.replace('%', '').trim();
  if (cleaned === '') return null;
  return parseFloat(cleaned.replace(',', '.'));
}

// Parse CSV content
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Get ISO week number from date
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { week: weekNo, year: d.getFullYear() };
}

// Detect week from timesheet data (uses Date column)
function detectWeekFromTimesheet(content) {
  const rows = parseCSV(content);
  if (rows.length === 0) return null;

  // Find the most common week in the data
  const weekCounts = {};
  rows.forEach(row => {
    if (row['Date']) {
      const { week, year } = getWeekNumber(row['Date']);
      const key = `${year}-W${week}`;
      weekCounts[key] = (weekCounts[key] || 0) + 1;
    }
  });

  // Return the week with most entries
  let maxCount = 0;
  let detectedWeek = null;
  for (const [key, count] of Object.entries(weekCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedWeek = key;
    }
  }

  return detectedWeek;
}

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Data file path
const weeklyDataFile = path.join(dataDir, 'weekly-data.json');

// Load weekly data from file
function loadWeeklyData() {
  try {
    if (fs.existsSync(weeklyDataFile)) {
      return JSON.parse(fs.readFileSync(weeklyDataFile, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load weekly data:', e);
  }
  return {};
}

// Save weekly data to file
function saveWeeklyData(data) {
  fs.writeFileSync(weeklyDataFile, JSON.stringify(data, null, 2));
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Middleware
app.use(cors());
app.use(express.json());

// Get all weekly data
app.get('/api/weeks', (req, res) => {
  const data = loadWeeklyData();
  const weeks = Object.entries(data).map(([weekId, weekData]) => ({
    weekId,
    ...weekData,
    hasTimesheet: !!weekData.timesheet,
    hasCostEfficiency: !!weekData.costEfficiency
  })).sort((a, b) => b.weekId.localeCompare(a.weekId));
  res.json({ weeks });
});

// Upload timesheet for a week
app.post('/api/weeks/upload/timesheet', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const detectedWeek = detectWeekFromTimesheet(content);

    if (!detectedWeek) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Could not detect week from timesheet data' });
    }

    const data = loadWeeklyData();

    // If week already has timesheet, delete old file
    if (data[detectedWeek]?.timesheet?.path && fs.existsSync(data[detectedWeek].timesheet.path)) {
      fs.unlinkSync(data[detectedWeek].timesheet.path);
    }

    if (!data[detectedWeek]) {
      data[detectedWeek] = { createdAt: new Date().toISOString() };
    }

    data[detectedWeek].timesheet = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    saveWeeklyData(data);

    res.json({
      message: 'Timesheet uploaded successfully',
      weekId: detectedWeek,
      file: data[detectedWeek].timesheet
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to process timesheet file' });
  }
});

// Upload cost efficiency for a specific week
app.post('/api/weeks/:weekId/upload/cost-efficiency', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { weekId } = req.params;
  const data = loadWeeklyData();

  if (!data[weekId]) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Week not found. Please upload timesheet first.' });
  }

  // If week already has cost efficiency, delete old file
  if (data[weekId].costEfficiency?.path && fs.existsSync(data[weekId].costEfficiency.path)) {
    fs.unlinkSync(data[weekId].costEfficiency.path);
  }

  data[weekId].costEfficiency = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };

  saveWeeklyData(data);

  res.json({
    message: 'Cost efficiency file uploaded successfully',
    weekId,
    file: data[weekId].costEfficiency
  });
});

// Get data for a specific week
app.get('/api/weeks/:weekId', (req, res) => {
  const { weekId } = req.params;
  const data = loadWeeklyData();

  if (!data[weekId]) {
    return res.status(404).json({ error: 'Week not found' });
  }

  res.json({ weekId, ...data[weekId] });
});

// Delete a specific week's data
app.delete('/api/weeks/:weekId', (req, res) => {
  const { weekId } = req.params;
  const data = loadWeeklyData();

  if (!data[weekId]) {
    return res.status(404).json({ error: 'Week not found' });
  }

  // Delete files
  if (data[weekId].timesheet?.path && fs.existsSync(data[weekId].timesheet.path)) {
    fs.unlinkSync(data[weekId].timesheet.path);
  }
  if (data[weekId].costEfficiency?.path && fs.existsSync(data[weekId].costEfficiency.path)) {
    fs.unlinkSync(data[weekId].costEfficiency.path);
  }

  delete data[weekId];
  saveWeeklyData(data);

  res.json({ message: 'Week data deleted successfully' });
});

// Delete specific file from a week
app.delete('/api/weeks/:weekId/:fileType', (req, res) => {
  const { weekId, fileType } = req.params;

  if (!['timesheet', 'costEfficiency'].includes(fileType)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }

  const data = loadWeeklyData();

  if (!data[weekId]) {
    return res.status(404).json({ error: 'Week not found' });
  }

  if (data[weekId][fileType]?.path && fs.existsSync(data[weekId][fileType].path)) {
    fs.unlinkSync(data[weekId][fileType].path);
  }

  delete data[weekId][fileType];

  // If both files are gone, remove the week entirely
  if (!data[weekId].timesheet && !data[weekId].costEfficiency) {
    delete data[weekId];
  }

  saveWeeklyData(data);

  res.json({ message: `${fileType} deleted successfully` });
});

// Get processed data for graph generation
app.get('/api/weeks/:weekId/data', (req, res) => {
  const { weekId } = req.params;
  const data = loadWeeklyData();

  if (!data[weekId]) {
    return res.status(404).json({ error: 'Week not found' });
  }

  const result = { weekId };

  // Parse cost efficiency data
  if (data[weekId].costEfficiency?.path && fs.existsSync(data[weekId].costEfficiency.path)) {
    try {
      const content = fs.readFileSync(data[weekId].costEfficiency.path, 'utf-8');
      const rows = parseCSV(content);

      result.projects = rows.map(row => {
        const budgetPercentage = parseEuropeanNumber(row['Budget-Percentage']);
        const projectProgress = parseEuropeanNumber(row['Project_Progress']);
        let variance = null;
        if (budgetPercentage !== null && projectProgress !== null) {
          variance = budgetPercentage - projectProgress;
        }

        return {
          no: row['No'],
          status: row['Status'],
          pm: row['PM'],
          projectName: row['Project Name'],
          budgetInternal: parseEuropeanNumber(row['Budget-Internal']),
          budgetBuffer: parseEuropeanNumber(row['Budget-Buffer']),
          budgetTotal: parseEuropeanNumber(row['Budget-Total']),
          budgetSpent: parseEuropeanNumber(row['Budget-Spent']),
          budgetPercentage,
          projectProgress,
          budgetOverrun: parseEuropeanNumber(row['Budget_Overrun']),
          budgetUnderrun: parseEuropeanNumber(row['Budget_Underrun']),
          ceIndicator: row['CE_Indicator'],
          variance
        };
      });
    } catch (err) {
      console.error('Failed to parse cost efficiency:', err);
    }
  }

  // Parse timesheet data
  if (data[weekId].timesheet?.path && fs.existsSync(data[weekId].timesheet.path)) {
    try {
      const content = fs.readFileSync(data[weekId].timesheet.path, 'utf-8');
      const rows = parseCSV(content);

      result.timesheetEntries = rows.map(row => ({
        no: row['No'],
        date: row['Date'],
        user: row['User'],
        activity: row['Activity'],
        workPackage: row['Work Package'],
        comment: row['Comment'],
        project: row['Project'],
        hour: parseEuropeanNumber(row['Hour']),
        opId: row['OP-ID'],
        timesheetCategory: row['Timesheet Category']
      }));
    } catch (err) {
      console.error('Failed to parse timesheet:', err);
    }
  }

  res.json(result);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
