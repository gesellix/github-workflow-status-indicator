"use strict";

const isMac = process.platform === 'darwin'
const {ipcMain, Menu, nativeImage} = require('electron');
const settings = require('./config').load();

const iconPath = __dirname + "/assets/icons";
const mb = require('menubar').menubar({
  dir: __dirname + "/src",
  icon: iconPath + "/octicon-check-circle@2x.png",
  tooltip: "GitHub Workflow Status",
  preloadWindow: false,
  supportsTrayHighlightState: true,
  browserWindow: {
    webPreferences: {nodeIntegration: true},
  }
});

// mb:
// {
//   app: the electron require('app') instance,
//   window: the electron require('browser-window') instance,
//   tray: the electron require('tray') instance,
//   positioner: the electron-positioner instance,
//   setOption(option, value): change an option after menubar is created,
//   getOption(option): get an menubar option,
//   showWindow(): show the menubar window,
//   hideWindow(): hide the menubar window
// }

const iconPathByStatus = {
  '': iconPath + "/octicon-question@2x.png",
  'unknown-error': iconPath + "/octicon-question@2x.png",
  'ok': iconPath + "/octicon-check-circle@2x.png",
  'warning': iconPath + "/octicon-hourglass@2x.png",
  'critical': iconPath + "/octicon-x-circle@2x.png"
};

function updateStatusIndicator(status) {
  if (!!iconPathByStatus[status]) {
    let image = nativeImage.createFromPath(iconPathByStatus[status]);
    mb.tray.setImage(image);
  }
// todo else -> show 'status unknown' icon
}

const ghWorkflowStatus = require('./src/github-workflow-status');

function updateAlerts() {
  ghWorkflowStatus.run(settings, (result, error) => {
    if (error) {
      console.log('error', error);
      updateStatusIndicator('unknown-error');
      if (mb.window) {
        mb.window.webContents.send('error', error);
      }
    }

    if (result) {
      console.log('result', result);
      updateStatusIndicator(result.status);
      if (mb.window) {
        mb.window.webContents.send('update', result.status, result);
      }
    }
  });
}

ipcMain.on('renderer-mounted', (event, data) => {
  event.sender.send('config', settings.config)
})

ipcMain.on('close-app', (event, data) => {
  mb.app.quit();
})

mb.on('ready', function ready() {
  console.log('app is ready');
  mb.tray.setContextMenu(Menu.buildFromTemplate([
    {label: 'Quit', type: 'normal', role: isMac ? 'close' : 'quit'},
  ]))

  updateAlerts();
  setInterval(updateAlerts, settings.config.pollInterval);
});

mb.on('after-create-window', function () {
  // console.log('after-create-window');
  // mb.window.openDevTools();
  // console.log(mb.window.webContents);

  mb.app.on('web-contents-created', function (e, webContents) {
    // console.log('web-contents-created');
    // webContents.openDevTools();
  });
});

// mb.once('show', function() {
// console.log('once(show)');
//mb.window.openDevTools();
// });

// mb.on('show', function () {
//   console.log('show');
//   mb.window.openDevTools();
// });
