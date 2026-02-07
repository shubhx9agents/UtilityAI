'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center">
                {/* Animated Background Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute h-32 w-32 rounded-full bg-amber-500/20 blur-2xl"
                />

                {/* Icon Container */}
                <motion.div
                    className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            rotate: {
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                    >
                        <Sparkles className="h-8 w-8 text-amber-500" />
                    </motion.div>
                </motion.div>

                {/* Loading Text */}
                <div className="mt-8 flex space-x-1">
                    {['L', 'o', 'a', 'd', 'i', 'n', 'g', '.', '.', '.'].map((char, index) => (
                        <motion.span
                            key={index}
                            className="font-heading text-lg font-medium text-zinc-400"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.4,
                                delay: index * 0.1,
                                repeat: Infinity,
                                repeatDelay: 2,
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </div>
            </div>
        </div>
    )
}
