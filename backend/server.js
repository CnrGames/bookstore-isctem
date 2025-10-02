
import os from 'os';

import { WebSocketServer } from 'ws'; // Note the slightly different import for WebSocketServer
import { initializeWebSocket } from './routes/websocketHandler.js'; // IMPORTANT: Use the full filename with .js
import http from 'http';
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
const WEBSOCKET_PORT = 5001;
const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
// 2. Create the WebSocket server

// 3. Initialize our WebSocket logic
initializeWebSocket(wss);

// 5. --- THIS IS THE CRITICAL AND DEFINITIVE FIX ---
// We manually listen for the special 'upgrade' event that all WebSocket connections start with.
server.on('upgrade', (request, socket, head) => {
    const { pathname } = url.parse(request.url);

    // Check if the request is for our dedicated WebSocket path.
    if (pathname === '/ws') {
        // If it is, we tell the WebSocket server to take over this connection.
        wss.handleUpgrade(request, socket, head, (ws) => {
            // The 'connection' event is now securely emitted here for our handler to catch.
            wss.emit('connection', ws, request);
        });
    } else {
        // If the upgrade request is for any other path, we reject it.
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