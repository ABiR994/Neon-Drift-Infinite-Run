// src/systems/LeaderboardSystem.ts

export interface ScoreEntry {
    name: string;
    score: number;
}

export class LeaderboardSystem {
    private static readonly LOCAL_STORAGE_KEY = 'neon_drift_top_scores';
    // Example endpoint - change to your real backend URL
    private static readonly API_ENDPOINT = 'https://mock-leaderboard-api.vercel.app/api/scores'; 

    public static getLocalScores(): ScoreEntry[] {
        const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY) || '[]';
        const scores = JSON.parse(raw);
        return scores.map((s: any) => typeof s === 'number' ? { name: 'YOU', score: s } : s);
    }

    public static saveLocalScore(score: number): void {
        const scores = this.getLocalScores();
        scores.push({ name: 'YOU', score });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(scores.slice(0, 5)));
        localStorage.setItem('neon_drift_high_score', scores[0].score.toString());
    }

    public static async getGlobalScores(): Promise<ScoreEntry[]> {
        try {
            // Mocking a fetch request. Replace with real fetch() when backend is ready.
            /* 
            const response = await fetch(this.API_ENDPOINT);
            return await response.json();
            */
            
            // Return dummy data for now
            return [
                { name: 'X_DRIFTER', score: 95000 },
                { name: 'CYBER_PUNK', score: 82000 },
                { name: 'NEON_RIDER', score: 71000 },
                { name: 'GLITCH_KING', score: 65000 },
                { name: 'ROAD_WARRIOR', score: 58000 }
            ];
        } catch (e) {
            console.error('Failed to fetch global scores', e);
            return [];
        }
    }

    public static async submitGlobalScore(name: string, score: number): Promise<boolean> {
        try {
            console.log(`Submitting score ${score} for ${name} to ${this.API_ENDPOINT}`);
            // Real implementation:
            /*
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score })
            });
            return response.ok;
            */
            return true;
        } catch (e) {
            console.error('Failed to submit score', e);
            return false;
        }
    }
}
