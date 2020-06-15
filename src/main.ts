import * as path from 'path';
import * as url from 'url';
import { app, BrowserWindow, protocol } from 'electron';

import { readFile } from 'fs';
import { join } from 'path';
const es6Path = join( __dirname, '..', 'static' );

protocol.registerSchemesAsPrivileged([
  { scheme: 'es6', privileges: { standard: true } }
])

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

const mode = process.env.NODE_ENV;

function reloadOnChange(win: BrowserWindow) {
	if (mode !== 'development') return { close: () => {} };

	const watcher = require('chokidar').watch(path.join(__dirname, '**'), { ignoreInitial: true });

	watcher.on('change', () => {
		win.reload();
	});

	return watcher;
}

function launch() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 600,
		backgroundColor: 'white',
		titleBarStyle: 'hidden',
		webPreferences: {
			nodeIntegration: true,
			webSecurity: false
		}
	});


	win.loadURL(
		url.format({
			pathname: path.resolve(__dirname, '../static/index.html'),
			protocol: 'file:',
			slashes: true
		})
	);


	const watcher = reloadOnChange(win);

	win.on('closed', function() {
		win = null;
		watcher.close();
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	protocol.registerBufferProtocol( 'es6', ( req, cb ) => {
    readFile(
      join( es6Path, req.url.replace( 'es6://', '' ) ),
      (e, b) => { cb( { mimeType: 'text/javascript', data: b } ) }
    )
  })

	launch();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		launch();
	}
});
