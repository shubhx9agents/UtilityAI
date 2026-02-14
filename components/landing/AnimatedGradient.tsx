'use client'

import { useEffect, useRef } from 'react'

export function AnimatedGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const animate = () => {
      time += 0.002

      // Create gradient
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3 + Math.sin(time) * 100,
        canvas.height * 0.3 + Math.cos(time * 0.7) * 100,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      )

      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.15)')
      gradient.addColorStop(0.3, 'rgba(249, 115, 22, 0.08)')
      gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.05)')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = 'hsl(224, 71%, 4%)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Second gradient for depth
      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.7 + Math.cos(time * 0.5) * 150,
        canvas.height * 0.6 + Math.sin(time * 0.8) * 100,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.6
      )

      gradient2.addColorStop(0, 'rgba(6, 182, 212, 0.08)')
      gradient2.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)')
      gradient2.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: 'hsl(224, 71%, 4%)' }}
    />
  )
}
