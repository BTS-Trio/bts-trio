import React, { useEffect, useRef } from 'react';
import { topics } from './content.js';

const particles = Array.from({ length: 44 }, (_, index) => ({
  phase: index * 2.39996,
  ring: (index % 11) / 10,
  layer: Math.floor(index / 11) - 1.5,
  size: index % 7 === 0 ? 2.2 : index % 3 === 0 ? 1.55 : 1,
  color: ['#c0adff', '#a7c7ff', '#e4c9ff'][index % 3],
}));
const keepClear = [...topics, { x: 51.6, y: 43, w: 18.7 }];

export function GalaxyParticles({ paused }) {
  const canvasRef = useRef(null);
  const time = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = null;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (preference.matches || !width || !height) return;
      const sizeScale = Math.min(1.25, Math.max(.65, width / 840));

      for (const particle of particles) {
        const angle = particle.phase + time.current * (.24 + .16 * particle.ring);
        const depth = Math.sin(angle);
        const horizontal = Math.cos(angle) * (25 + 18 * particle.ring);
        const x = 51 + horizontal;
        const y = 46 + depth * (17 + 10 * particle.ring) - horizontal * .19 + particle.layer * 5;
        const covered = keepClear.some(node =>
          ((x - node.x) / (node.w / 2 + .4)) ** 2 + ((y - node.y) / (node.w + .8)) ** 2 < 1
        );
        if (covered) continue;

        ctx.globalAlpha = .21 + .36 * ((depth + 1) / 2);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(x * width / 100, y * height / 100, particle.size * sizeScale, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    function tick(now) {
      if (previous !== null) time.current += Math.min(now - previous, 40) / 1000;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    }

    function sync() {
      cancelAnimationFrame(frame);
      previous = null;
      draw();
      if (!paused && !preference.matches) frame = requestAnimationFrame(tick);
    }

    function resize() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      draw();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    preference.addEventListener('change', sync);
    resize();
    sync();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      preference.removeEventListener('change', sync);
    };
  }, [paused]);

  return <canvas className="galaxy-particles" ref={canvasRef} aria-hidden="true" />;
}

