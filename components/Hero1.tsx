import React from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

export default function Hero1() {
  return (
    <section className="w-full relative overflow-hidden">
      {/* Background with grid pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Hero Content */}
      <div className="container px-4 md:px-6 relative max-w-5xl mx-auto py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-6 text-center"
        >
          <Badge
            className="rounded-full px-4 py-1.5 text-sm font-medium bg-secondary text-white border-secondary/20"
            variant="outline"
          >
            AI-Powered Career Assistant
          </Badge>

          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight text-balance">
            Land Your Dream Job with{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI-Powered Resume Optimization
            </span>
          </h1>

          <p className="max-w-2xl text-muted-foreground md:text-lg lg:text-xl text-pretty leading-relaxed">
            Upload your resume, paste a job description, and let AI optimize your CV, close your skill gaps, and
            craft a growth path tailored for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/dashboard" className="gradient-button inline-flex items-center gap-2 text-white text-lg font-medium">
              Get Started Free
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-transparent">
              See Demo
              <Eye className="ml-2 size-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-muted-foreground mt-6">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-secondary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-4 text-secondary" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-4 text-secondary" />
              <span>Instant results</span>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Preview Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 md:mt-20"
        >
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl blur-2xl"></div>
            <img
              src="/hero.png"
              className="relative w-full rounded-xl border border-border/50 shadow-2xl"
              alt="NexCV Coach Dashboard"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
