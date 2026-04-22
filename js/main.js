import "../src/style.css";

async function cargarDrones() {
  try {
    const res = await fetch("http://localhost:3000/api/drones");
    const drones = await res.json();

    console.log(drones);

    const lista = document.getElementById("listaDrones");

    lista.innerHTML = drones.map(drone => `
      <div class="bg-slate-800 p-5 rounded-xl shadow">
        <h2 class="text-2xl font-bold">${drone.nombre}</h2>
        <p>ID: ${drone.id}</p>
        <p>Estado: ${drone.estado}</p>
        <p>Batería: ${drone.bateria}%</p>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error:", error);
  }
}

cargarDrones();