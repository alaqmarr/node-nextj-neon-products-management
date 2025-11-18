#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Backend Setup & Start ---
echo "--- Setting up Backend ---"
cd backend

echo "Installing backend dependencies..."
npm install

echo "Running Prisma Generate..."
npx prisma generate

echo "Running Prisma Dev Migrations..."
# This ensures your database is in sync before starting.
npx prisma db push

echo "Starting backend server (logging to backend.log)..."
# Run in the background (&) and redirect stdout/stderr to a log file
npm run dev > ../backend.log 2>&1 &

cd ..

# --- Frontend Setup & Start ---
echo "--- Setting up Frontend ---"
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Starting frontend server (logging to frontend.log)..."
# Run in the background (&) and redirect stdout/stderr to a log file
npm run dev > ../frontend.log 2>&1 &

cd ..

# --- Monitor Logs ---
echo "--- Servers running in background ---"
echo "Tailing logs from backend.log and frontend.log"
echo "Press Ctrl+C to stop tailing (servers will keep running)."

# Clear old logs if they exist, to avoid confusion
> backend.log
> frontend.log

# Tail both log files.
tail -f backend.log frontend.log