#!/bin/bash
cd server && node index.js &
sleep 3
while ! curl -s http://localhost:3001/api/weeks > /dev/null 2>&1; do
    sleep 1
done
echo "Backend is ready"
cd client && npm start
