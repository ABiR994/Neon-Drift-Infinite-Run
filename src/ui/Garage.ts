// src/ui/Garage.ts
import { UPGRADES } from '../utils/constants';

export class Garage {
    private element: HTMLElement | null;
    private creditsValue: HTMLElement | null;
    private onUpgradeCallback: () => void;

    constructor(onUpgrade: () => void) {
        this.element = document.getElementById('garage-screen');
        this.creditsValue = document.getElementById('garage-credits-value');
        this.onUpgradeCallback = onUpgrade;

        document.getElementById('garage-back-button')?.addEventListener('click', () => this.hide());
        document.getElementById('upgrade-duration')?.addEventListener('click', () => this.buyUpgrade('DURATION'));
        document.getElementById('upgrade-cooling')?.addEventListener('click', () => this.buyUpgrade('COOLING'));
        document.getElementById('upgrade-magnet')?.addEventListener('click', () => this.buyUpgrade('MAGNET_STRENGTH'));
    }

    public show(credits: number): void {
        this.element?.classList.remove('hidden');
        this.updateUI(credits);
    }

    public hide(): void {
        this.element?.classList.add('hidden');
    }

    public updateUI(credits: number): void {
        if (this.creditsValue) this.creditsValue.textContent = credits.toString();
        
        const levels = JSON.parse(localStorage.getItem('neon_drift_upgrades') || '{"DURATION": 0, "COOLING": 0, "MAGNET_STRENGTH": 0}');
        
        this.updateUpgradeItem('duration', 'DURATION', levels.DURATION, credits);
        this.updateUpgradeItem('cooling', 'COOLING', levels.COOLING, credits);
        this.updateUpgradeItem('magnet', 'MAGNET_STRENGTH', levels.MAGNET_STRENGTH, credits);
    }

    private updateUpgradeItem(idPrefix: string, key: string, level: number, credits: number): void {
        const levelEl = document.getElementById(`${idPrefix}-level`);
        const btn = document.getElementById(`upgrade-${idPrefix}`) as HTMLButtonElement;
        
        if (levelEl) levelEl.textContent = (level + 1).toString();
        
        const nextLevel = level + 1;
        const upgradeData = (UPGRADES as any)[key];
        
        if (nextLevel >= upgradeData.length) {
            if (btn) {
                btn.textContent = 'MAXED';
                btn.disabled = true;
            }
        } else {
            const cost = upgradeData[nextLevel].cost;
            if (btn) {
                btn.textContent = `UPGRADE (${cost})`;
                btn.disabled = credits < cost;
            }
        }
    }

    private buyUpgrade(key: string): void {
        let credits = parseInt(localStorage.getItem('neon_drift_credits') || '0');
        const levels = JSON.parse(localStorage.getItem('neon_drift_upgrades') || '{"DURATION": 0, "COOLING": 0, "MAGNET_STRENGTH": 0}');
        
        const nextLevel = levels[key] + 1;
        const cost = (UPGRADES as any)[key][nextLevel].cost;
        
        if (credits >= cost) {
            credits -= cost;
            levels[key] = nextLevel;
            
            localStorage.setItem('neon_drift_credits', credits.toString());
            localStorage.setItem('neon_drift_upgrades', JSON.stringify(levels));
            
            this.updateUI(credits);
            this.onUpgradeCallback();
        }
    }
}
