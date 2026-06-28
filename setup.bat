@echo off
echo ============================================
echo   BlockVote — Automated Setup Script
echo ============================================
echo.

echo [1/4] Installing Blockchain dependencies...
cd blockchain
call npm install
if %errorlevel% neq 0 (echo ERROR in blockchain install & pause & exit /b 1)
echo Done.
echo.

echo [2/4] Installing Backend dependencies...
cd ..\backend
call npm install
if %errorlevel% neq 0 (echo ERROR in backend install & pause & exit /b 1)
echo Done.
echo.

echo [3/4] Installing Frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (echo ERROR in frontend install & pause & exit /b 1)
echo Done.
echo.

echo [4/4] Seeding Admin account in MongoDB...
cd ..\backend
call node scripts/seedAdmin.js
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo NEXT STEPS:
echo   1. Open Terminal 1: cd blockchain ^&^& npx hardhat node
echo   2. Open Terminal 2: cd blockchain ^&^& npx hardhat run scripts/deploy.js --network localhost
echo      --> Copy the contract address, update frontend/src/utils/config.js
echo   3. Open Terminal 3: cd backend ^&^& npm run dev
echo   4. Open Terminal 4: cd frontend ^&^& npm start
echo.
echo Admin Login: admin@voting.com / Admin@123
echo.
pause
