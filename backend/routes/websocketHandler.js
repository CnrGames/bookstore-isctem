// routes/websocketHandler.js (Corrected Syntax)

import WebSocket from 'ws';
import url from 'url';

const sessions = {};

function handleTextMessage(session_id, speaker_id, original_text, speaker_lang) {
    const session = sessions[session_id];
    if (!session) return;
    for (const listener_id in session) {
        const listener = session[listener_id];
        if (listener.ws.readyState !== WebSocket.OPEN || listener_id === speaker_id) continue;

        let finalText = original_text;
        if (speaker_lang !== listener.lang) {
            // TODO: Call your chosen translation API
            //  finalText = `(Translated from ${speaker_lang} to ${listener.lang}) ${original_text}`; // Simulated
            //  finalText
        }

        const payload = { type: 'translated_message', speaker: speaker_id, text: finalText, lang: listener.lang };
        listener.ws.send(JSON.stringify(payload));
    }
}

export function initializeWebSocket(wss) {
    console.log("   -> WebSocket handler attached.");
    wss.on('connection', (ws, req) => {
        // --- THIS LINE IS NOW CORRECT ---
        const params = url.parse(req.url, true).query;
        const { session_id, user_id, lang } = params;

        if (!session_id || !user_id || !lang) {
            ws.close(1008, "Missing parameters");
            return;
        }
        if (!sessions[session_id]) {
            sessions[session_id] = {};
        }
        sessions[session_id][user_id] = { ws, lang };
        console.log(`User ${user_id} joined session ${session_id} ('${lang}')`);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'final_transcription' && data.text && data.lang) {
                    handleTextMessage(session_id, user_id, data.text, data.lang);
                }
            } catch (e) { console.error("Invalid message:", e); }
        });

        ws.on('close', () => {
            console.log(`User ${user_id} disconnected.`);
            if (sessions[session_id]) {
                delete sessions[session_id][user_id];
                if (Object.keys(sessions[session_id]).length === 0) {
                    delete sessions[session_id];
                }
            }
        });
    });
}