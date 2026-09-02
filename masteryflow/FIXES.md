# MasteryFlow - Quick Fixes

## Issue 1: Build Errors
```bash
cd masteryflow
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build