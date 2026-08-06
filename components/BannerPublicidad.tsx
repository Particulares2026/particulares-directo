"use client";

import { useEffect, useState } from "react";

const TEXTO = "Cádiz Paraíso Natural";
const INTERVALO_MS = 4500;

function FiltroGrano({ id }: { id: string }) {
  return (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="ruido" />
      <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
    </filter>
  );
}

function SlideArena() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="arena" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde9c8" />
          <stop offset="55%" stopColor="#eec27f" />
          <stop offset="100%" stopColor="#c98a4b" />
        </linearGradient>
        <FiltroGrano id="granoArena" />
      </defs>
      <rect width="800" height="300" fill="url(#arena)" />
      <rect width="800" height="300" filter="url(#granoArena)" opacity="0.5" />
      <path d="M0 90 Q 200 70 420 95 T 800 85" stroke="#b9784a" strokeWidth="3" fill="none" opacity="0.35" />
      <path d="M0 150 Q 250 130 500 155 T 800 140" stroke="#b9784a" strokeWidth="3" fill="none" opacity="0.3" />
      <g transform="translate(620,180) rotate(12)">
        <path
          d="M0 -46 L13 -13 L48 -10 L20 12 L29 46 L0 26 L-29 46 L-20 12 L-48 -10 L-13 -13 Z"
          fill="#e07a3e"
          stroke="#a4501f"
          strokeWidth="2"
        />
        <circle cx="0" cy="0" r="7" fill="#a4501f" opacity="0.4" />
      </g>
      <g transform="translate(140,210)">
        <ellipse cx="0" cy="0" rx="16" ry="10" fill="#f4d9a8" stroke="#c98a4b" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function SlideOlas() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="oceano" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="55%" stopColor="#1596b0" />
          <stop offset="100%" stopColor="#5fd4d9" />
        </linearGradient>
        <FiltroGrano id="granoOlas" />
        <filter id="desenfoque">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <rect width="800" height="300" fill="url(#oceano)" />
      <rect width="800" height="300" filter="url(#granoOlas)" opacity="0.4" />
      <g filter="url(#desenfoque)" opacity="0.85">
        <path d="M-20 200 Q 60 180 140 205 T 300 195 T 460 210 T 620 190 T 800 205 V300 H-20 Z" fill="#f0fdff" opacity="0.55" />
        <path d="M-20 235 Q 90 215 200 240 T 420 230 T 640 245 T 820 225 V300 H-20 Z" fill="#ffffff" opacity="0.7" />
      </g>
      <path d="M-20 260 Q 100 245 220 265 T 460 258 T 700 268 T 820 255" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}

function SlideReflejo() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="cieloR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8b25c" />
          <stop offset="100%" stopColor="#fcd98a" />
        </linearGradient>
        <linearGradient id="marR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6c177" />
          <stop offset="100%" stopColor="#c97b3d" />
        </linearGradient>
        <radialGradient id="brillo" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#fff7e6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff7e6" stopOpacity="0" />
        </radialGradient>
        <FiltroGrano id="granoReflejo" />
      </defs>
      <rect width="800" height="150" fill="url(#cieloR)" />
      <circle cx="400" cy="150" r="260" fill="url(#brillo)" />
      <circle cx="400" cy="140" r="30" fill="#fffceb" />
      <rect y="150" width="800" height="150" fill="url(#marR)" />
      <rect width="800" height="300" filter="url(#granoReflejo)" opacity="0.45" />
      <path d="M390 155 L410 155 L430 300 L370 300 Z" fill="#fff7e6" opacity="0.25" />
      <path d="M370 190 L430 190 M360 220 L440 220 M350 255 L450 255" stroke="#fff7e6" strokeWidth="3" opacity="0.25" />
    </svg>
  );
}

const SLIDES = [SlideArena, SlideOlas, SlideReflejo];

export default function BannerPublicidad() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % SLIDES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden w-full shrink-0"
      style={{ height: "clamp(120px, 16vw, 200px)" }}
    >
      {SLIDES.map((Slide, i) => (
        <div
          key={i}
          className={
            "absolute inset-0 transition-opacity duration-700 " +
            (i === indice ? "opacity-100" : "opacity-0 pointer-events-none")
          }
        >
          <Slide />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-white text-center px-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
              {TEXTO}
            </p>
          </div>
        </div>
      ))}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndice(i)}
            aria-label={`Ver imagen ${i + 1}`}
            className={"w-1.5 h-1.5 rounded-full " + (i === indice ? "bg-white" : "bg-white/40")}
          />
        ))}
      </div>
    </div>
  );
}
