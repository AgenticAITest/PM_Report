# PM Report

A web application for project management reporting that processes timesheet and cost efficiency CSV data to generate visualizations and analytics.

## Tech Stack

- **Frontend**: React 18 (in `client/`)
- **Backend**: Node.js with Express (in `server/`)
- **Charts**: Chart.js with react-chartjs-2
- **File Upload**: Multer for CSV file handling

## Project Structure

```
client/           # React frontend
  src/
    App.js        # Main component with file upload UI
    *.js          # Various visualization components
  public/
    index.html
  package.json

server/           # Express backend API
  index.js        # Server with upload endpoints and CSV parsing
  uploads/        # Uploaded CSV files stored here
  data/           # Weekly data JSON storage
  package.json

start.sh          # Development startup script
```

## Running Locally

The project uses a single workflow that starts both the backend and frontend:

1. Backend (Express): Runs on port 3001 (localhost)
2. Frontend (React): Runs on port 5000 (0.0.0.0, proxies API to backend)

The `start.sh` script handles starting both services.

## API Endpoints

- `GET /api/weeks` - Get all uploaded weeks
- `POST /api/weeks/upload/timesheet` - Upload timesheet CSV (auto-detects week)
- `POST /api/weeks/:weekId/upload/cost-efficiency` - Upload cost efficiency CSV for a week
- `GET /api/weeks/:weekId` - Get week details
- `GET /api/weeks/:weekId/data` - Get processed data for graphs
- `DELETE /api/weeks/:weekId` - Delete a week's data
- `DELETE /api/weeks/:weekId/:fileType` - Delete specific file from week

## CSV File Formats

### Timesheet CSV
Columns: No, Date, User, Activity, Work Package, Comment, Project, Hour, OP-ID, Timesheet Category

### Cost Efficiency CSV
Columns: No, Status, PM, Project Name, Budget-Internal, Budget-Buffer, Budget-Total, Budget-Spent, Budget-Percentage, Project_Progress, Budget_Overrun, Budget_Underrun, CE_Indicator

## Data Format Notes

- Numbers use comma as decimal separator (European format, e.g., "40,00" = 40.00)
- Dates are in YYYY-MM-DD format
- Hours are recorded in decimal format with comma separator

## Deployment

For production deployment, the build step compiles the React frontend and the server serves both the API and static files on port 5000.
