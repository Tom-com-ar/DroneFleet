import "../src/style.css";
import { io } from "socket.io-client";
import { mostrarNotificacion, inicializarNotificaciones } from "./notificaciones.js";
import { bootMap, updateMapMarkers } from "./mapa.js";

const apiUrl = "http://localhost:3000/api/drones";
const socketUrl = "http://localhost:3000";

const socket = io(socketUrl);

let currentDrones = [];
let entregas = [];
let selectedDroneId = null;

let batteryChart;
let deliveryChart;

const droneSelector = document.getElementById("droneSelector");
const toggleDroneStateButton = document.getElementById("toggleDroneStateButton");
const droneStateText = document.getElementById("droneStateText");
const droneStateBadge = document.getElementById("droneStateBadge");
const addDeliveryButton = document.getElementById("addDeliveryButton");

/* =========================
   SOCKET CONNECT
========================= */

socket.on("connect", async () => {
  console.log("✅ Conectado al servidor");

  try {
    const res = await fetch("http://localhost:3000/api/entregas");
    entregas = await res.json();
  } catch (err) {
    console.error("Error cargando entregas:", err);
  }
});

socket.on("disconnect", () => {
  console.log("🔌 Desconectado del servidor");
});

/* =========================
   SOCKET EVENTS
========================= */

socket.on("actualizacionDrones", (drones) => {
  updateDashboard(drones);
});

socket.on("drones", (drones) => {
  updateDashboard(drones);
});

socket.on("entrega-asignada", (data) => {
  const i = entregas.findIndex(e => e.id === data.entrega.id);
  if (i === -1) entregas.push(data.entrega);
  else entregas[i] = data.entrega;
});

socket.on("entrega-completada", (data) => {
  const i = entregas.findIndex(e => e.id === data.entrega.id);
  if (i !== -1) entregas[i].estado = "completada";
});

/* =========================
   UI HELPERS
========================= */

function batteryColor(v) {
  if (v > 50) return "#34d399";
  if (v > 20) return "#facc15";
  return "#f87171";
}

function displayStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatBattery(value) {
  return `${Number(value).toFixed(1)}%`;
}

function updateSelectedDroneCard() {
  const drone = currentDrones.find(d => d.id === selectedDroneId);
  if (!drone) return;

  if (droneStateText) droneStateText.textContent = displayStatus(drone.estado);
  if (droneStateBadge) {
    droneStateBadge.textContent = displayStatus(drone.estado);
    droneStateBadge.className = `block w-full rounded-full px-4 py-3 text-center text-sm font-semibold ${
      drone.estado === "en_vuelo" ? "bg-amber-500 text-slate-950" :
      drone.estado === "mantenimiento" ? "bg-rose-500 text-slate-950" :
      drone.estado === "cargando" ? "bg-blue-500 text-slate-950" :
      "bg-emerald-500 text-slate-950"
    }`;
  }

  if (toggleDroneStateButton) {
    toggleDroneStateButton.textContent = drone.estado === "mantenimiento" ? "Activar dron" : "Poner en mantenimiento";
    toggleDroneStateButton.dataset.state = drone.estado;
  }
}

function populateDroneSelector(drones) {
  if (!droneSelector) return;

  droneSelector.innerHTML = drones.map(drone => `
    <option value="${drone.id}">${drone.nombre}</option>
  `).join("");

  if (!selectedDroneId && drones.length) {
    selectedDroneId = drones[0].id;
  }

  if (selectedDroneId) {
    droneSelector.value = selectedDroneId;
  }

  updateSelectedDroneCard();
}

function renderStats(drones) {
  const totalDrones = document.getElementById("totalDrones");
  const avgBattery = document.getElementById("avgBattery");
  const activeFlights = document.getElementById("activeFlights");
  const totalDeliveries = document.getElementById("totalDeliveries");

  if (!drones.length) return;

  const avg = (drones.reduce((sum, d) => sum + d.bateria, 0) / drones.length).toFixed(1);
  const active = drones.filter(d => d.estado === "en_vuelo").length;
  const total = drones.reduce((sum, d) => sum + (d.entregasRealizadas || 0), 0);

  if (totalDrones) totalDrones.textContent = String(drones.length);
  if (avgBattery) avgBattery.textContent = `${avg}%`;
  if (activeFlights) activeFlights.textContent = String(active);
  if (totalDeliveries) totalDeliveries.textContent = String(total);
}

function initCharts() {
  const batteryCanvas = document.getElementById("batteryChart");
  const deliveryCanvas = document.getElementById("deliveryChart");

  if (batteryCanvas) {
    batteryChart = new Chart(batteryCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Batería %",
          data: [],
          backgroundColor: [],
          borderRadius: 12,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } }
        },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { display: false } },
          y: { beginAtZero: true, max: 100, ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.15)" } }
        }
      }
    });
  }

  if (deliveryCanvas) {
    deliveryChart = new Chart(deliveryCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [{
          label: "Entregas",
          data: [],
          backgroundColor: "#38bdf8",
          borderRadius: 12,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: "#cbd5e1" }, grid: { color: "rgba(148,163,184,0.15)" } }
        }
      }
    });
  }
}

function updateCharts(drones) {
  if (batteryChart) {
    batteryChart.data.labels = drones.map(d => d.nombre);
    batteryChart.data.datasets[0].data = drones.map(d => d.bateria);
    batteryChart.data.datasets[0].backgroundColor = drones.map(d => batteryColor(d.bateria));
    batteryChart.update();
  }

  if (deliveryChart) {
    deliveryChart.data.labels = drones.map(d => d.nombre);
    deliveryChart.data.datasets[0].data = drones.map(d => d.entregasRealizadas || 0);
    deliveryChart.update();
  }
}

/* =========================
   RENDER
========================= */

function renderDrones(drones) {
  const lista = document.getElementById("listaDrones");
  if (!lista) return;

  lista.innerHTML = drones.map(drone => {
    const entrega = entregas.find(
      e => e.droneId === drone.id && e.estado === "asignada"
    );

    let entregaTexto = "Sin entrega";
    if (entrega) {
      const tiempo = (Date.now() - new Date(entrega.creado)) / 1000;
      const restante = Math.max(0, entrega.tiempoEstimado - tiempo);
      entregaTexto = `${entrega.paquete} - ${Math.ceil(restante)}s restantes`;
    }

    return `
      <div class="bg-slate-800 p-6 rounded-xl shadow">
        <h2 class="text-xl font-bold">${drone.nombre}</h2>
        <p>Estado: ${displayStatus(drone.estado)}</p>
        <p>Batería: ${formatBattery(drone.bateria)}</p>
        <p>Ubicación: ${drone.ubicacion.lat.toFixed(4)}, ${drone.ubicacion.lng.toFixed(4)}</p>
        <p>Velocidad: ${drone.velocidad} km/h</p>
        <p>Entregas: ${drone.entregasRealizadas}</p>
        <p class="text-sm text-slate-300">${entregaTexto}</p>
      </div>
    `;
  }).join("");
}

/* =========================
   ACTIONS
========================= */

async function toggleSelectedDroneState() {
  if (!selectedDroneId) return;
  const drone = currentDrones.find(d => d.id === selectedDroneId);
  if (!drone) return;

  const nuevoEstado = drone.estado === "mantenimiento" ? "disponible" : "mantenimiento";
  try {
    const res = await fetch(`${socketUrl}/api/drones/${selectedDroneId}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    const data = await res.json();
    if (!res.ok) {
      mostrarNotificacion(data.error || "No se pudo cambiar el estado.", "error");
      return;
    }
    currentDrones = currentDrones.map(d => d.id === data.drone.id ? data.drone : d);
    updateDashboard(currentDrones);
    mostrarNotificacion(`Estado actualizado: ${data.drone.nombre} es ${displayStatus(data.drone.estado)}`, "success");
  } catch (err) {
    mostrarNotificacion("Error de conexión al cambiar estado.", "error");
  }
}

async function addDeliveryToSelectedDrone() {
  // Seleccionar automáticamente el dron disponible con más batería (>20%)
  const availableDrones = currentDrones.filter(d => d.estado === "disponible" && d.bateria > 20);
  if (availableDrones.length === 0) {
    mostrarNotificacion("No hay drones disponibles con batería suficiente.", "warning");
    return;
  }

  // Seleccionar el dron con más batería
  const selectedDrone = availableDrones.reduce((prev, current) => (prev.bateria > current.bateria) ? prev : current);

  try {
    const body = {
      droneId: selectedDrone.id,
      destino: { lat: selectedDrone.ubicacion.lat + 0.001, lng: selectedDrone.ubicacion.lng + 0.001 },
      paquete: "Carga urgente",
      peso: 3.2
    };

    const res = await fetch(`${socketUrl}/api/entregas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarNotificacion(data.error || "No se pudo asignar la entrega.", "error");
      return;
    }

    if (data.drone) {
      currentDrones = currentDrones.map(d => d.id === data.drone.id ? data.drone : d);
      updateDashboard(currentDrones);
    }
  } catch (err) {
    mostrarNotificacion("Error de conexión al asignar entrega.", "error");
  }
}

/* =========================
   DASHBOARD
========================= */

function updateDashboard(drones) {
  currentDrones = drones;
  populateDroneSelector(drones);
  renderDrones(drones);
  updateMapMarkers(drones);
  renderStats(drones);
  updateCharts(drones);
}

/* =========================
   INIT
========================= */

async function cargarDrones() {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    currentDrones = data;
    selectedDroneId = data[0]?.id || null;
    updateDashboard(data);
  } catch (err) {
    console.error("Error cargando drones:", err);
  }
}

function initUI() {
  if (droneSelector) {
    droneSelector.addEventListener("change", (event) => {
      selectedDroneId = event.target.value;
      updateSelectedDroneCard();
    });
  }

  if (toggleDroneStateButton) {
    toggleDroneStateButton.addEventListener("click", toggleSelectedDroneState);
  }

  if (addDeliveryButton) {
    addDeliveryButton.addEventListener("click", addDeliveryToSelectedDrone);
  }

  inicializarNotificaciones(socket);
}

/* =========================
   START
========================= */

bootMap();
initCharts();
initUI();
cargarDrones();