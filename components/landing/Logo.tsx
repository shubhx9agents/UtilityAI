'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  animate?: boolean
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 56, text: 'text-2xl' },
}

function LogoSVG({ iconSize }: { iconSize: number }) {
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
    >
      {/* Background with gradient */}
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Rounded square background */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#logoGrad)"
      />
      
      {/* Inner highlight */}
      <rect
        x="4"
        y="4"
        width="40"
        height="20"
        rx="10"
        fill="white"
        fillOpacity="0.15"
      />
      
      {/* Abstract "U" shape made of flowing lines */}
      <path
        d="M14 14 L14 28 Q14 34 20 34 L28 34 Q34 34 34 28 L34 14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter="url(#glow)"
      />
      
      {/* AI spark/neural dots */}
      <circle cx="14" cy="14" r="2.5" fill="white" />
      <circle cx="34" cy="14" r="2.5" fill="white" />
      <circle cx="24" cy="20" r="2" fill="white" fillOpacity="0.8" />
      
      {/* Connecting lines for AI/neural effect */}
      <path
        d="M14 14 L24 20 L34 14"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Center energy burst */}
      <circle cx="24" cy="26" r="3" fill="url(#innerGrad)" />
      <circle cx="24" cy="26" r="5" stroke="white" strokeWidth="1" strokeOpacity="0.4" fill="none" />
    </svg>
  )
}

export function Logo({ size = 'md', showText = true, animate = true }: LogoProps) {
  const iconSize = sizes[size].icon
  const textClass = sizes[size].text

  if (animate) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <LogoSVG iconSize={iconSize} />
          <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-xl -z-10" />
        </motion.div>
        {showText && (
          <span className={`font-heading ${textClass} font-bold text-white tracking-tight`}>
            Utility<span className="text-amber-500">AI</span>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <LogoSVG iconSize={iconSize} />
        <div className="absolute inset-0 bg-amber-500/30 blur-xl rounded-xl -z-10" />
      </div>
      {showText && (
        <span className={`font-heading ${textClass} font-bold text-white tracking-tight`}>
          Utility<span className="text-amber-500">AI</span>
        </span>
      )}
    </div>
  )
}

// Alternative minimal logo for small spaces
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#logoMarkGrad)" />
      <path
        d="M14 14 L14 28 Q14 34 20 34 L28 34 Q34 34 34 28 L34 14"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="14" r="2.5" fill="white" />
      <circle cx="34" cy="14" r="2.5" fill="white" />
      <path d="M14 14 L24 20 L34 14" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
      <circle cx="24" cy="26" r="3" fill="white" fillOpacity="0.9" />
    </svg>
  )
}
