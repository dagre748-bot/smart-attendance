# AttendEase

A modern, QR-code based attendance management system built with React, Node.js, and Prisma.

## Features

- **QR-Based Attendance**: Fast and secure attendance marking using short-lived QR tokens.
- **Teacher Dashboard**: Manage classes, subjects, and schedules. Mark attendance manually or via scan.
- **Student Dashboard**: Real-time attendance statistics and history. Generate secure QR codes.
- **Automatic Notifications**: Real-time updates via Socket.io when attendance is marked.
- **Export Reports**: Download attendance records as Excel files.
- **Responsive Design**: Works on desktops, tablets, and mobile devices.

## Technology Stack

- **Frontend**: Vite, React, TypeScript, Lucide Icons, Chart.js.
- **Backend**: Node.js, Express, Prisma (PostgreSQL), Socket.io, JWT.
- **Database**: PostgreSQL (Neon.tech recommended).

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### Installation

1. Install dependencies for both frontend and backend:
   ```bash
   npm run install:all
   ```

2. Set up environment variables:
   - Create a `.env` file in the `backend` directory:
     ```env
     PORT=5000
     DATABASE_URL="your_postgresql_url"
     JWT_SECRET="your_secret_key"
     ```
   - (Optional) Create a `.env` file in the `frontend` directory:
     ```env
     VITE_API_URL="http://localhost:5000/api"
     ```

3. Initialize the database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

### Running the System

- **Development Mode**:
  Run backend and frontend separately:
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && npm run dev`

- **Production Build**:
  ```bash
  npm run build:all
  npm start
  ```

## Usage

- **Teachers**: Register/Login, Create a Class, Add Subjects, and Start Scanning or Generating Schedules.
- **Students**: Register/Login with the Class ID provided by your teacher. Show your QR code to the teacher or check your history.
