// src/systems/ParticleSystem.ts
import * as THREE from 'three';
import { PARTICLE_COUNT_MAX } from '../utils/constants';

interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    color: THREE.Color;
    size: number;
    active: boolean;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;
    private positions: Float32Array;
    private colors: Float32Array;
    private sizes: Float32Array;

    constructor(scene: THREE.Scene) {
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(PARTICLE_COUNT_MAX * 3);
        this.colors = new Float32Array(PARTICLE_COUNT_MAX * 3);
        this.sizes = new Float32Array(PARTICLE_COUNT_MAX);

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

        this.material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.points = new THREE.Points(this.geometry, this.material);
        scene.add(this.points);

        for (let i = 0; i < PARTICLE_COUNT_MAX; i++) {
            this.particles.push({
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 0,
                color: new THREE.Color(),
                size: 0,
                active: false
            });
        }
    }

    public spawn(
        position: THREE.Vector3,
        velocity: THREE.Vector3,
        color: THREE.Color,
        life: number,
        size: number
    ): void {
        const particle = this.particles.find(p => !p.active);
        if (particle) {
            particle.active = true;
            particle.position.copy(position);
            particle.velocity.copy(velocity);
            particle.color.copy(color);
            particle.life = life;
            particle.maxLife = life;
            particle.size = size;
        }
    }

    public update(deltaTime: number): void {
        for (let i = 0; i < PARTICLE_COUNT_MAX; i++) {
            const p = this.particles[i];
            const i3 = i * 3;

            if (p.active) {
                p.life -= deltaTime;
                if (p.life <= 0) {
                    p.active = false;
                    this.sizes[i] = 0;
                    continue;
                }

                p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                
                // Update buffers
                this.positions[i3] = p.position.x;
                this.positions[i3 + 1] = p.position.y;
                this.positions[i3 + 2] = p.position.z;

                const alpha = p.life / p.maxLife;
                this.colors[i3] = p.color.r * alpha;
                this.colors[i3 + 1] = p.color.g * alpha;
                this.colors[i3 + 2] = p.color.b * alpha;

                this.sizes[i] = p.size * alpha;
            } else {
                this.sizes[i] = 0;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
    }

    public dispose(scene: THREE.Scene): void {
        scene.remove(this.points);
        this.geometry.dispose();
        this.material.dispose();
    }
}
