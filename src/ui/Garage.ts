// src/ui/Garage.ts
import { UPGRADES, SKINS } from '../utils/constants';

export class Garage {
    private element: HTMLElement | null;
    private creditsValue: HTMLElement | null;
    private onUpgradeCallback: () => void;
    private currentTab: 'UPGRADES' | 'SKINS' = 'UPGRADES';

    constructor(onUpgrade: () => void) {
        this.element = document.getElementById('garage-screen');
        this.creditsValue = document.getElementById('garage-credits-value');
        this.onUpgradeCallback = onUpgrade;

        document.getElementById('garage-back-button')?.addEventListener('click', () => this.hide());
        document.getElementById('upgrade-duration')?.addEventListener('click', () => this.buyUpgrade('DURATION'));
        document.getElementById('upgrade-cooling')?.addEventListener('click', () => this.buyUpgrade('COOLING'));
        document.getElementById('upgrade-magnet')?.addEventListener('click', () => this.buyUpgrade('MAGNET_STRENGTH'));

        document.getElementById('tab-upgrades')?.addEventListener('click', () => this.switchTab('UPGRADES'));
        document.getElementById('tab-skins')?.addEventListener('click', () => this.switchTab('SKINS'));
    }

    private switchTab(tab: 'UPGRADES' | 'SKINS'): void {
        this.currentTab = tab;
        document.getElementById('tab-upgrades')?.classList.toggle('active', tab === 'UPGRADES');
        document.getElementById('tab-skins')?.classList.toggle('active', tab === 'SKINS');
        document.getElementById('upgrades-container')?.classList.toggle('hidden', tab !== 'UPGRADES');
        document.getElementById('skins-container')?.classList.toggle('hidden', tab !== 'SKINS');
        
        if (tab === 'SKINS') this.renderSkins();
    }

    public show(credits: number): void {
        this.element?.classList.remove('hidden');
        this.switchTab('UPGRADES');
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
        
        if (this.currentTab === 'SKINS') this.renderSkins();
    }

    private renderSkins(): void {
        const container = document.getElementById('skin-list');
        if (!container) return;
        container.innerHTML = '';

        const credits = parseInt(localStorage.getItem('neon_drift_credits') || '0');
        const highScore = parseInt(localStorage.getItem('neon_drift_high_score') || '0');
        const unlockedSkins = JSON.parse(localStorage.getItem('neon_drift_unlocked_skins') || '["ORIGINAL"]');
        const activeSkin = localStorage.getItem('neon_drift_active_skin') || 'ORIGINAL';

        SKINS.forEach(skin => {
            const isUnlocked = unlockedSkins.includes(skin.name);
            const isActive = activeSkin === skin.name;
            const canAfford = credits >= skin.cost;
            const meetsScore = highScore >= skin.scoreRequired;

            const item = document.createElement('div');
            item.className = 'upgrade-item';
            item.innerHTML = `
                <div class="upgrade-info">
                    <h3>${skin.name}</h3>
                    <p>${skin.scoreRequired > 0 ? `REQ: ${skin.scoreRequired} SCORE` : ''}</p>
                </div>
                <button class="upgrade-button" id="skin-btn-${skin.name}" ${(!isUnlocked && (!canAfford || !meetsScore)) ? 'disabled' : ''}>
                    ${isActive ? 'ACTIVE' : (isUnlocked ? 'SELECT' : `BUY (${skin.cost})`)}
                </button>
            `;
            container.appendChild(item);

            document.getElementById(`skin-btn-${skin.name}`)?.addEventListener('click', () => {
                if (isActive) return;
                if (isUnlocked) {
                    this.setActiveSkin(skin.name);
                } else {
                    this.buySkin(skin);
                }
            });
        });
    }

    private setActiveSkin(name: string): void {
        localStorage.setItem('neon_drift_active_skin', name);
        this.renderSkins();
        this.onUpgradeCallback();
    }

    private buySkin(skin: any): void {
        let credits = parseInt(localStorage.getItem('neon_drift_credits') || '0');
        const unlockedSkins = JSON.parse(localStorage.getItem('neon_drift_unlocked_skins') || '["ORIGINAL"]');
        
        if (credits >= skin.cost) {
            credits -= skin.cost;
            unlockedSkins.push(skin.name);
            localStorage.setItem('neon_drift_credits', credits.toString());
            localStorage.setItem('neon_drift_unlocked_skins', JSON.stringify(unlockedSkins));
            this.setActiveSkin(skin.name);
            this.updateUI(credits);
        }
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
