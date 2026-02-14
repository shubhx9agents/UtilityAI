'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  rating?: number
  className?: string
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  rating = 5,
  className = '',
}: TestimonialCardProps) {
  return (
    <motion.div
      className={cn(
        'relative p-6 md:p-8 rounded-2xl',
        'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
        'border border-white/[0.08]',
        'backdrop-blur-sm',
        'hover:border-amber-500/30 transition-colors duration-300',
        className
      )}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Rating stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-amber-500 text-amber-500"
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
          {avatar ? (
            <Image src={avatar} alt={author} width={40} height={40} className="w-full h-full rounded-full object-cover" />
          ) : (
            author.split(' ').map(n => n[0]).join('')
          )}
        </div>
        <div>
          <div className="font-medium text-white text-sm">{author}</div>
          <div className="text-white/50 text-xs">
            {role} at {company}
          </div>
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-2xl pointer-events-none" />
    </motion.div>
  )
}
