const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const drones = [
  {
    id: "drone-001",
    nombre: "EcoFlyer",
    estado: "disponible",
    bateria: 90,
    ubicacion: {
      lat: -34.6037,
      lng: -58.3816
    },
    velocidad: 12,
    pesoMaximo: 5,
    entregasRealizadas: 42
  },
  {
    id: "drone-002",
    nombre: "SkyFast",
    estado: "en_vuelo",
    bateria: 65,
    ubicacion: {
      lat: -34.6010,
      lng: -58.3790
    },
    velocidad: 18,
    pesoMaximo: 8,
    entregasRealizadas: 31
  },
  {
    id: "drone-003",
    nombre: "TurboWing",
    estado: "cargando",
    bateria: 25,
    ubicacion: {
      lat: -34.6050,
      lng: -58.3840
    },
    velocidad: 10,
    pesoMaximo: 6,
    entregasRealizadas: 19
  },
  {
    id: "drone-004",
    nombre: "AeroMax",
    estado: "mantenimiento",
    bateria: 100,
    ubicacion: {
      lat: -34.6070,
      lng: -58.3870
    },
    velocidad: 0,
    pesoMaximo: 10,
    entregasRealizadas: 58
  },
  {
    id: "drone-005",
    nombre: "FlashAir",
    estado: "disponible",
    bateria: 77,
    ubicacion: {
      lat: -34.6005,
      lng: -58.3765
    },
    velocidad: 20,
    pesoMaximo: 4,
    entregasRealizadas: 27
  }
];

app.get("/", (req, res) => {
  res.send("DroneFleet funcionando 🚁");
});

app.get("/api/drones", (req, res) => {
  res.json(drones);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});