const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { getDrones, tickDrones } = require("./drones");

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DroneFleet funcionando 🚁");
});

app.get("/api/drones", (req, res) => {
  res.json(getDrones());
});

io.on("connection", socket => {
  console.log(`Cliente conectado: ${socket.id}`);
  socket.emit("drones", getDrones());
});

setInterval(() => {
  tickDrones();
  io.emit("drones", getDrones());
}, 3500);

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
