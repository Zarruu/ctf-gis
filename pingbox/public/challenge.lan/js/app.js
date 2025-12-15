import { fetchTeams, fetchChallenges, submitFlag } from './api.js';

// State
let teams = [];
let challenges = [];
let selectedTeamId = null;
let selectedChallengeId = null;
let solvedByTeam = {}; // Track locally which challenges are solved

// DOM Elements
const teamSelect = document.getElementById('team-select');
const teamDisplay = document.getElementById('team-display');
const scoreDisplay = document.getElementById('score-display');
const solvedDisplay = document.getElementById('solved-display');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const challengeList = document.getElementById('challenge-list');
const challengeContent = document.getElementById('challenge-content');

// Initialize App
async function init() {
    teams = await fetchTeams();
    challenges = await fetchChallenges();

    renderTeamSelect();
    renderChallengeList();
}

// Render Team Select Dropdown
function renderTeamSelect() {
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = `${team.name} (${team.location})`;
        teamSelect.appendChild(option);
    });

    teamSelect.addEventListener('change', (e) => {
        selectedTeamId = parseInt(e.target.value);
        const team = teams.find(t => t.id === selectedTeamId);
        if (team) {
            teamDisplay.textContent = team.name;
            updateStats();
        } else {
            teamDisplay.textContent = 'Select Team';
        }
    });
}

// Render Challenge List in Sidebar
function renderChallengeList() {
    challengeList.innerHTML = '';

    challenges.forEach(challenge => {
        const item = document.createElement('div');
        item.className = 'challenge-item';
        item.dataset.id = challenge.id;

        if (solvedByTeam[selectedTeamId]?.[challenge.id]) {
            item.classList.add('solved');
        }

        item.innerHTML = `
            <div class="title">${challenge.title}</div>
            <div class="category">${challenge.category}</div>
            <div class="points">🏆 ${challenge.points} points</div>
        `;

        item.addEventListener('click', () => selectChallenge(challenge.id));
        challengeList.appendChild(item);
    });
}

// Select and Display Challenge
function selectChallenge(challengeId) {
    selectedChallengeId = challengeId;
    const challenge = challenges.find(c => c.id === challengeId);

    // Update active state in sidebar
    document.querySelectorAll('.challenge-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.id) === challengeId) {
            item.classList.add('active');
        }
    });

    // Render challenge detail
    const isSolved = solvedByTeam[selectedTeamId]?.[challengeId];

    challengeContent.innerHTML = `
        <div class="challenge-detail">
            <div class="challenge-header">
                <div>
                    <h1 class="challenge-title">Challenge ${challenge.id}: ${challenge.title}</h1>
                    <div class="challenge-meta">
                        <span class="category-badge">${challenge.category}</span>
                        <span class="points-badge">${challenge.points} points</span>
                        ${isSolved ? '<span class="points-badge" style="background: rgba(0,255,136,0.3); color: #00ff88;">✅ Solved</span>' : ''}
                    </div>
                </div>
            </div>
            
            <h3 class="section-title">📝 Challenge Description:</h3>
            <div class="description-box">${challenge.description}</div>
            
            <h3 class="section-title">🎯 Target Information:</h3>
            <pre class="code-block">${challenge.target_info}</pre>
            
            <h3 class="section-title">💡 Hint</h3>
            <button class="hint-toggle" onclick="toggleHint()">
                🔍 Show Hint
            </button>
            <div class="hint-content" id="hint-content">
                ${challenge.hint}
            </div>
            
            <div class="submit-section">
                <h3 class="section-title">🚩 Submit Flag:</h3>
                <form class="submit-form" id="submit-form">
                    <input type="text" class="flag-input" id="flag-input" 
                           placeholder="FLAG{...}" 
                           ${isSolved ? 'disabled' : ''}>
                    <button type="submit" class="submit-btn" ${isSolved ? 'disabled' : ''}>
                        Submit
                    </button>
                </form>
                <div class="result-message" id="result-message"></div>
            </div>
        </div>
    `;

    // Add form submit handler
    document.getElementById('submit-form').addEventListener('submit', handleSubmit);
}

// Toggle Hint Visibility
window.toggleHint = function () {
    const hintContent = document.getElementById('hint-content');
    const hintToggle = document.querySelector('.hint-toggle');

    if (hintContent.classList.contains('show')) {
        hintContent.classList.remove('show');
        hintToggle.innerHTML = '🔍 Show Hint';
    } else {
        hintContent.classList.add('show');
        hintToggle.innerHTML = '🙈 Hide Hint';
    }
};

// Handle Flag Submission
async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedTeamId) {
        showResult(false, 'Please select a team first!');
        return;
    }

    const flagInput = document.getElementById('flag-input');
    const flag = flagInput.value.trim();

    if (!flag) {
        showResult(false, 'Please enter a flag!');
        return;
    }

    // Submit to API
    const result = await submitFlag(selectedTeamId, selectedChallengeId, flag);

    showResult(result.success, result.message);

    if (result.success) {
        // Update local solved state
        if (!solvedByTeam[selectedTeamId]) {
            solvedByTeam[selectedTeamId] = {};
        }
        solvedByTeam[selectedTeamId][selectedChallengeId] = true;

        // Refresh teams data to get updated scores
        teams = await fetchTeams();
        updateStats();
        renderChallengeList();

        // Update current challenge view
        selectChallenge(selectedChallengeId);
    }
}

// Show Result Message
function showResult(success, message) {
    const resultEl = document.getElementById('result-message');
    resultEl.className = 'result-message ' + (success ? 'success' : 'error');
    resultEl.textContent = message;
}

// Update Stats Display
function updateStats() {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return;

    scoreDisplay.textContent = `🏆 ${team.score} points`;
    solvedDisplay.textContent = `✅ ${team.solved}/${challenges.length} challenges`;

    const progress = (team.solved / challenges.length) * 100;
    progressBar.style.setProperty('--progress', `${progress}%`);
    progressText.textContent = `${progress.toFixed(1)}% completed`;
}

// Start the app
init();
