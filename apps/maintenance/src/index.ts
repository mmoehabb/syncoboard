import { serve } from "bun";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Under Maintenance - Syncoboard</title>
    <style>
        :root {
            --obsidian-night: #0B0E14;
            --void-grey: #161B22;
            --neon-pulse: #00F5FF;
            --git-green: #2EA043;
            --syntax-grey: #8B949E;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: var(--obsidian-night);
            color: #fff;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        #particle-canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .main-content {
            z-index: 10;
            width: 100%;
            max-width: 28rem; /* max-w-md */
            display: flex;
            flex-direction: column;
            gap: 2rem; /* gap-8 */
            padding: 2rem; /* p-8 */
            background-color: rgba(22, 27, 34, 0.8); /* bg-void-grey/80 */
            backdrop-filter: blur(12px); /* backdrop-blur-md */
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1); /* border-white/10 */
            border-radius: 0.5rem; /* rounded */
        }

        .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem; /* gap-4 */
        }

        .logo-container {
            width: 4rem; /* w-16 */
            height: 4rem; /* h-16 */
            border-radius: 0.25rem; /* rounded */
            background-color: var(--obsidian-night);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem; /* mb-2 */
        }

        .logo {
            width: 35px;
            height: 35px;
        }

        h1 {
            font-size: 1.5rem; /* text-2xl */
            font-weight: 700; /* font-bold */
            color: #fff;
            letter-spacing: -0.025em; /* tracking-tight */
            margin: 0;
        }

        p {
            color: var(--syntax-grey);
            font-size: 0.875rem; /* text-sm */
            font-family: 'JetBrains Mono', monospace; /* font-mono */
            margin: 0;
        }

        .maintenance-message {
            color: var(--neon-pulse);
            font-size: 1.1rem;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <canvas id="particle-canvas"></canvas>

    <main class="main-content">
        <div class="header">
            <div class="logo-container">
                <svg class="logo" viewBox="0 0 1157.71 966.64203" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(-829.58511,-273.01791)">
                        <path fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1859.7858,323.35452 -282.1415,282.00697 -175.9315,2.67881 204.5744,242.45844 c 44.135,46.3893 18.0609,211.39816 -113.6524,214.04536 l -282.2368,3.7884" />
                        <path fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1715.7795,558.53243 144.2873,170.66228 126.9424,1.45142" />
                        <path fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 829.7622,700.50949 124.20614,-0.8798 174.48146,237.95472" />
                        <path fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="M 1639.4333,440.66467 H 1351.461 c -107.236,1.07969 -166.0236,151.18959 -119.2072,210.28679 l 206.2686,253.14779 -170.1046,-1.33941 -283.95417,285.29356 526.38667,-1.3394 c 139.1891,1.5285 218.2508,-160.6874 224.5222,-251.24785 6.0346,-87.14263 -38.9838,-166.16717 -129.4244,-271.12063" />
                        <path fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" d="m 1233.5932,837.98085 c -144.9648,-136.40377 -155.7597,-276.3282 -82.5454,-393.17604 31.5354,-50.32946 75.4281,-117.57807 201.7526,-120.66849 h 506.2955" />
                        <ellipse fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1855.4126" cy="324.80603" rx="27.122978" ry="26.788126" />
                        <ellipse fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1405.5012" cy="608.04028" rx="29.360201" ry="26.518892" />
                        <ellipse fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="1435.335" cy="900.22168" rx="27.465996" ry="26.04534" />
                        <ellipse fill="none" stroke="#00ffff" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round" cx="984.98743" cy="1185.7733" rx="28.413097" ry="28.88665" />
                    </g>
                </svg>
            </div>

            <h1>Syncoboard</h1>
            <p>If the code moves, the card moves.</p>
        </div>

        <div class="maintenance-message">
            System Update in Progress
        </div>
        <p style="color: var(--syntax-grey); font-family: 'Inter', sans-serif;">
            Syncoboard is currently undergoing scheduled maintenance. We'll be back online shortly.
        </p>
    </main>

    <script>
        const COLOR_NODE = "rgba(255, 255, 255, 0.2)";

        class Particle {
            constructor(width, height) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; // Very subtle movement
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 1.5 + 0.5;
            }

            update(width, height) {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw(ctx) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = COLOR_NODE;
                ctx.fill();
            }
        }

        const canvas = document.getElementById('particle-canvas');
        if (canvas) {
            const ctx = canvas.getContext("2d");

            let animationFrameId;
            let particles = [];

            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                initParticles();
            };

            const initParticles = () => {
                particles = [];
                const particleCount = Math.floor((canvas.width * canvas.height) / 15000); // Responsive density
                for (let i = 0; i < particleCount; i++) {
                    particles.push(new Particle(canvas.width, canvas.height));
                }
            };

            // Mouse interaction
            let mouseX = -1000;
            let mouseY = -1000;

            const handleMouseMove = (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            };

            const handleMouseLeave = () => {
                mouseX = -1000;
                mouseY = -1000;
            };

            window.addEventListener("resize", resize);
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseleave", handleMouseLeave);

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw base ambient glow
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const gradient = ctx.createRadialGradient(
                    cx,
                    cy,
                    0,
                    cx,
                    cy,
                    Math.min(canvas.width, canvas.height) * 0.8,
                );
                gradient.addColorStop(0, "rgba(0, 245, 255, 0.03)");
                gradient.addColorStop(1, "transparent");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < particles.length; i++) {
                    particles[i].update(canvas.width, canvas.height);
                    particles[i].draw(ctx);

                    // Connect particles
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 120) {
                            ctx.beginPath();
                            ctx.strokeStyle = \`rgba(0, 245, 255, \${0.15 * (1 - distance / 120)})\`;
                            ctx.lineWidth = 0.5;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }

                    // Connect to mouse
                    const dxMouse = particles[i].x - mouseX;
                    const dyMouse = particles[i].y - mouseY;
                    const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

                    if (distanceMouse < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = \`rgba(0, 245, 255, \${0.3 * (1 - distanceMouse / 150)})\`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouseX, mouseY);
                        ctx.stroke();

                        // Slight push away from mouse
                        particles[i].x += dxMouse * 0.01;
                        particles[i].y += dyMouse * 0.01;
                    }
                }

                animationFrameId = requestAnimationFrame(animate);
            };

            resize();
            animate();
        }
    </script>
</body>
</html>`;

serve({
  port: PORT,
  fetch() {
    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});

console.log(`Maintenance app listening on port ${PORT}`);
