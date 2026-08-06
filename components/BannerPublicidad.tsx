"use client";

import { useEffect, useState } from "react";

const TEXTO = "Cádiz Paraíso Natural";
const INTERVALO_MS = 4500;

function SlideAmanecer() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="cieloA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="45%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="marA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect width="800" height="180" fill="url(#cieloA)" />
      <circle cx="640" cy="150" r="46" fill="#fef3c7" opacity="0.95" />
      <rect y="170" width="800" height="130" fill="url(#marA)" />
      <path d="M0 178 Q 200 165 400 178 T 800 178 V 300 H 0 Z" fill="#0c4a6e" opacity="0.35" />
      <path d="M120 230 q10 -12 20 0" stroke="#f0f9ff" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M160 250 q10 -12 20 0" stroke="#f0f9ff" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M60 260 q10 -12 20 0" stroke="#f0f9ff" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M40 120 q18 -14 36 0 M90 110 q18 -14 36 0" stroke="#fde68a" strokeWidth="3" fill="none" opacity="0.8" />
    </svg>
  );
}

function SlideMediodia() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="cieloM" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id="marM" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="800" height="150" fill="url(#cieloM)" />
      <circle cx="120" cy="70" r="34" fill="#fde047" />
      <rect y="150" width="800" height="90" fill="url(#marM)" />
      <rect y="240" width="800" height="60" fill="#fde68a" />
      <path d="M0 150 Q 200 138 400 150 T 800 150 V 170 H 0 Z" fill="#5eead4" opacity="0.6" />
      <path d="M600 300 L620 190 L640 300 Z" fill="#166534" />
      <path d="M610 200 q30 -20 55 -5" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M610 205 q-30 -15 -50 5" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="250" cy="260" r="10" fill="#fca5a5" />
      <rect x="240" y="260" width="20" height="4" fill="#fca5a5" />
    </svg>
  );
}

function SlideAtardecer() {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="cieloT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="marT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <rect width="800" height="180" fill="url(#cieloT)" />
      <circle cx="400" cy="175" r="55" fill="#fef9c3" />
      <rect y="170" width="800" height="130" fill="url(#marT)" />
      <path d="M0 340 L60 200 L130 260 L220 170 L320 260 L420 195 L520 260 L620 210 L720 260 L800 220 V300 H0 Z" fill="#1e1b4b" opacity="0.55" />
      <path d="M100 90 q10 -8 20 0 M140 80 q10 -8 20 0 M180 95 q10 -8 20 0" stroke="#1e1b4b" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}

const SLIDES = [SlideAmanecer, SlideMediodia, SlideAtardecer];

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
      style={{ height: "clamp(180px, 28vw, 340px)" }}
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
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-white text-center px-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
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
