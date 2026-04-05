// save as server.js
// npm install express ws axios fca-mafiya

const fs = require('fs');
const express = require('express');
const wiegine = require('fca-mafiya');
const WebSocket = require('ws');
const axios = require('axios');
const crypto = require('crypto');

// Express app shuru karein
const app = express();
const PORT = process.env.PORT || 20124;

// Configuration
let globalConfig = {
  delay: 5
};

// Sessions store
const sessions = {};

// Cookie files folder
const COOKIE_FOLDER = './cookies';
if (!fs.existsSync(COOKIE_FOLDER)) {
  fs.mkdirSync(COOKIE_FOLDER);
}

// Utility: secure random stop key
function genStopKey(len = 8) {
  const prefix = 'LEGENDWALEED';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  const randomBytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    s += chars.charAt(randomBytes[i] % chars.length);
  }
  return prefix + s;
}

// Uppercase broadcast
function broadcastToAll(message) {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(payload); } catch (e) { /* ignore */ }
    }
  });
}

// Single client ko message
function sendToClient(ws, message) {
  try { ws.send(JSON.stringify(message)); } catch (e) { /* ignore */ }
}

// Session log
function sessionLog(stopKey, text) {
  const msg = String(text).toUpperCase();
  broadcastToAll({ type: 'log', message: `[${stopKey}] ${msg}` });
}

// WebSocket server reference
let wss;

// HTML Control Panel (SAME AS BEFORE)
const htmlControlPanel = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LEGEND WALEED CONTROL</title>
<style>
  *{box-sizing:border-box;font-family:Roboto,Inter,system-ui,Arial,sans-serif}
  html,body{height:100%;margin:0;background:#000;color:#dfefff}
  
  @keyframes colorShift {
    0% { background: linear-gradient(180deg, #100000 0%, #330000 40%, #1a0a0a 100%); }
    16% { background: linear-gradient(180deg, #100010 0%, #330033 40%, #1a0a1a 100%); }
    33% { background: linear-gradient(180deg, #000000 0%, #1a0000 40%, #100000 100%); }
    50% { background: linear-gradient(180deg, #1a1a00 0%, #333300 40%, #1a1a0a 100%); }
    66% { background: linear-gradient(180deg, #001000 0%, #003300 40%, #0a1a0a 100%); }
    83% { background: linear-gradient(180deg, #1a001a 0%, #330033 40%, #100010 100%); }
    100% { background: linear-gradient(180deg, #100000 0%, #330000 40%, #1a0a0a 100%); } 
  }

  body{
    overflow-y:auto;
    padding-bottom:50px;
    font-size: 16px; 
    perspective: 1800px; 
    animation: colorShift 30s infinite alternate ease-in-out; 
  }
  
  header{
    padding: 0; 
    display:flex;
    align-items:center;
    gap:20px;
    border-bottom:none; 
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;
    height: 10px; 
  }
  header h1{
    display: none; 
  }
  
  header .sub{
    display: none; 
  }
  
  .container{max-width:1100px;margin:30px auto;padding:25px} 
  .panel{
    background: rgba(10,25,40,0.95); 
    border:2px solid rgba(135,206,250,0.3); 
    padding:25px; 
    border-radius:18px; 
    margin-bottom:35px; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.95); 
    transform-style: preserve-3d;
    transform: rotateX(1deg); 
  }
  
  label{font-size:15px;color:#00ff88;font-weight: 500; transform: translateZ(5px); display: block;} 
  small{display: none;}
  
  .row{display:grid;grid-template-columns:1fr 1fr;gap:25px} 
  .full{grid-column:1/3}
  .input-group > div {margin-bottom: 20px;} 

  .section-title {
    color: #ffff00;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 0, 0.3);
    transform: translateZ(5px);
  }

  .cookie-section {
    margin-bottom: 30px;
  }

  .cookie-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 15px;
  }

  .cookie-opts {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    transform: translateZ(5px);
  }
  .cookie-opts label {
    display: flex;
    align-items: center;
    transform: none;
    color: #00ff88;
    font-size: 16px;
  }

  .thread-delay-section {
    margin-bottom: 30px;
  }

  .thread-delay-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 15px;
  }

  .prefix-message-section {
    margin-bottom: 30px;
  }

  .prefix-message-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 15px;
  }

  .controls-section {
    margin-top: 30px;
  }

  .controls-row {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 15px;
  }

  input[type="text"], input[type="number"], textarea, input[type=file] {
    height:50px; 
    padding:16px;
    border-radius:12px;
    border:1px solid rgba(60,120,200,0.4);
    background: rgba(4,15,30,0.9);
    color:#dfefff;
    outline:none;
    font-size:17px;
    width: 100%;
    margin-top: 6px; 
    box-shadow: inset 0 3px 8px rgba(0,0,0,0.7), 0 5px 10px rgba(0,0,0,0.5); 
    transition: all 0.3s;
    transform: translateZ(10px); 
  }
  input[type="text"]:focus, input[type="number"]:focus, textarea:focus {
    border-color: #87cefa; 
    box-shadow: inset 0 3px 8px rgba(0,0,0,0.7), 0 0 10px rgba(135,206,250,0.3);
    transform: translateZ(15px); 
  }
  
  textarea{height:120px; padding-top:16px; resize:vertical; transform: translateZ(10px);} 
  .blue-input{background:linear-gradient(180deg,#021020,#000e1a);border:1px solid rgba(30,120,210,0.7)}
  
  input[type="file"]::file-selector-button {
      text-transform: uppercase;
      background: rgba(30,120,210,0.7);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
  }

  .controls-row{
    display:flex;
    gap:15px; 
    flex-wrap:wrap;
    align-items: center; 
  } 
  button{
    height: 50px; 
    border:0;
    cursor:pointer;
    color:white;
    font-weight:700;
    border-radius: 25px; 
    padding-left:25px;
    padding-right:25px;
    font-size:16px; 
    box-shadow: 0 8px 15px rgba(0,0,0,0.5); 
    transition: transform 0.1s, box-shadow 0.3s;
    transform: translateZ(15px); 
    flex: 1; 
    min-width: 150px; 
  }
  button:hover:not(:disabled) {
      transform: translateY(-3px) translateZ(20px); 
      filter: brightness(1.2);
  }
  button:disabled{opacity:.4;cursor:not-allowed; transform: translateZ(10px);}
  
  #start-btn { 
    background: #00ff88; 
    color: #000; 
    box-shadow: 0 8px 15px rgba(0,255,136,0.6); 
    flex: 1.5;
  }
  #stop-server-btn { 
    background: #ff4d4d; 
    color: #fff; 
    box-shadow: 0 8px 15px rgba(255,77,77,0.6); 
    flex: 1;
  } 
  #view-logs-btn { 
    background: #0b7dda; 
    color: #fff; 
    box-shadow: 0 8px 15px rgba(11,125,218,0.6); 
    flex: 1;
  } 
  
  #stop-key-input {
    flex: 2; 
    min-width: 300px; 
    height: 50px; 
    margin-top: 0;
    padding: 16px 20px; 
    border-radius: 25px; 
    transform: translateZ(15px); 
    box-shadow: 0 8px 15px rgba(0,0,0,0.5); 
    background: rgba(4,15,30,0.9);
    border: 1px solid rgba(60,120,200,0.4);
    color: #dfefff;
  }
  #stop-key-input:focus {
      transform: translateY(-3px) translateZ(20px); 
      border-color: #87cefa;
  }

  #status {
    flex: 1;
    min-width: 120px;
    font-size: 16px !important;
    text-align: center;
    color: #00ff88; 
    text-shadow: 0 0 5px rgba(0,255,136,0.5);
    transform: translateZ(10px); 
    background: rgba(0, 40, 0, 0.3);
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(0, 255, 136, 0.3);
  }
  #status.hidden {
    opacity: 0.3;
  }
  
  .log-container-wrap{
      height:350px; 
      overflow:auto;
      background:#000000;
      border-radius:15px;
      padding:20px;
      font-family:'Consolas', monospace;
      color:#00ff88; 
      border:3px solid rgba(0,255,136,0.3);
      box-shadow: inset 0 0 20px rgba(0,255,136,0.15); 
      transform: translateZ(10px); 
  }
  .log{
    min-height: 100%;
  }
  
  @media (max-width:850px){
    .container {padding: 15px; margin: 15px auto;}
    
    .cookie-row,
    .thread-delay-row,
    .prefix-message-row {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .full{grid-column:auto}
    
    .controls-row {
      flex-direction: column;
      align-items: stretch;
      gap: 15px;
    }
    
    button, #stop-key-input, #status {
      width: 100%; 
      min-width: auto; 
      text-align: center; 
      flex: unset !important;
    }
    
    #status { 
      order: -1; 
      margin-bottom: 10px; 
    } 
    
    #view-logs-btn { 
      order: 10; 
    } 
  }
</style>
</head>
<body>
  <header>
    <h1></h1>
    <div class="sub"></div>
  </header>

  <div class="container">
    <div class="panel input-group">
      <div class="cookie-section">
        <div class="section-title">𝐒𝐔𝐋𝐓𝐀𝐍 𝐗𝐃 𝐊𝐈𝐍𝐆💔</div>
        
        <div class="cookie-opts">
          <label><input type="radio" name="cookie-mode" value="file" checked> UPLOAD FILE</label>
          <label><input type="radio" name="cookie-mode" value="paste"> PASTE COOKIES</label>
        </div>
        
        <div class="cookie-row">
          <div id="cookie-file-wrap">
            <label for="cookie-file">𝘜𝘗𝘓𝘈𝘖𝘈𝘋 𝘊𝘖𝘖𝘒𝘐𝘚𝘌 𝘍𝘐𝘓𝘌.𝘛𝘟𝘛</label>
            <input id="cookie-file" type="file" accept=".txt,.json">
          </div>

          <div id="cookie-paste-wrap" style="display:none">
            <label for="cookie-paste">PASTE COOKIES HERE</label>
            <textarea id="cookie-paste" placeholder="PASTE COOKIES JSON OR RAW TEXT"></textarea>
          </div>
        </div>
      </div>

      <div class="thread-delay-section">
        <div class="section-title">THREAD & DELAY SETTINGS</div>
        
        <div class="thread-delay-row">
          <div>
            <label for="thread-id">THREAD/GROUP ID</label>
            <input id="thread-id" class="blue-input" type="text" placeholder="ENTER THREAD/GROUP ID">
          </div>

          <div>
            <label for="delay">DELAY (SECONDS)</label>
            <input id="delay" class="blue-input" type="number" value="5" min="1">
          </div>
        </div>
      </div>

      <div class="prefix-message-section">
        <div class="section-title">MESSAGE CONFIGURATION</div>
        
        <div class="prefix-message-row">
          <div>
            <label for="prefix">MESSAGE PREFIX (OPTIONAL)</label>
            <input id="prefix" class="blue-input" type="text" placeholder="PREFIX BEFORE EACH MESSAGE">
          </div>

          <div>
            <label for="message-file">MESSAGES FILE (.TXT)</label>
            <input id="message-file" type="file" accept=".txt">
          </div>
        </div>
      </div>

      <div class="controls-section">
        <div class="section-title">SERVER CONTROLS</div>
        
        <div class="controls-row">
          <button id="start-btn">START SERVER</button>
          
          <input id="stop-key-input" type="text" placeholder="STOP KEY (LEAVE BLANK TO GENERATE)">
          
          <button id="stop-server-btn">STOP SERVER</button>
          
          <div id="status" class="hidden"></div>
          
          <button id="view-logs-btn">VIEW LOGS</button>
        </div>
      </div>
    </div>

    <div class="panel" id="log-panel" style="display:none;">
      <h3 style="margin-top:0;color:#00ff88; transform: translateZ(5px);">LOGS</h3>
      <div class="log-container-wrap">
        <div class="log" id="log-container"></div>
      </div>
    </div>
  </div>

<script>
  const socketProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(socketProtocol + '//' + location.host);

  const logPanel = document.getElementById('log-panel');
  const logContainer = document.getElementById('log-container');
  const statusDiv = document.getElementById('status');
  const startBtn = document.getElementById('start-btn');
  const viewLogsBtn = document.getElementById('view-logs-btn');

  const cookieFileInput = document.getElementById('cookie-file');
  const cookiePaste = document.getElementById('cookie-paste');
  const threadIdInput = document.getElementById('thread-id');
  const delayInput = document.getElementById('delay');
  const prefixInput = document.getElementById('prefix');
  const messageFileInput = document.getElementById('message-file');

  const cookieFileWrap = document.getElementById('cookie-file-wrap');
  const cookiePasteWrap = document.getElementById('cookie-paste-wrap');

  const stopKeyInput = document.getElementById('stop-key-input');
  const stopServerBtn = document.getElementById('stop-server-btn');

  function hideStatusText() {
    statusDiv.textContent = '';
    statusDiv.classList.add('hidden');
  }
  
  function showStatus(text) {
    statusDiv.textContent = text;
    statusDiv.classList.remove('hidden');
  }
  
  function addLog(text){
    const d = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.textContent = '['+d+'] ' + String(text).toUpperCase().replace(/- LEGEND WALEED/g, '').trim();
    logContainer.appendChild(div);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  viewLogsBtn.addEventListener('click', () => {
      if(logPanel.style.display === 'none'){
          logPanel.style.display = 'block';
          viewLogsBtn.textContent = 'HIDE LOGS';
      } else {
          logPanel.style.display = 'none';
          viewLogsBtn.textContent = 'VIEW LOGS';
      }
  });

  socket.onopen = () => {
    addLog('CONNECTED TO SERVER WEBSOCKET');
    hideStatusText();
  };
  
  socket.onmessage = (ev) => {
    try{
      const data = JSON.parse(ev.data);
      if(data.type === 'log') addLog(data.message);
      if(data.type === 'status'){
        if(data.running && data.stopKey) {
            if (!stopKeyInput.value.trim() || !stopKeyInput.value.startsWith('LEGENDWALEED')){
              stopKeyInput.value = data.stopKey;
              addLog('STOP KEY GENERATED: ' + data.stopKey);
            }
        }
        
        if(data.running){
           showStatus('STATUS➠ SENDING MESSAGES [' + data.stopKey + ']');
        } else if (data.stopKey === stopKeyInput.value.trim() || !stopKeyInput.value.trim()) {
           hideStatusText();
        }
      }
    }catch(e){
      addLog('RECEIVED: ' + ev.data);
    }
  };
  
  socket.onclose = () => {
    addLog('WEBSOCKET DISCONNECTED');
    hideStatusText();
  }
  
  socket.onerror = (e) => addLog('WEBSOCKET ERROR');
  
  hideStatusText();

  document.querySelectorAll('input[name="cookie-mode"]').forEach(r=>{
    r.addEventListener('change',(ev)=>{
      if(ev.target.value === 'file'){
        cookieFileWrap.style.display = 'block';
        cookiePasteWrap.style.display = 'none';
      }else{
        cookieFileWrap.style.display = 'none';
        cookiePasteWrap.style.display = 'block';
      }
    });
  });

  startBtn.addEventListener('click', ()=>{
    const cookieMode = document.querySelector('input[name="cookie-mode"]:checked').value;
    if(cookieMode === 'file' && cookieFileInput.files.length === 0){
      addLog('PLEASE CHOOSE COOKIE FILE OR SWITCH TO PASTE OPTION');
      return;
    }
    if(cookieMode === 'paste' && cookiePaste.value.trim().length === 0){
      addLog('PLEASE PASTE COOKIES IN THE TEXTAREA');
      return;
    }
    if(!threadIdInput.value.trim()){
      addLog('PLEASE ENTER THREAD/GROUP ID');
      return;
    }
    if(messageFileInput.files.length === 0){
      addLog('PLEASE CHOOSE MESSAGES FILE (.TXT)');
      return;
    }

    const cookieModeValue = cookieMode;
    const cookieReader = new FileReader();
    const msgReader = new FileReader();

    const startSend = (cookieContent, messageContent) => {
      const payload = {
        type: 'start',
        cookieContent,
        messageContent,
        threadID: threadIdInput.value.trim(),
        delay: parseInt(delayInput.value) || 5,
        prefix: prefixInput.value.trim(),
        cookieMode: cookieModeValue,
        stopKey: (stopKeyInput.value || '').trim()
      };
      socket.send(JSON.stringify(payload));
      addLog('STARTING SUCCESSFUL - REQUEST SENT TO SERVER');
    };

    msgReader.onload = (e) => {
      const messageContent = e.target.result;
      if(cookieMode === 'paste'){
        startSend(cookiePaste.value, messageContent);
      }else{
        cookieReader.readAsText(cookieFileInput.files[0]);
        cookieReader.onload = (ev) => {
          startSend(ev.target.result, messageContent);
        };
        cookieReader.onerror = () => addLog('FAILED TO READ COOKIE FILE');
      }
    };
    msgReader.readAsText(messageFileInput.files[0]);
  });

  stopServerBtn.addEventListener('click', ()=>{
    const stopKey = (stopKeyInput.value||'').trim();
    if(!stopKey){
      addLog('ENTER STOP KEY TO STOP SESSION');
      return;
    }
    socket.send(JSON.stringify({type:'stopServer', stopKey}));
    stopKeyInput.value = '';
    hideStatusText();
  });

  addLog('CONTROL PANEL READY');
</script>
</body>
</html>
`;

// Session shuru karne ka function
function startSendingForSession(stopKey, cookieContent, messageContent, threadID, delay, prefix, ws) {
  if (!stopKey || sessions[stopKey]) {
    let attempts = 0;
    do {
      stopKey = genStopKey(8);
      attempts++;
      if (attempts > 10) {
        sessionLog(stopKey, 'CANNOT GENERATE UNIQUE STOP KEY');
        return null;
      }
    } while (sessions[stopKey]);
  }

  const cookieHash = crypto.createHash('md5').update(cookieContent).digest('hex').substring(0, 8);
  const cookiesFilename = `${COOKIE_FOLDER}/cookie_${cookieHash}_${Date.now()}.txt`;

  const session = {
    stopKey,
    cookiesFilename,
    threadID,
    messages: [],
    currentIndex: 0,
    loopCount: 0,
    delay: parseInt(delay) || globalConfig.delay,
    prefix: prefix || '',
    running: false,
    api: null,
    timerId: null,
    ws
  };

  try {
    fs.writeFileSync(session.cookiesFilename, cookieContent);
    sessionLog(stopKey, 'COOKIE SAVED SECURELY');
  } catch (err) {
    sessionLog(stopKey, `FAILED TO SAVE COOKIE: ${err.message}`);
    if (ws && ws.readyState === WebSocket.OPEN) sendToClient(ws, { type: 'log', message: `FAILED TO SAVE COOKIE: ${err.message}` });
    return null;
  }

  session.messages = messageContent
    .split('\n')
    .map(line => line.replace(/\r/g, '').trim())
    .filter(line => line.length > 0);

  if (session.messages.length === 0) {
    sessionLog(stopKey, 'NO MESSAGES FOUND IN FILE');
    try { fs.unlinkSync(session.cookiesFilename); } catch(e) {}
    return null;
  }

  sessions[stopKey] = session;

  broadcastToAll({ type: 'log', message: `SESSION STARTING WITH STOP KEY: ${stopKey}` });
  broadcastToAll({ type: 'status', running: true, stopKey });

  try {
    const cookieData = JSON.parse(cookieContent);
    wiegine.login({ appState: cookieData }, (err, api) => {
      if (err || !api) {
        sessionLog(stopKey, `LOGIN FAILED: ${err?.message || err}`);
        delete sessions[stopKey];
        try { fs.unlinkSync(session.cookiesFilename); } catch(e) {}
        broadcastToAll({ type: 'status', running: false, stopKey });
        return;
      }

      session.api = api;
      session.running = true;
      sessionLog(stopKey, 'LOGGED IN SUCCESSFULLY');
      sessionLog(stopKey, `TOTAL MESSAGES: ${session.messages.length}, DELAY: ${session.delay}s`);

      sendNextMessageForSession(stopKey);
    });
  } catch (parseErr) {
    wiegine.login(cookieContent, {}, (err, api) => {
      if (err || !api) {
        sessionLog(stopKey, `LOGIN FAILED: ${err?.message || err}`);
        delete sessions[stopKey];
        try { fs.unlinkSync(session.cookiesFilename); } catch(e) {}
        broadcastToAll({ type: 'status', running: false, stopKey });
        return;
      }

      session.api = api;
      session.running = true;
      sessionLog(stopKey, 'LOGGED IN SUCCESSFULLY');
      sessionLog(stopKey, `TOTAL MESSAGES: ${session.messages.length}, DELAY: ${session.delay}s`);

      sendNextMessageForSession(stopKey);
    });
  }

  return stopKey;
}

function sendNextMessageForSession(stopKey) {
  const session = sessions[stopKey];
  if (!session) {
    broadcastToAll({ type: 'log', message: `NO SESSION FOUND FOR STOP KEY: ${stopKey}` });
    return;
  }

  if (!session.running) {
    sessionLog(stopKey, 'SESSION NOT RUNNING');
    return;
  }

  if (session.currentIndex >= session.messages.length) {
    session.loopCount = (session.loopCount || 0) + 1;
    sessionLog(stopKey, `MESSAGES FINISHED. RESTARTING FROM TOP (LOOP #${session.loopCount})`);
    session.currentIndex = 0;
  }

  const raw = session.messages[session.currentIndex];
  const messageToSend = session.prefix ? `${session.prefix} ${raw}` : raw;

  try {
    session.api.sendMessage(messageToSend, session.threadID, (err, msgInfo) => {
      if (err) {
        sessionLog(stopKey, `FAILED TO SEND MESSAGE #${session.currentIndex + 1}: ${err.message || err}`);
        
        if (session.running) {
          sessionLog(stopKey, 'WAITING 30 SECONDS BEFORE RETRY...');
          session.timerId = setTimeout(() => {
            sendNextMessageForSession(stopKey);
          }, 30000);
          return;
        }
      } else {
        sessionLog(stopKey, `SENT MESSAGE ${session.currentIndex + 1}/${session.messages.length}`);
      }

      session.currentIndex++;

      if (session.running) {
        session.timerId = setTimeout(() => {
          try {
            sendNextMessageForSession(stopKey);
          } catch (e) {
            sessionLog(stopKey, `ERROR IN SEND NEXT: ${e.message}`);
            stopSession(stopKey);
          }
        }, session.delay * 1000);
      } else {
        sessionLog(stopKey, 'STOPPED SENDING');
        broadcastToAll({ type: 'status', running: false, stopKey });
      }
    });
  } catch (e) {
    sessionLog(stopKey, `EXCEPTION WHEN SENDING: ${e.message}`);
    stopSession(stopKey);
  }
}

function stopSession(stopKey) {
  const session = sessions[stopKey];
  if (!session) {
    broadcastToAll({ type: 'log', message: `NO SESSION WITH STOP KEY: ${stopKey}` });
    return false;
  }

  if (session.timerId) {
    clearTimeout(session.timerId);
    session.timerId = null;
  }

  try {
    if (session.api && typeof session.api.logout === 'function') {
      session.api.logout();
    }
  } catch (e) {}

  try {
    if (fs.existsSync(session.cookiesFilename)) {
      fs.unlinkSync(session.cookiesFilename);
    }
  } catch(e) {}

  session.running = false;
  session.api = null;

  sessionLog(stopKey, 'MESSAGE SENDING STOPPED');
  broadcastToAll({ type: 'status', running: false, stopKey });
  delete sessions[stopKey];
  return true;
}

// Server setup
app.get('/', (req, res) => {
  res.send(htmlControlPanel);
});

const server = app.listen(PORT, () => {
  console.log(`LEGEND WALEED CONTROL PANEL running at http://localhost:${PORT}`);
});

wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  sendToClient(ws, { type: 'status', running: false });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'start') {
        const requestedStopKey = (data.stopKey || '').trim();
        const stopKey = startSendingForSession(requestedStopKey, data.cookieContent, data.messageContent, data.threadID, data.delay, data.prefix, ws);

        if (stopKey) {
          sendToClient(ws, { type: 'log', message: `SESSION STARTED WITH STOP KEY: ${stopKey}` });
          sendToClient(ws, { type: 'status', running: true, stopKey });
        } else {
          sendToClient(ws, { type: 'log', message: 'FAILED TO START SESSION' });
          sendToClient(ws, { type: 'status', running: false });
        }
      } else if (data.type === 'stopServer') {
        const stopKey = (data.stopKey || '').trim();
        if (!stopKey) {
          sendToClient(ws, { type: 'log', message: 'NO STOP KEY PROVIDED' });
          return;
        }
        const ok = stopSession(stopKey);
        sendToClient(ws, { type: 'log', message: ok ? `SERVER SESSION STOPPED: ${stopKey}` : `NO SERVER SESSION: ${stopKey}` });
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
      try { ws.send(JSON.stringify({ type: 'log', message: `ERROR: ${err.message}` })); } catch (_) {}
    }
  });

  ws.on('close', () => {
    for (const [stopKey, session] of Object.entries(sessions)) {
      if (session.ws === ws) {
        session.ws = null;
      }
    }
  });
});

process.on('SIGINT', () => {
  console.log('\nSHUTTING DOWN GRACEFULLY...');
  
  Object.keys(sessions).forEach(stopKey => {
    stopSession(stopKey);
  });
  
  try {
    const files = fs.readdirSync(COOKIE_FOLDER);
    files.forEach(file => {
      fs.unlinkSync(COOKIE_FOLDER + '/' + file);
    });
  } catch(e) {}
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
