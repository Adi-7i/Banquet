---
description: Run the full stack application (Frontend + Backend)
---

This workflow starts both the NestJS backend and the Next.js frontend in development mode.

1. Start the Backend Server
   - Open a terminal in the root directory `G:\Finding-new-code\Banquet`.
   - Run the following command:
   // turbo
   ```bash
   cmd.exe /c npm run start:dev
   ```

2. Start the Frontend Application
   - Open a new terminal in the frontend directory `G:\Finding-new-code\Banquet\frontend`.
   - Run the following command:
   // turbo
   ```bash
   cmd.exe /c npm run dev
   ```

3. Access the Application
   - Frontend: http://localhost:3000 (Check terminal output if port differs)
   - Backend API: http://localhost:3000 (This might conflict if both try to use 3000. Next.js usually detects and uses 3001 if 3000 is taken. We should verify ports).

   > Note: Next.js default port is 3000. NestJS default port is usually 3000. Configuring one to use a different port is recommended if they conflict.
