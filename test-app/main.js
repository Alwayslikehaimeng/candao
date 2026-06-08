const { app, BrowserWindow } = require('electron');
console.log('Electron API loaded!');
console.log('app type:', typeof app);
console.log('app.whenReady:', typeof app?.whenReady);

app.whenReady().then(() => {
  console.log('App is ready!');
  const win = new BrowserWindow({ width: 400, height: 300 });
  win.loadURL('data:text/html,<h1>Hello from Electron!</h1>');
  setTimeout(() => { app.quit(); }, 3000);
});
