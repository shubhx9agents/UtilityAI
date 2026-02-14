'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'
import { ArrowRight, Play } from 'lucide-react'

// =============================================================================
// SEEDED RANDOM - Prevents hydration mismatch by generating consistent values
// =============================================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// =============================================================================
// CSS KEYFRAMES - GPU-accelerated animations using transform & opacity only
// =============================================================================
const keyframesCSS = `
  /* Floating orb drift animation - slow, smooth movement */
  @keyframes hero-orb-drift {
    0%, 100% { 
      transform: translate3d(0, 0, 0) scale(1); 
      opacity: 0.6;
    }
    25% { 
      transform: translate3d(30px, -40px, 0) scale(1.05); 
      opacity: 0.8;
    }
    50% { 
      transform: translate3d(-20px, -60px, 0) scale(0.95); 
      opacity: 0.7;
    }
    75% { 
      transform: translate3d(-40px, -30px, 0) scale(1.02); 
      opacity: 0.75;
    }
  }

  /* Particle float upward animation */
  @keyframes hero-particle-float {
    0% { 
      transform: translate3d(0, 0, 0) scale(0); 
      opacity: 0;
    }
    10% { 
      transform: translate3d(0, -10vh, 0) scale(1); 
      opacity: 1;
    }
    90% { 
      transform: translate3d(var(--drift-x, 20px), -90vh, 0) scale(1); 
      opacity: 0.8;
    }
    100% { 
      transform: translate3d(var(--drift-x, 20px), -100vh, 0) scale(0); 
      opacity: 0;
    }
  }

  /* Volumetric light ray pulse */
  @keyframes hero-light-pulse {
    0%, 100% { 
      opacity: 0.15; 
      transform: scaleY(1) translateZ(0);
    }
    50% { 
      opacity: 0.3; 
      transform: scaleY(1.1) translateZ(0);
    }
  }

  /* Glow pulse for orbs */
  @keyframes hero-glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 60px 30px var(--glow-color);
      transform: scale(1) translateZ(0);
    }
    50% { 
      box-shadow: 0 0 100px 50px var(--glow-color);
      transform: scale(1.05) translateZ(0);
    }
  }

  /* Subtle background gradient shift */
  @keyframes hero-gradient-shift {
    0%, 100% { 
      background-position: 0% 50%;
    }
    50% { 
      background-position: 100% 50%;
    }
  }
`

// =============================================================================
// HERO SECTION COMPONENT
// =============================================================================
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse position for parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Smooth spring animation for mouse tracking
  const springConfig = { damping: 25, stiffness: 150 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)
  
  // Transform mouse position to parallax offset
  const orbParallaxX = useTransform(smoothMouseX, [-500, 500], [-30, 30])
  const orbParallaxY = useTransform(smoothMouseY, [-500, 500], [-30, 30])
  const particleParallaxX = useTransform(smoothMouseX, [-500, 500], [-15, 15])
  const particleParallaxY = useTransform(smoothMouseY, [-500, 500], [-15, 15])

  // Mouse move handler for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set(clientX - innerWidth / 2)
      mouseY.set(clientY - innerHeight / 2)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Pre-computed particle data for consistent SSR/client rendering
  const particles = useMemo(() => 
    [...Array(40)].map((_, i) => ({
      size: 2 + seededRandom(i * 1) * 3,
      left: seededRandom(i * 2) * 100,
      delay: seededRandom(i * 3) * 15,
      duration: 12 + seededRandom(i * 4) * 8,
      driftX: (seededRandom(i * 5) - 0.5) * 60,
      isCyan: seededRandom(i * 6) > 0.5,
    })),
  [])

  // Pre-computed orb data
  const orbs = useMemo(() => [
    { x: '15%', y: '25%', size: 300, color: 'rgba(14, 165, 233, 0.4)', delay: 0, duration: 20 },
    { x: '75%', y: '20%', size: 250, color: 'rgba(124, 58, 237, 0.35)', delay: 5, duration: 25 },
    { x: '60%', y: '70%', size: 350, color: 'rgba(14, 165, 233, 0.3)', delay: 10, duration: 22 },
    { x: '25%', y: '75%', size: 200, color: 'rgba(124, 58, 237, 0.3)', delay: 7, duration: 18 },
    { x: '85%', y: '55%', size: 180, color: 'rgba(14, 165, 233, 0.25)', delay: 12, duration: 24 },
  ], [])

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        // CSS custom properties for easy customization
        ['--color-base-dark' as string]: '#000000',
        ['--color-base-navy' as string]: '#0a0e27',
        ['--color-accent-cyan' as string]: '#0ea5e9',
        ['--color-accent-purple' as string]: '#7c3aed',
      }}
    >
      {/* Inject keyframes */}
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />

      {/* ================================================================== */}
      {/* BACKGROUND LAYERS - Stacked for depth with GPU acceleration */}
      {/* ================================================================== */}
      
      {/* Layer 1: Base gradient - Navy to Black */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0e27 0%, #050714 40%, #000000 100%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* Layer 2: Animated gradient overlay - Cyan to Purple at 20% opacity */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(45deg, rgba(14, 165, 233, 0.2) 0%, rgba(124, 58, 237, 0.2) 50%, rgba(14, 165, 233, 0.15) 100%)',
          backgroundSize: '200% 200%',
          animation: 'hero-gradient-shift 15s ease-in-out infinite',
          willChange: 'background-position',
          transform: 'translateZ(0)',
        }}
      />

      {/* Layer 3: Glowing Orbs with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          x: orbParallaxX, 
          y: orbParallaxY,
          willChange: 'transform',
        }}
      >
        {orbs.map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: orb.x,
              top: orb.y,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: 'blur(40px)',
              animation: `hero-orb-drift ${orb.duration}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
              willChange: 'transform, opacity',
              transform: 'translate3d(-50%, -50%, 0)',
              ['--glow-color' as string]: orb.color,
            }}
          />
        ))}
      </motion.div>

      {/* Layer 4: Volumetric light rays */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Central light beam */}
        <div 
          className="absolute left-1/2 top-0 h-full w-[2px]"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(14, 165, 233, 0.3) 30%, rgba(124, 58, 237, 0.3) 70%, transparent 100%)',
            filter: 'blur(20px)',
            animation: 'hero-light-pulse 3s ease-in-out infinite',
            willChange: 'transform, opacity',
            transform: 'translateX(-50%) scaleX(60)',
          }}
        />
        {/* Left diagonal ray */}
        <div 
          className="absolute -left-20 top-0 h-full w-[400px]"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
            filter: 'blur(60px)',
            animation: 'hero-light-pulse 4s ease-in-out infinite',
            animationDelay: '1s',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />
        {/* Right diagonal ray */}
        <div 
          className="absolute -right-20 top-0 h-full w-[400px]"
          style={{
            background: 'linear-gradient(225deg, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
            filter: 'blur(60px)',
            animation: 'hero-light-pulse 4s ease-in-out infinite',
            animationDelay: '2s',
            willChange: 'transform, opacity',
            transform: 'translateZ(0)',
          }}
        />
      </div>

      {/* Layer 5: Floating particles with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          x: particleParallaxX, 
          y: particleParallaxY,
          willChange: 'transform',
        }}
      >
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              bottom: '-10px',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.isCyan 
                ? 'radial-gradient(circle, rgba(14, 165, 233, 0.9) 0%, rgba(14, 165, 233, 0.4) 50%, transparent 100%)'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
              boxShadow: particle.isCyan 
                ? '0 0 6px 2px rgba(14, 165, 233, 0.5)'
                : '0 0 6px 2px rgba(255, 255, 255, 0.3)',
              animation: `hero-particle-float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              willChange: 'transform, opacity',
              ['--drift-x' as string]: `${particle.driftX}px`,
            }}
          />
        ))}
      </motion.div>

      {/* Layer 6: Depth blur overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
          backdropFilter: 'blur(0.5px)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* Layer 7: Vignette for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.5) 100%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      />

      {/* ================================================================== */}
      {/* FOREGROUND CONTENT - Centered hero content */}
      {/* ================================================================== */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Gradient overlay behind text for readability */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(10, 14, 39, 0.6) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.2), inset 0 0 20px rgba(14, 165, 233, 0.1)',
              color: '#fff',
            }}
          >
            <span className="text-base">✨</span>
            <span>Now with Smart Chatbot Integration</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            style={{
              lineHeight: 1.1,
              textShadow: '0 0 40px rgba(14, 165, 233, 0.3)',
            }}
          >
            Turn Conversations Into{' '}
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 50%, #0ea5e9 100%)',
                backgroundSize: '200% 200%',
                animation: 'hero-gradient-shift 5s ease-in-out infinite',
              }}
            >
              Conversions.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10"
            style={{ lineHeight: 1.6 }}
          >
            Automate outreach, engage customers 24/7, and watch your sales grow — powered by cutting-edge AI.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary Button - Get Started */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full transition-all duration-300"
              style={{
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)',
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>

            {/* Secondary Button - See It in Action */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-full border border-white/30 transition-all duration-300"
              style={{
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.05)',
              }}
            >
              <Play className="w-5 h-5" />
              <span>See It in Action</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
