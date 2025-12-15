export function initMap(teams) {
    // Inisialisasi peta (tampilan gelap)
    const map = L.map('map').setView([20, 0], 2);

    // Menggunakan Tile CartoDB Dark Matter untuk nuansa Cyber
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Menambahkan Marker dan Garis Koneksi
    const coordinates = [];

    teams.forEach(team => {
        // Custom Icon sederhana (lingkaran warna)
        const customIcon = L.divIcon({
            className: 'custom-pin',
            html: `<div style="background-color: ${team.color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 10px ${team.color}; border: 2px solid white;"></div>`,
            iconSize: [16, 16]
        });

        const marker = L.marker([team.lat, team.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<b>${team.name}</b><br>${team.location}<br>${team.ip}`);
        
        coordinates.push([team.lat, team.lng]);
    });

    // Menarik garis koneksi antar tim (efek jaringan)
    if (coordinates.length > 1) {
        L.polyline(coordinates, {
            color: '#1f6feb',
            weight: 1,
            opacity: 0.5,
            dashArray: '5, 10'
        }).addTo(map);
    }
}