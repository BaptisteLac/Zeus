import { random } from "lodash"; // Assuming lodash might be there? No, better use Math.random

const colors = ['#e76f51', '#2a9d8f', '#e9c46a', '#f4a261', '#264653'];

export function triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 150;

    class Particle {
        x: number;
        y: number;
        color: string;
        size: number;
        speedX: number;
        speedY: number;
        rotation: number;
        rotationSpeed: number;

        constructor() {
            this.x = width / 2;
            this.y = height / 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.size = Math.random() * 10 + 5;
            this.speedX = Math.random() * 10 - 5;
            this.speedY = Math.random() * 10 - 5;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 10 - 5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += 0.1; // Gravity
            this.rotation += this.rotationSpeed;
            if (this.size > 0.2) this.size -= 0.05; // Fade out by shrinking
        }

        draw() {
            if (!ctx) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        // Remove tiny particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (particles[i].size <= 0.2 || particles[i].y > height) {
                particles.splice(i, 1);
            }
        }

        if (particles.length > 0) {
            requestAnimationFrame(animate);
        } else {
            document.body.removeChild(canvas);
        }
    }

    animate();

    // Confetti Burst from bottom center
    // Actually, let's make it more festive, maybe multiple bursts.
}

// Improved version based on a simple physics model
export function fireConfetti() {
    triggerConfetti();
    setTimeout(triggerConfetti, 200);
    setTimeout(triggerConfetti, 400);
}
