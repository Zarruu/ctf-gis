// Mengambil data dari Backend Go Fiber
// Ganti URL sesuai IP server backend jika di LAN (misal: http://192.168.1.10:3000/api/teams)
const API_URL = 'http://10.200.10.90:3000/api/teams';

export async function fetchTeams() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Gagal mengambil data');
        return await response.json();
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
}