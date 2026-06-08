const { app, BrowserWindow } = require('electron');
console.log('app:', typeof app);
console.log('BrowserWindow:', typeof BrowserWindow);
if (app) {
  app.whenReady().then(() => {
    console.log('App is ready!');
    app.quit();
  });
}
