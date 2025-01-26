import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3001 });
console.log("WebSocket server started on ws://localhost:3001");
wss.on("connection", (ws) => {
    UserManager.getInstance().addUser(ws);
});
