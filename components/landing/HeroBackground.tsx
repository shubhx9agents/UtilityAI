'use client'

import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'

// =============================================================================
// SEEDED RANDOM - Prevents hydration mismatch
// =============================================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

// =============================================================================
// CSS KEYFRAMES - Generate unique keyframes for each particle
// =============================================================================
function generateParticleKeyframes(particles: Array<{ driftX: number }>, prefix: string): string {
  return particles.map((p, i) => `
    @keyframes ${prefix}-fall-${i} {
      0% { 
        transform: translateY(-10px) translateX(0);
        opacity: 0;
      }
      10% { 
        opacity: 0.9;
      }
      90% {
        opacity: 0.9;
      }
      100% { 
        transform: translateY(110vh) translateX(${p.driftX}px);
        opacity: 0;
      }
    }
  `).join('\n')
}

const glowKeyframes = `
  @keyframes hero-glow-pulse {
    0%, 100% { 
      opacity: 0.6;
      transform: scale(1);
    }
    50% { 
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
`

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)
  const globeRef = useRef({ rotation: 0 })

  // Pre-computed particle data for consistent SSR/client rendering
  const leftParticles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      size: round(2 + seededRandom(i * 1) * 3),
      left: round(2 + seededRandom(i * 2) * 15),
      delay: round(seededRandom(i * 3) * 8),
      duration: round(6 + seededRandom(i * 4) * 6),
      driftX: round((seededRandom(i * 5) - 0.5) * 30),
    })),
  [])

  const rightParticles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      size: round(2 + seededRandom((i + 100) * 1) * 3),
      right: round(2 + seededRandom((i + 100) * 2) * 15),
      delay: round(seededRandom((i + 100) * 3) * 8),
      duration: round(6 + seededRandom((i + 100) * 4) * 6),
      driftX: round((seededRandom((i + 100) * 5) - 0.5) * 30),
    })),
  [])

  // Generate all particle keyframes CSS
  const keyframesCSS = useMemo(() => {
    const leftKf = generateParticleKeyframes(leftParticles, 'left')
    const rightKf = generateParticleKeyframes(rightParticles, 'right')
    return leftKf + rightKf + glowKeyframes
  }, [leftParticles, rightParticles])

  // Canvas globe animation with GSAP
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    const globe = globeRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with device pixel ratio
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // GSAP rotation animation
    gsap.to(globeRef.current, {
      rotation: Math.PI * 2,
      duration: 60,
      repeat: -1,
      ease: 'none',
    })

    // Draw wireframe globe
    const drawGlobe = () => {
      const rect = container.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      
      const centerX = rect.width / 2
      const centerY = rect.height * 0.52
      const radius = Math.min(rect.width, rect.height) * 0.32
      const tilt = 0.35

      // Outer glow
      const outerGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.5)
      outerGlow.addColorStop(0, 'rgba(14, 165, 233, 0.12)')
      outerGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.04)')
      outerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = outerGlow
      ctx.fillRect(0, 0, rect.width, rect.height)

      // Draw latitude lines (horizontal ellipses)
      const latCount = 10
      for (let i = 0; i <= latCount; i++) {
        const lat = (i / latCount) * Math.PI - Math.PI / 2
        const y = centerY + Math.sin(lat) * radius * Math.cos(tilt)
        const radiusAtLat = Math.cos(lat) * radius
        
        if (radiusAtLat > 5) {
          ctx.beginPath()
          ctx.ellipse(centerX, y, radiusAtLat, radiusAtLat * Math.sin(tilt) * 0.35, 0, 0, Math.PI * 2)
          const alpha = 0.12 + Math.cos(lat) * 0.15
          ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // Draw longitude lines (vertical curves)
      const lonCount = 20
      for (let i = 0; i < lonCount; i++) {
        const lon = (i / lonCount) * Math.PI * 2 + globeRef.current.rotation
        
        ctx.beginPath()
        for (let j = 0; j <= 40; j++) {
          const lat = (j / 40) * Math.PI - Math.PI / 2
          const x = centerX + Math.cos(lon) * Math.cos(lat) * radius
          const y = centerY + Math.sin(lat) * radius * Math.cos(tilt) + 
                    Math.sin(lon) * Math.cos(lat) * radius * Math.sin(tilt) * 0.35
          
          if (j === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        
        // Fade based on front/back facing
        const frontFacing = Math.cos(lon)
        const alpha = 0.06 + Math.max(0, frontFacing) * 0.18
        ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Outer ring glow
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.02, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner sphere glow
      const innerGlow = ctx.createRadialGradient(centerX, centerY - radius * 0.25, 0, centerX, centerY, radius)
      innerGlow.addColorStop(0, 'rgba(14, 165, 233, 0.08)')
      innerGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.03)')
      innerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = innerGlow
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()

      animationFrameRef.current = requestAnimationFrame(drawGlobe)
    }

    drawGlobe()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameRef.current)
      gsap.killTweensOf(globe)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />

      {/* Background gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #000000 0%, #020617 30%, #0a0e27 60%, #000000 100%)',
        }}
      />

      {/* Central light beam */}
      <div 
        className="absolute left-1/2 top-0 h-full w-[800px] -translate-x-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(14, 165, 233, 0.04) 20%, rgba(14, 165, 233, 0.1) 50%, rgba(14, 165, 233, 0.04) 80%, transparent 100%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Secondary light beam */}
      <div 
        className="absolute left-1/2 top-[35%] w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Canvas for 3D Globe */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Left side particles */}
      <div className="absolute left-0 top-0 h-full w-[20%] pointer-events-none overflow-hidden">
        {leftParticles.map((p, i) => (
          <div
            key={`left-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: '-10px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.9) 0%, rgba(14, 165, 233, 0.4) 50%, transparent 100%)',
              boxShadow: `0 0 ${p.size * 3}px rgba(14, 165, 233, 0.6)`,
              animation: `left-fall-${i} ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Right side particles */}
      <div className="absolute right-0 top-0 h-full w-[20%] pointer-events-none overflow-hidden">
        {rightParticles.map((p, i) => (
          <div
            key={`right-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              right: `${p.right}%`,
              top: '-10px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.9) 0%, rgba(14, 165, 233, 0.4) 50%, transparent 100%)',
              boxShadow: `0 0 ${p.size * 3}px rgba(14, 165, 233, 0.6)`,
              animation: `right-fall-${i} ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Ambient glow spots */}
      <div 
        className="absolute left-[5%] top-[30%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'hero-glow-pulse 8s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute right-[5%] top-[40%] w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'hero-glow-pulse 10s ease-in-out infinite 2s',
        }}
      />

      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
        }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
    </div>
  )
}
