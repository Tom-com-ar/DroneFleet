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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomDelta() {
  return (Math.random() - 0.5) * 0.0016;
}

function getDrones() {
  return drones.map(drone => ({ ...drone, ubicacion: { ...drone.ubicacion } }));
}

function tickDrones() {
  drones.forEach(drone => {
    if (drone.estado === "en_vuelo") {
      drone.ubicacion.lat = clamp(drone.ubicacion.lat + randomDelta(), -90, 90);
      drone.ubicacion.lng = clamp(drone.ubicacion.lng + randomDelta(), -180, 180);
      drone.velocidad = 15 + Math.round(Math.random() * 10);
      drone.bateria = clamp(drone.bateria - Math.random() * 3, 0, 100);
      if (drone.bateria <= 20) drone.estado = "regresando";
      if (Math.random() < 0.08) drone.entregasRealizadas += 1;
    }

    if (drone.estado === "regresando") {
      drone.ubicacion.lat = clamp(drone.ubicacion.lat + randomDelta() * 0.5, -90, 90);
      drone.ubicacion.lng = clamp(drone.ubicacion.lng + randomDelta() * 0.5, -180, 180);
      drone.velocidad = 10 + Math.round(Math.random() * 6);
      drone.bateria = clamp(drone.bateria - 1.6, 0, 100);
      if (drone.bateria <= 5) drone.estado = "cargando";
    }

    if (drone.estado === "cargando") {
      drone.velocidad = 0;
      drone.bateria = clamp(drone.bateria + 3, 0, 100);
      if (drone.bateria >= 90) {
        drone.estado = "disponible";
        drone.velocidad = 0;
      }
    }

    if (drone.estado === "disponible") {
      drone.velocidad = 0;
      if (drone.bateria < 100 && Math.random() < 0.1) {
        drone.bateria = clamp(drone.bateria - 0.2, 0, 100);
      }
    }
  });
}

module.exports = {
  getDrones,
  tickDrones,
};
