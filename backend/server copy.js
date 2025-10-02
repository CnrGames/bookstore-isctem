
import os from 'os';

import { WebSocketServer } from 'ws'; // Note the slightly different import for WebSocketServer
//import { initializeWebSocket } from './routes/websocketHandler.js'; // IMPORTANT: Use the full filename with .js
import http from 'http';
import WebSocket from 'ws';
import url from 'url';
import express from 'express';
import dotenv from "dotenv";
import { connectDB } from './config/db.js';
import userRoutes from './routes/user.js';
import categoriaRoutes from './routes/categoria.js';
import livroRoutes from './routes/livro.js';

dotenv.config();
const app = express();

app.use(express.json());

//Rotas
app.use(userRoutes);
app.use(categoriaRoutes);
app.use(livroRoutes);



function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    const results = [];

    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal &&
                !/vEthernet|Virtual|VMware|Loopback|TAP|Pseudo/i.test(name)
            ) {
                //  console.log(`Interface: ${name}, Address: ${iface.address}`);
                results.push({ name, address: iface.address });
            }
        }
    }

    // console.log(results);
    // wifi aqu

    let my_custom_netAdress = results.filter((el) => {
        return el.name == 'Wi-Fi';
    })[0].address;

    console.log(my_custom_netAdress);
    // return results;
    return my_custom_netAdress;
}
app.use(express.json());


const server = http.createServer(app);

// 2. Create the WebSocket server
const wss = new WebSocketServer({ noServer: true });

// 3. Initialize our WebSocket logic
//initializeWebSocket(wss);

const WEBSOCKET_PORT = 5001;
const wsServer = new WebSocketServer({ port: WEBSOCKET_PORT });
const sessions = {};

wsServer.on('connection', (ws, req) => {
    const params = url.parse(req.url, true).query;
    const { session_id, user_id, lang } = params;

    if (!session_id || !user_id || !lang) {
        ws.close(1008, "Missing required parameters");
        return;
    }

    if (!sessions[session_id]) {
        sessions[session_id] = {};
        console.log(`[WebSocket] New session created: ${session_id}`);
    }

    sessions[session_id][user_id] = { ws, lang };
    console.log(`[WebSocket] User ${user_id} joined session ${session_id} ('${lang}')`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'final_transcription' && data.text && data.lang) {
                handleTextMessage(session_id, user_id, data.text, data.lang);
            }
        } catch (e) { console.error("[WebSocket] Invalid message:", e); }
    });

    ws.on('close', () => {
        console.log(`[WebSocket] User ${user_id} disconnected.`);
        if (sessions[session_id]) {
            delete sessions[session_id][user_id];
            if (Object.keys(sessions[session_id]).length === 0) {
                delete sessions[session_id];
            }
        }
    });
});

function handleTextMessage(session_id, speaker_id, original_text, speaker_lang) {
    const session = sessions[session_id];
    if (!session) return;

    for (const listener_id in session) {
        const listener = session[listener_id];
        if (listener.ws.readyState !== wsServer.OPEN || listener_id === speaker_id) continue;

        let finalText = original_text;
        if (speaker_lang !== listener.lang) {
            finalText = `(Translated from ${speaker_lang} to ${listener.lang}) ${original_text}`; // Simulated
        }

        const payload = { type: 'translated_message', speaker: speaker_id, text: finalText, lang: listener.lang };
        listener.ws.send(JSON.stringify(payload));
    }
}


server.on('upgrade', (request, socket, head) => {
    const { pathname } = url.parse(request.url);
    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});


//See
app.get("/", (req, res) => {
    res.json({ message: "Server is Ready" });
});

console.log(process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    connectDB();

    const ip = getLocalIPAddress();
    console.log("Rede pra cell abaixo");
    console.log(`http://${ip}:${PORT}`);
    console.log("Rede pro pc");

    console.log(`Server started at http://localhost:${PORT}`);

});


//
//