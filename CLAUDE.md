# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PM Report is a web application for project management reporting. It processes timesheet and cost efficiency CSV data to generate visualizations and analytics.

## Tech Stack

- **Frontend**: React 18 (client/)
- **Backend**: Node.js with Express (server/)
- **File Upload**: Multer for CSV file handling

## Development Commands

```bash
# Install dependencies (run in both directories)
cd server && npm install
cd client && npm install

# Start backend server (port 3001)
cd server && npm run dev

# Start frontend dev server (port 3000)
cd client && npm start
```

Run both servers simultaneously for development. The React dev server proxies API requests to the backend.

## Project Structure

```
server/
  index.js        # Express server with upload endpoints
  uploads/        # Uploaded CSV files stored here

client/
  src/
    App.js        # Main component with file upload UI
    App.css       # Application styles
```

## API Endpoints

- `POST /api/upload/timesheet` - Upload timesheet CSV
- `POST /api/upload/cost-efficiency` - Upload cost efficiency CSV
- `GET /api/files` - Get current uploaded files status
- `DELETE /api/files` - Clear all uploaded files

## Data Format Notes

- Numbers use comma as decimal separator (European format, e.g., "40,00" = 40.00)
- Dates are in YYYY-MM-DD format
- Hours are recorded in decimal format with comma separator

## CSV File Structure

### Cost Efficiency CSV
Columns: No, Status, PM, Project Name, Budget-Internal, Budget-Buffer, Budget-Total, Budget-Spent, Budget-Percentage, Project_Progress, Budget_Overrun, Budget_Underrun, CE_Indicator

### Timesheet CSV
Columns: No, Date, User, Activity, Work Package, Comment, Project, Hour, OP-ID, Timesheet Category
