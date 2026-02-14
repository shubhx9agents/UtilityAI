'use client'

import { motion } from 'framer-motion'

// SVG Logo Components - Large, professional company logos
const LogoSVGs = {
  TechFlow: () => (
    <svg viewBox="0 0 180 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <path
        d="M10 8h8v28H10V8zm14 6h8v22h-8V14zm14-3h8v25h-8V11z"
        fill="currentColor"
        opacity="0.9"
      />
      <text x="52" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        TechFlow
      </text>
    </svg>
  ),
  Meridian: () => (
    <svg viewBox="0 0 180 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <circle cx="18" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
      <path d="M18 10v28M4 24h28" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <text x="40" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        Meridian
      </text>
    </svg>
  ),
  Vortech: () => (
    <svg viewBox="0 0 170 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <polygon points="10,38 24,10 38,38" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
      <text x="48" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        Vortech
      </text>
    </svg>
  ),
  Luminary: () => (
    <svg viewBox="0 0 180 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <circle cx="18" cy="24" r="12" fill="currentColor" opacity="0.25" />
      <circle cx="18" cy="24" r="6" fill="currentColor" opacity="0.9" />
      <text x="38" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        Luminary
      </text>
    </svg>
  ),
  Cascade: () => (
    <svg viewBox="0 0 170 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <path d="M4 16h14M10 24h14M16 32h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <text x="42" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        Cascade
      </text>
    </svg>
  ),
  Stratos: () => (
    <svg viewBox="0 0 160 48" className="h-12 sm:h-14 md:h-16 w-auto">
      <rect x="4" y="12" width="28" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.9" />
      <text x="40" y="34" fill="currentColor" fontSize="24" fontWeight="700" fontFamily="system-ui">
        Stratos
      </text>
    </svg>
  ),
}

const logos = Object.entries(LogoSVGs)

export function LogoCloud() {
  return (
    <div className="relative overflow-hidden py-4">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#030303] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#030303] to-transparent z-10" />

      <motion.div
        className="flex gap-24 sm:gap-32 md:gap-40 items-center"
        animate={{
          x: [0, -1500],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 45,
            ease: 'linear',
          },
        }}
      >
        {/* Duplicate logos for seamless loop */}
        {[...logos, ...logos, ...logos].map(([name, Logo], i) => (
          <div
            key={`${name}-${i}`}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors duration-300"
          >
            <Logo />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function StaticLogoCloud() {
  return (
    <div className="flex flex-wrap justify-center gap-12 md:gap-16">
      {logos.map(([name, Logo], i) => (
        <motion.div
          key={name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="text-white/30 hover:text-white/50 transition-colors duration-300"
        >
          <Logo />
        </motion.div>
      ))}
    </div>
  )
}
