console.log('Starting Electron...');
console.log('Process version:', process.version);
console.log('Process versions:', process.versions);

try {
  const { app, BrowserWindow } = require('electron');
  console.log('electron.app:', app);
  console.log('electron.BrowserWindow:', BrowserWindow);
} catch (e) {
  console.error('Error loading electron:', e);
}
