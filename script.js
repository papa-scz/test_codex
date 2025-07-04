// Carte interactive Leaflet
const map = L.map('map').setView([48.8588897, 2.320041], 13);

// Fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Couche des parcelles cadastrales (source data.gouv.fr)
const cadastre = L.tileLayer('https://cadastre.openstreetmap.fr/tiles/parcelles/{z}/{x}/{y}.png', {
  maxZoom: 20,
  opacity: 0.7,
  attribution: '&copy; Cadastre'
}).addTo(map);

const form = document.getElementById('searchForm');
const input = document.getElementById('addressInput');

// Recherche d'adresse et affichage de la parcelle correspondante
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = encodeURIComponent(input.value);
  const url = `https://api-adresse.data.gouv.fr/search/?q=${query}&limit=1`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (!data.features.length) {
      alert('Adresse introuvable');
      return;
    }
    const [lng, lat] = data.features[0].geometry.coordinates;
    const label = data.features[0].properties.label;

    map.setView([lat, lng], 18);
    L.marker([lat, lng]).addTo(map).bindPopup(label).openPopup();

    // Récupération de la parcelle contenant le point
    const parcelUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?lat=${lat}&lon=${lng}`;
    const pResp = await fetch(parcelUrl);
    const pData = await pResp.json();
    if (pData.features && pData.features.length) {
      const parcel = pData.features[0];
      const ref = parcel.properties.id;
      const geom = L.geoJSON(parcel, {
        style: { color: '#ff0000', weight: 2 }
      }).addTo(map);
      geom.bindPopup(`Parcelle : ${ref}`).openPopup();
    }
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la recherche');
  }
});
