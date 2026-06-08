const { app, BrowserWindow } = require('electron');
console.log('Electron loaded successfully');
console.log('app:', typeof app);
console.log('app.isPackaged:', app?.isPackaged);
app.whenReady().then(() => {
  console.log('App is ready');
  app.quit();
});
