// API Configuration
const API_BASE = 'http://10.200.10.90:3000';

// Fetch teams from API
export async function fetchTeams() {
    try {
        const response = await fetch(`${API_BASE}/api/teams`);
        if (!response.ok) throw new Error('Failed to fetch teams');
        return await response.json();
    } catch (error) {
        console.error('Error fetching teams:', error);
        return [];
    }
}

// Fetch challenges from API
export async function fetchChallenges() {
    try {
        const response = await fetch(`${API_BASE}/api/challenges`);
        if (!response.ok) throw new Error('Failed to fetch challenges');
        return await response.json();
    } catch (error) {
        console.error('Error fetching challenges:', error);
        return [];
    }
}

// Submit flag to API
export async function submitFlag(teamId, challengeId, flag) {
    try {
        const response = await fetch(`${API_BASE}/api/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                team_id: teamId,
                challenge_id: challengeId,
                flag: flag
            })
        });
        return await response.json();
    } catch (error) {
        console.error('Error submitting flag:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}
