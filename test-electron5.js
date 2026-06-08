console.log('Starting...');
console.log('process.type:', process.type);

// In Electron, process.type is 'browser' for main process
if (process.type === 'browser') {
  console.log('Running in Electron main process');
  const { app, BrowserWindow } = require('electron');
  console.log('app:', typeof app);
} else {
  console.log('NOT running in Electron main process');
  console.log('process.type:', process.type);
}
