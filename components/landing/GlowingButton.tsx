'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlowingButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'lg' | 'sm'
  className?: string
  icon?: ReactNode
}

export function GlowingButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'default',
  className = '',
  icon,
}: GlowingButtonProps) {
  const baseStyles = cn(
    'relative inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-full',
    'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-background',
    {
      'px-8 py-4 text-base': size === 'lg',
      'px-6 py-3 text-sm': size === 'default',
      'px-4 py-2 text-xs': size === 'sm',
    },
    className
  )

  const variants = {
    primary: (
      <motion.span
        className={cn(
          baseStyles,
          'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900',
          'hover:from-amber-400 hover:to-orange-400',
          'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
          'hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/0 via-white/25 to-amber-400/0 opacity-0 hover:opacity-100 transition-opacity" />
      </motion.span>
    ),
    secondary: (
      <motion.span
        className={cn(
          baseStyles,
          'bg-white/5 text-white border border-white/10',
          'hover:bg-white/10 hover:border-white/20',
          'backdrop-blur-sm'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </motion.span>
    ),
    ghost: (
      <motion.span
        className={cn(
          baseStyles,
          'text-white/70 hover:text-white hover:bg-white/5'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </motion.span>
    ),
  }

  if (href) {
    return <Link href={href}>{variants[variant]}</Link>
  }

  return (
    <button onClick={onClick} className="appearance-none">
      {variants[variant]}
    </button>
  )
}
