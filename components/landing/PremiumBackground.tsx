'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

// Seeded pseudo-random number generator for consistent SSR/client values
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// Round to 2 decimal places to prevent hydration mismatch from float precision
function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function PremiumBackground() {
  // Pre-compute particle properties to avoid hydration mismatch
  // All values rounded to 2 decimal places for SSR/client consistency
  const particles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      width: round(3 + seededRandom(i * 1) * 4),
      height: round(3 + seededRandom(i * 2) * 4),
      left: round(seededRandom(i * 3) * 100),
      top: round(seededRandom(i * 4) * 100),
      opacity: round(0.6 + seededRandom(i * 5) * 0.4),
      shadowSize: round(10 + seededRandom(i * 6) * 20),
      duration: round(8 + seededRandom(i * 9) * 8),
      delay: round(seededRandom(i * 10) * 10),
    })),
  [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#030303]">
      {/* Inline keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes premium-blob1 {
          0%, 100% { transform: scale(1); }
          33% { transform: scale(1.1) translate(5%, 5%); }
          66% { transform: scale(0.9) translate(-5%, -5%); }
        }
        @keyframes premium-blob2 {
          0%, 100% { transform: scale(1); }
          33% { transform: scale(0.9) translate(-5%, 5%); }
          66% { transform: scale(1.1) translate(5%, -5%); }
        }
        @keyframes premium-blob3 {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15) translate(5%, -5%); }
        }
        @keyframes premium-rotate-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes premium-rotate-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes premium-pulse-ring {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(150); opacity: 0; }
        }
        @keyframes premium-float {
          0%, 100% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(-150px) scale(1); opacity: 1; }
        }
      `}} />
      
      {/* Hypnotic rotating gradient rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${300 + i * 200}px`,
              height: `${300 + i * 200}px`,
              left: '50%',
              top: '50%',
              marginLeft: `-${(300 + i * 200) / 2}px`,
              marginTop: `-${(300 + i * 200) / 2}px`,
              borderColor: `rgba(245, 158, 11, ${0.15 - i * 0.015})`,
              boxShadow: `0 0 ${30 + i * 10}px rgba(245, 158, 11, ${0.1 - i * 0.01}), inset 0 0 ${20 + i * 5}px rgba(245, 158, 11, ${0.05 - i * 0.005})`,
              animation: `${i % 2 === 0 ? 'premium-rotate-cw' : 'premium-rotate-ccw'} ${30 + i * 5}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Morphing organic blobs */}
      <div className="absolute inset-0" style={{ filter: 'blur(60px)' }}>
        <div
          className="absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            left: '20%',
            top: '30%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(234,88,12,0.2) 70%, transparent 100%)',
            animation: 'premium-blob1 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '360px',
            height: '320px',
            left: '80%',
            top: '40%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(217,119,6,0.15) 70%, transparent 100%)',
            animation: 'premium-blob2 18s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '440px',
            height: '380px',
            left: '50%',
            top: '70%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(168,85,247,0.1) 70%, transparent 100%)',
            animation: 'premium-blob3 20s ease-in-out infinite 4s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '320px',
            height: '360px',
            left: '30%',
            top: '80%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(234,88,12,0.15) 70%, transparent 100%)',
            animation: 'premium-blob1 16s ease-in-out infinite 6s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '340px',
            height: '280px',
            left: '70%',
            top: '20%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, rgba(217,119,6,0.1) 70%, transparent 100%)',
            animation: 'premium-blob2 14s ease-in-out infinite 3s',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: `radial-gradient(circle, rgba(245,158,11,${p.opacity}) 0%, transparent 70%)`,
              boxShadow: `0 0 ${p.shadowSize}px rgba(245,158,11,0.5)`,
              animation: `premium-float ${p.duration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Pulsing energy waves from center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: '10px',
              height: '10px',
              left: '50%',
              top: '50%',
              marginLeft: '-5px',
              marginTop: '-5px',
              border: '1px solid rgba(245,158,11,0.4)',
              boxShadow: '0 0 20px rgba(245,158,11,0.3)',
              animation: `premium-pulse-ring 6s ease-out infinite ${i * 1.2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(234,88,12,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.06) 0%, transparent 50%)
          `,
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grain texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
    </div>
  )
}
