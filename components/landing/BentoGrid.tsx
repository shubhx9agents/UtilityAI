'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  children: ReactNode
  className?: string
  gradient?: string
  spotlight?: boolean
}

export function BentoCard({
  children,
  className = '',
  gradient,
  spotlight = true,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.01]',
        'border border-white/[0.1]',
        'backdrop-blur-md',
        'transition-all duration-500',
        'hover:border-white/[0.2]',
        'hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.25),0_0_0_1px_rgba(255,255,255,0.08)]',
        'shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]',
        className
      )}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Gradient overlay */}
      {gradient && (
        <div
          className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            gradient
          )}
        />
      )}

      {/* Spotlight effect */}
      {spotlight && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  )
}

export function BentoGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  )
}
