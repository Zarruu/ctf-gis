import { fetchTeams } from './api.js';
import { initMap } from './map.js';

const container = document.getElementById('teams-container');
const clockElement = document.getElementById('clock');

// Fungsi Update Jam
setInterval(() => {
    const now = new Date();
    clockElement.innerText = now.toLocaleTimeString('en-GB');
}, 1000);

// Render Kartu Tim ke HTML
function renderTeams(teams) {
    container.innerHTML = ''; // Clear loading
    
    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        // Set warna border sesuai tim (seperti di gambar)
        card.style.borderColor = team.color; 
        
        card.innerHTML = `
            <div class="team-header">
                <div class="team-name" style="color: ${team.color}">🛡️ ${team.name}</div>
                <div class="team-badge" style="border: 1px solid ${team.color}; color:${team.color}">TEAM ${team.id}</div>
            </div>
            <div class="info-row">📍 ${team.location}</div>
            <div class="info-row">🖥️ ${team.ip}</div>
            
            <div class="stats-grid">
                <div>
                    <div class="stat-val">${team.members}</div>
                    <div class="stat-label">MEMBERS</div>
                </div>
                <div>
                    <div class="stat-val">${team.score}</div>
                    <div class="stat-label">SCORE</div>
                </div>
                <div>
                    <div class="stat-val">${team.solved}</div>
                    <div class="stat-label">SOLVED</div>
                </div>
            </div>

            <div class="status-indicator">LOW 🕒 Pending: 0 submissions</div>
        `;
        container.appendChild(card);
    });
}

// Inisialisasi Aplikasi
async function startApp() {
    const teams = await fetchTeams();
    renderTeams(teams);
    initMap(teams);
}

startApp();