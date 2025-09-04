You are opening the Counsel Framework web interface. This command starts the Next.js development server for the web application.

## Primary Task
Start the Next.js development server (configured to run on port 3555) using the CLI command.

## Implementation Steps

1. **Try using the CLI command first**
   ```bash
   counsel open
   ```
   
   This should start the server and display:
   - 🚀 Starting Counsel Framework Web Interface...
   - Access at: http://localhost:3555
   
2. **If the CLI command fails (command not found), use fallback method:**

   ```bash
   # Navigate to web directory
   cd web
   
   # Check and install dependencies if needed
   if [ ! -d "node_modules" ]; then
     echo "📦 Installing dependencies..."
     npm install
   fi
   
   # Start the development server
   npm run dev
   ```

## Success Indicators
- Server starts successfully on port 3555
- Console shows access URL: http://localhost:3555
- Browser can access the interface at http://localhost:3555

## Error Handling
- If port 3555 is already in use, the server will notify and exit
- If counsel command not found, use the fallback method
- If dependencies fail to install, npm will provide error details
- If server fails to start, check the console output for Next.js errors

## Notes
- The web interface provides a web-based UI for managing Counsel Framework projects
- Port 3555 is the default port configured in package.json
- The server runs in development mode with hot reloading enabled
- Press Ctrl+C to stop the server