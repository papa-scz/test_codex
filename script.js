// Carte interactive Leaflet
const map = L.map('map').setView([48.8588897, 2.320041], 13);

// Fond de carte OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);


// Couche des parcelles cadastrales
L.tileLayer('https://cadastre.openstreetmap.fr/tiles/parcelles/{z}/{x}/{y}.png', {

  maxZoom: 20,
  opacity: 0.7,
  attribution: '&copy; Cadastre'
}).addTo(map);

const form = document.getElementById('searchForm');
const input = document.getElementById('addressInput');

const info = document.getElementById('info');

let marker;
let parcelLayer;

// Recherche d'adresse

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

    const feature = data.features[0];
    const [lng, lat] = feature.geometry.coordinates;
    const label = feature.properties.label;

    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map).bindPopup(label).openPopup();
    map.setView([lat, lng], 18);
  } catch (err) {
    console.error(err);
    alert('Erreur lors de la recherche');
  }
});

// Sélection d'une parcelle au clic
map.on('click', async (e) => {
  const { lat, lng } = e.latlng;
  try {
    const parcelUrl = `https://apicarto.ign.fr/api/cadastre/parcelle?lat=${lat}&lon=${lng}`;
    const pResp = await fetch(parcelUrl);
    const pData = await pResp.json();
    if (!(pData.features && pData.features.length)) return;

    const parcel = pData.features[0];
    const props = parcel.properties || {};

    if (parcelLayer) map.removeLayer(parcelLayer);
    parcelLayer = L.geoJSON(parcel, {
      style: { color: '#ff0000', weight: 2, fillOpacity: 0.2 }
    }).addTo(map);

    // Adresse à partir du point sélectionné
    const revUrl = `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}&limit=1`;
    let address = '';
    try {
      const rResp = await fetch(revUrl);
      const rData = await rResp.json();
      if (rData.features && rData.features.length) {
        address = rData.features[0].properties.label;
      }
    } catch (err) {
      console.error('Reverse geocode error', err);
    }

    const ref = props.id || `${props.section || ''}${props.numero || ''}`;
    const area = props.contenance ? `${props.contenance} m²` : '';

    const content = `<strong>Parcelle ${ref}</strong><br>${address}<br>Superficie : ${area}`;
    parcelLayer.bindPopup(content).openPopup();
    info.innerHTML = content;
  } catch (err) {
    console.error(err);

  }
});
