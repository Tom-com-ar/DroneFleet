const markers = new Map();
let map;
let mapInitialized = false;

function batteryColor(value) {
  if (value > 50) return "#34d399";
  if (value > 20) return "#facc15";
  return "#f87171";
}

function assertLeaflet() {
  if (typeof L === "undefined") {
    console.error("Leaflet no está cargado. Asegurate de que el script de Leaflet está incluido antes de main.js.");
    return false;
  }
  return true;
}

function displayStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function createPopup(drone) {
  return `
    <div class="text-slate-100">
      <strong class="block text-lg">${drone.nombre}</strong>
      <p class="text-slate-300 text-sm">ID: ${drone.id}</p>
      <p class="mt-2 text-sm">Estado: <strong>${displayStatus(drone.estado)}</strong></p>
      <p class="text-sm">Bateria: <strong>${Math.round(drone.bateria)}%</strong></p>
      <p class="text-sm">Velocidad: <strong>${drone.velocidad} km/h</strong></p>
    </div>
  `;
}

function initializeMap(drones) {
  if (!assertLeaflet()) return;

  const center = drones && drones.length
    ? [drones[0].ubicacion.lat, drones[0].ubicacion.lng]
    : [-34.6037, -58.3816];

  map = L.map("map", { zoomControl: false }).setView(center, 14);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
    attribution: "&copy; CARTO",
    maxZoom: 19,
  }).addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
}

export function bootMap() {
  if (!mapInitialized) {
    initializeMap([]);
    mapInitialized = true;
  }
}

export function updateMapMarkers(drones) {
  if (!map) initializeMap(drones || []);

  const bounds = [];
  drones.forEach(drone => {
    const position = [drone.ubicacion.lat, drone.ubicacion.lng];
    bounds.push(position);
    const color = batteryColor(drone.bateria);
    const markerOptions = {
      radius: 10,
      fillColor: color,
      fillOpacity: 1,
      color: "#0f172a",
      weight: 2,
    };

    if (markers.has(drone.id)) {
      const marker = markers.get(drone.id);
      marker.setLatLng(position);
      marker.setStyle(markerOptions);
      marker.setPopupContent(createPopup(drone));
    } else {
      const marker = L.circleMarker(position, markerOptions)
        .bindPopup(createPopup(drone))
        .addTo(map);
      markers.set(drone.id, marker);
    }
  });

  if (bounds.length && !mapInitialized) {
    map.fitBounds(bounds, { padding: [60, 60] });
    mapInitialized = true;
  }
}
