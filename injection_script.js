const { BrowserWindow, Notification } = require('electron');

const window = BrowserWindow.getAllWindows()[0];

const n = new Notification({
    title: 'GET FUCKED!',
    body: 'Go check it out github.com/Probabilities'
});

n.show()

const script = `alert('GET FUCKED! github.com/Probabilities')`
window.webContents.executeJavaScript(script, !0);

window.cum() // Deliberate error to crash the client