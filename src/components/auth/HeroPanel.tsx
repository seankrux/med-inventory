'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { LogoMark } from '@/components/Logo'

/**
 * Brand panel for the split-screen auth layout. Hand-built SVG — a clinic-green
 * → charcoal gradient mesh with a faint molecular node/edge network and an
 * inventory grid. No raster assets: crisp at any size, themed via the same
 * palette as the rest of the app. Motion is restrained (DESIGN.md §1) and fully
 * disabled under prefers-reduced-motion.
 */

// Deterministic node layout (viewBox 0..400 × 0..600) so edges line up.
const NODES = [
  { x: 70, y: 90 }, { x: 150, y: 60 }, { x: 250, y: 110 }, { x: 330, y: 70 },
  { x: 110, y: 200 }, { x: 210, y: 180 }, { x: 300, y: 230 },
  { x: 60, y: 320 }, { x: 170, y: 330 }, { x: 280, y: 360 }, { x: 350, y: 300 },
  { x: 120, y: 450 }, { x: 230, y: 470 }, { x: 320, y: 440 },
  { x: 80, y: 540 }, { x: 200, y: 560 }, { x: 300, y: 540 },
]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 6], [3, 6],
  [4, 5], [5, 6], [4, 7], [5, 8], [6, 10], [8, 9], [9, 10],
  [7, 8], [8, 11], [9, 12], [10, 13], [11, 12], [12, 13],
  [11, 14], [12, 15], [13, 16], [14, 15], [15, 16],
]

export function HeroPanel() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      gsap.from('.hero-edge', {
        opacity: 0,
        duration: 1.1,
        stagger: 0.025,
        ease: 'power2.out',
        immediateRender: false,
        clearProps: 'opacity',
      })
      gsap.from('.hero-node', {
        scale: 0,
        opacity: 0,
        transformOrigin: 'center',
        duration: 0.6,
        stagger: 0.04,
        ease: 'back.out(2)',
        delay: 0.15,
        immediateRender: false,
        clearProps: 'scale,transform',
        onComplete: () => {
          gsap.to('.hero-node', {
            opacity: 'random(0.45, 1)',
            duration: 2.4,
            repeat: -1,
            yoyo: true,
            stagger: { each: 0.3, from: 'random' },
            ease: 'sine.inOut',
          })
        },
      })
      gsap.from('.hero-copy > *', {
        y: 16,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3,
        immediateRender: false,
        clearProps: 'opacity,transform',
      })
    },
    { scope: root },
  )

  return (
    <div
      ref={root}
      className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12"
    >
      {/* mesh + network */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="hero-glow" cx="30%" cy="25%" r="85%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#047857" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d1116" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1116" />
            <stop offset="100%" stopColor="#11201a" />
          </linearGradient>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#34d399" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="400" height="600" fill="url(#hero-base)" />
        <rect width="400" height="600" fill="url(#hero-grid)" />
        <rect width="400" height="600" fill="url(#hero-glow)" />

        <g stroke="#34d399" strokeOpacity="0.35" strokeWidth="1">
          {EDGES.map(([a, b], i) => (
            <line
              key={i}
              className="hero-edge"
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
            />
          ))}
        </g>
        <g>
          {NODES.map((n, i) => (
            <circle
              key={i}
              className="hero-node"
              cx={n.x}
              cy={n.y}
              r={i % 4 === 0 ? 3.5 : 2.2}
              fill="#6ee7b7"
            />
          ))}
        </g>
      </svg>

      {/* foreground copy */}
      <div className="hero-copy relative z-10 flex items-center gap-3">
        <LogoMark size={40} />
        <span className="text-lg font-semibold tracking-tight text-white">
          DG&nbsp;Labs <span className="text-clinic-400">Inventory</span>
        </span>
      </div>

      <div className="hero-copy relative z-10 max-w-sm">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
          Every dose accounted for.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-300">
          Real-time stock, dispense, and receipt tracking for your lab — calm,
          precise, and audit-ready.
        </p>
        <div className="mt-6 flex gap-6 text-xs uppercase tracking-wider text-ink-400">
          <span>Live stock</span>
          <span>Audit trail</span>
          <span>Role access</span>
        </div>
      </div>
    </div>
  )
}
