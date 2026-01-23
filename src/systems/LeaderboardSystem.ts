// src/systems/LeaderboardSystem.ts

export interface ScoreEntry {
    name: string;
    score: number;
}

export class LeaderboardSystem {
    private static readonly LOCAL_STORAGE_KEY = 'neon_drift_top_scores';

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
}
