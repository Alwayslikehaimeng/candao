const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

console.log('electron type:', typeof electron);
console.log('electron keys:', Object.keys(electron));

app.whenReady().then(() => {
  console.log('App is ready!');
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('data:text/html,<h1>Hello!</h1>');
  setTimeout(() => app.quit(), 3000);
});
