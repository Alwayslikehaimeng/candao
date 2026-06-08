console.log('Starting Electron...');
console.log('Process version:', process.version);
console.log('Electron version:', process.versions.electron);

// Try to require electron
const electron = require('electron');
console.log('electron type:', typeof electron);
console.log('electron constructor:', electron?.constructor?.name);

// Check if it's a string (path)
if (typeof electron === 'string') {
  console.log('electron is a string:', electron);
} else {
  console.log('electron keys:', Object.keys(electron));
}
