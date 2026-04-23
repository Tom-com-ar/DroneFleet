import { bootMap, updateMapMarkers } from "./mapa.js";

const apiUrl = "http://localhost:3000/api/drones";
const socketUrl = "http://localhost:3000";
let batteryChart;
let deliveryChart;
let currentDrones = [];
let selectedDroneId = "drone-001";

function batteryColor(value) {
  if (value > 50) return "#34d399";
  if (value > 20) return "#facc15";
  return "#f87171";
}

function displayStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function updateSummary(drones) {
  const totalDrones = drones.length;
  const activeFlights = drones.filter(d => d.estado === "en_vuelo" || d.estado === "regresando").length;
  const totalDeliveries = drones.reduce((sum, drone) => sum + drone.entregasRealizadas, 0);
  const avgBattery = totalDrones > 0
    ? Math.round(drones.reduce((sum, drone) => sum + drone.bateria, 0) / totalDrones)
    : 0;

  document.getElementById("totalDrones").textContent = totalDrones;
  document.getElementById("activeFlights").textContent = activeFlights;
  document.getElementById("totalDeliveries").textContent = totalDeliveries;
  document.getElementById("avgBattery").textContent = `${avgBattery}%`;
}

function renderDroneCards(drones) {
  const container = document.getElementById("listaDrones");
  container.innerHTML = drones.map(drone => {
    const color = batteryColor(drone.bateria);
    return `
      <article class="rounded-[1.75rem] border border-slate-700 bg-slate-900/95 p-5 shadow-xl shadow-slate-950/30">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-semibold">${drone.nombre}</h3>
            <p class="mt-1 text-sm text-slate-400">${displayStatus(drone.estado)}</p>
          </div>
          <span class="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">${Math.round(drone.bateria)}%</span>
        </div>
        <div class="mt-5 space-y-3 text-sm text-slate-400">
          <p>ID: ${drone.id}</p>
          <p>Velocidad: ${drone.velocidad} km/h</p>
          <p>Ubicacion: ${drone.ubicacion.lat.toFixed(5)}, ${drone.ubicacion.lng.toFixed(5)}</p>
          <p>Entregas: ${drone.entregasRealizadas}</p>
          <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div class="h-full rounded-full" style="width:${drone.bateria}%; background:${color};"></div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function updateCharts(drones) {
  const green = drones.filter(d => d.bateria > 50).length;
  const yellow = drones.filter(d => d.bateria > 20 && d.bateria <= 50).length;
  const red = drones.filter(d => d.bateria <= 20).length;
  const labels = drones.map(d => d.nombre);
  const deliveryValues = drones.map(d => d.entregasRealizadas);

  if (!batteryChart) {
    const ctx = document.getElementById("batteryChart");
    batteryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [">50%", "20-50%", "<20%"],
        datasets: [{
          data: [green, yellow, red],
          backgroundColor: ["#34d399", "#facc15", "#f87171"],
          borderColor: "rgba(15, 23, 42, 0.8)",
          borderWidth: 2,
        }]
      },
      options: {
        plugins: {
          legend: {
            labels: { color: "#cbd5e1" }
          }
        }
      }
    });
  } else {
    batteryChart.data.datasets[0].data = [green, yellow, red];
    batteryChart.update();
  }

  if (!deliveryChart) {
    const ctx = document.getElementById("deliveryChart");
    deliveryChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Entregas",
          data: deliveryValues,
          backgroundColor: "#38bdf8",
          borderRadius: 12,
          barThickness: 24,
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: "#cbd5e1" } },
          y: { ticks: { color: "#cbd5e1" }, beginAtZero: true }
        }
      }
    });
  } else {
    deliveryChart.data.labels = labels;
    deliveryChart.data.datasets[0].data = deliveryValues;
    deliveryChart.update();
  }
}

function getSelectedDrone() {
  return currentDrones.find(drone => drone.id === selectedDroneId);
}

function updateDroneStateCard() {
  const badge = document.getElementById("droneStateBadge");
  const text = document.getElementById("droneStateText");
  const drone = getSelectedDrone();
  const state = drone && drone.estado === "mantenimiento" ? "mantenimiento" : "disponible";
  const label = state === "mantenimiento" ? "En mantenimiento" : "Disponible";

  if (text) text.textContent = label;
  if (badge) {
    badge.textContent = label;
    badge.style.backgroundColor = state === "disponible" ? "#34d399" : "#ef4444";
    badge.style.color = state === "disponible" ? "#0f172a" : "#ffffff";
    badge.classList.remove("bg-emerald-500", "bg-rose-500", "bg-red-500", "text-slate-950", "text-white");
  }
}

function populateDroneStateSelector(drones) {
  const selector = document.getElementById("droneSelector");
  if (!selector) return;

  const previousId = selectedDroneId;
  selector.innerHTML = drones.map(drone => `
    <option value="${drone.id}">${drone.nombre}</option>
  `).join("");

  selectedDroneId = drones.some(drone => drone.id === previousId)
    ? previousId
    : drones[0]?.id || "";

  selector.value = selectedDroneId;
  updateDroneStateCard();
}

function toggleDroneState() {
  const drone = getSelectedDrone();
  if (!drone) return;

  drone.estado = drone.estado === "mantenimiento" ? "disponible" : "mantenimiento";
  updateDashboard(currentDrones);
}

function updateDashboard(drones) {
  currentDrones = drones;
  updateSummary(drones);
  renderDroneCards(drones);
  updateCharts(drones);
  updateMapMarkers(drones);
  populateDroneStateSelector(drones);
  updateDroneStateCard();
}

async function cargarDrones() {
  try {
    const response = await fetch(apiUrl);
    const dronesData = await response.json();
    currentDrones = dronesData;
    selectedDroneId = dronesData[0]?.id || selectedDroneId;
    console.log("Drones recibidos:", dronesData);
    updateDashboard(dronesData);
  } catch (error) {
    console.error("Error cargando drones:", error);
  }
}

function startSocket() {
  if (!window.io) {
    console.warn("Socket.IO client no está disponible");
    return;
  }

  const socket = io(socketUrl, { transports: ["websocket"], reconnectionAttempts: 5 });
  socket.on("connect", () => {
    console.log("Conectado al servidor de drones", socket.id);
  });
  socket.on("drones", drones => {
    updateDashboard(drones);
  });
  socket.on("disconnect", () => {
    console.warn("Desconectado del servidor WebSocket");
  });
}

bootMap();
cargarDrones();
startSocket();

const droneSelector = document.getElementById("droneSelector");
const toggleDroneStateButton = document.getElementById("toggleDroneStateButton");

if (droneSelector) {
  droneSelector.addEventListener("change", event => {
    selectedDroneId = event.target.value;
    updateDroneStateCard();
  });
}

if (toggleDroneStateButton) {
  toggleDroneStateButton.addEventListener("click", () => {
    toggleDroneState();
  });
}
