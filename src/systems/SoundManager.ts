// src/systems/SoundManager.ts
import * as THREE from 'three';

export class SoundManager {
    private listener: THREE.AudioListener;
    private sounds: Map<string, THREE.Audio | THREE.PositionalAudio> = new Map();
    private audioLoader: THREE.AudioLoader;
    private masterVolume: number = 0.5;

    // Engine sound synthesis (optional, using Web Audio API directly)
    private audioContext: AudioContext;
    private engineOscillator: OscillatorNode | null = null;
    private engineGain: GainNode | null = null;

    constructor(camera: THREE.Camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();
        this.audioContext = THREE.AudioContext.getContext();
    }

    public loadSound(name: string, url: string, loop: boolean = false, volume: number = 1): Promise<void> {
        return new Promise((resolve, reject) => {
            this.audioLoader.load(url, (buffer) => {
                const sound = new THREE.Audio(this.listener);
                sound.setBuffer(buffer);
                sound.setLoop(loop);
                sound.setVolume(volume * this.masterVolume);
                this.sounds.set(name, sound);
                resolve();
            }, undefined, reject);
        });
    }

    public playSound(name: string): void {
        const sound = this.sounds.get(name);
        if (sound && !sound.isPlaying) {
            sound.play();
        }
    }

    public stopSound(name: string): void {
        const sound = this.sounds.get(name);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    /**
     * Starts a synthesized engine sound using Web Audio API.
     */
    public startEngine(): void {
        if (this.engineOscillator) return;

        this.engineOscillator = this.audioContext.createOscillator();
        this.engineGain = this.audioContext.createGain();

        this.engineOscillator.type = 'sawtooth';
        this.engineOscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);

        this.engineGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);

        this.engineOscillator.connect(this.engineGain);
        this.engineGain.connect(this.audioContext.destination);

        this.engineOscillator.start();
    }

    /**
     * Updates the engine sound pitch based on game speed.
     * @param normalizedSpeed Normalized speed (0-1).
     */
    public updateEngine(normalizedSpeed: number): void {
        if (this.engineOscillator) {
            // Frequency range from 50Hz to 400Hz
            const freq = 50 + normalizedSpeed * 350;
            this.engineOscillator.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.1);
            
            // Volume slightly increases with speed
            if (this.engineGain) {
                const vol = 0.05 + normalizedSpeed * 0.05;
                this.engineGain.gain.setTargetAtTime(vol, this.audioContext.currentTime, 0.1);
            }
        }
    }

    public stopEngine(): void {
        if (this.engineOscillator) {
            this.engineOscillator.stop();
            this.engineOscillator.disconnect();
            this.engineOscillator = null;
        }
        if (this.engineGain) {
            this.engineGain.disconnect();
            this.engineGain = null;
        }
    }

    public setMasterVolume(volume: number): void {
        this.masterVolume = volume;
        this.sounds.forEach(sound => {
            sound.setVolume(this.masterVolume);
        });
    }

    public dispose(): void {
        this.stopEngine();
        this.sounds.forEach(sound => {
            if (sound.isPlaying) sound.stop();
        });
        this.sounds.clear();
    }
}
