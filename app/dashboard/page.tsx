"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UserButton, useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Share2,
  Star,
  Target,
  Upload,
  Zap,
  Menu,
  X,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// Sidebar items remain unchanged
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Builder", href: "/dashboard/builder" },
  { icon: FileText, label: "Tailor", href: "/dashboard/tailor" },
  { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
  { icon: Target, label: "Analysis", href: "/dashboard/analysis" },
  { icon: BookOpen, label: "Path", href: "/dashboard/learning" },
  { icon: Brain, label: "Chat", href: "/dashboard/chat" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

// Quick actions remain unchanged
const quickActions = [
  {
    title: "Optimize Resume",
    description: "Add a new resume for optimization",
    icon: Upload,
    href: "/dashboard/tailor",
  },
  {
    title: "Create Resume",
    description: "Build a resume from scratch",
    icon: PlusCircle,
    href: "/dashboard/builder",
  },
  {
    title: "Check ATS Score",
    description: "Analyze your resume for ATS compatibility",
    icon: BarChart3,
    href: "/dashboard/analysis",
  },
  {
    title: "AI Assistant",
    description: "Get career advice and tips",
    icon: Zap,
    href: "/dashboard/chat",
  },
]

// Sample data remains unchanged
const recentResumes = [
  { name: "Software Engineer Resume", jdMatch: 89, lastUpdated: "2 hours ago", status: "optimized" as const },
  { name: "Product Manager Resume", jdMatch: 76, lastUpdated: "1 day ago", status: "pending" as const },
  { name: "Data Scientist Resume", jdMatch: 92, lastUpdated: "3 days ago", status: "optimized" as const },
]

const skillGaps = [
  { skill: "React", severity: 3, status: "critical" as const },
  { skill: "AWS", severity: 2, status: "important" as const },
  { skill: "TypeScript", severity: 2, status: "important" as const },
  { skill: "Docker", severity: 1, status: "nice-to-have" as const },
]

const learningModules = [
  { week: 1, title: "React Fundamentals", completed: true },
  { week: 2, title: "Advanced React Patterns", completed: true },
  { week: 3, title: "AWS Basics", completed: false, current: true },
  { week: 4, title: "TypeScript Deep Dive", completed: false },
  { week: 5, title: "Docker & Containerization", completed: false },
  { week: 6, title: "System Design Principles", completed: false },
]

/** ---------- tiny helpers ---------- */
function Ring({ value = 80, colorClass = "text-primary" }: { value?: number; colorClass?: string }) {
  const dash = `${Math.min(Math.max(value, 0), 100)}, 100`
  return (
    <div className="relative size-16 sm:size-20"> {/* Reduced size on mobile */}
      <svg className="size-16 sm:size-20 -rotate-90" viewBox="0 0 36 36">
        <path className="text-muted/40 stroke-current" strokeWidth="3" fill="none"
          d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0-31.831" />
        <path className={`${colorClass} stroke-current`} strokeWidth="3" strokeDasharray={dash} strokeLinecap="round" fill="none"
          d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0-31.831" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-base sm:text-lg font-semibold">{value}%</span>
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-1.5 text-xs sm:text-sm text-muted-foreground ring-1 ring-white/10 backdrop-blur">
      <span className="text-foreground font-semibold">{value}</span> {label}
    </div>
  )
}

/** ---------- main page ---------- */
export default function DashboardPage() {
  const getResumes = async () => {
    const resumes = await fetch('/api/user/resume/save', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return resumes.json()
  }

  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [railOpen, setRailOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userResumes, setUserResumes] = useState<any[]>([])
  const [resumesLoading, setResumesLoading] = useState(false)
  const [guidedPath, setGuidedPath] = useState<any[] | null>(null)
  const [guidedLoading, setGuidedLoading] = useState(false)

  const progress = useMemo(
    () => ({
      resume: 85,
      gap: 60,
      learning: 40,
    }),
    []
  )

  // Fetch user resumes on mount
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setResumesLoading(true)
        const res = await fetch('/api/user/resume')
        if (res.status === 401) {
          if (mounted) setUserResumes([])
          return
        }
        if (!res.ok) throw new Error(`Failed to fetch resumes (${res.status})`)
        const data = await res.json()
        if (mounted && data?.resumes) setUserResumes(data.resumes)
      } catch (err) {
        console.error('Could not load resumes', err)
      } finally {
        if (mounted) setResumesLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Fetch guided path when resumes load
  useEffect(() => {
    if (!userResumes || userResumes.length === 0) return
    let mounted = true
    async function loadGuided() {
      try {
        setGuidedLoading(true)
        const first = userResumes[0]
        const firstId = (first && (first._id || first.id))
        if (!firstId) return
        const res = await fetch(`/api/resume/guided?resumeId=${firstId}&max=8`)
        if (!res.ok) {
          console.warn('Guided path request failed', res.status)
          return
        }
        const data = await res.json()
        if (mounted && data?.guidedPath) setGuidedPath(data.guidedPath)
      } catch (err) {
        console.error('Could not load guided path', err)
      } finally {
        if (mounted) setGuidedLoading(false)
      }
    }
    loadGuided()
    return () => { mounted = false }
  }, [userResumes])

  return (
    <div className="relative flex h-dvh overflow-x-hidden bg-gradient-to-b from-background via-background to-background">
      {/* Top-left back button, adjusted for mobile */}
      <div className="fixed top-4 z-30 sm:left-16 left-4">
       
      </div>

      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-64 sm:size-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-64 sm:size-[420px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Sidebar rail (hover to expand, hidden on mobile) */}
      <aside
        onMouseEnter={() => setRailOpen(true)}
        onMouseLeave={() => setRailOpen(false)}
        style={{ willChange: 'width' }}
        className={`group sticky left-0 top-0 z-20 hidden sm:flex flex-col border-r border-white/10 bg-black/25 backdrop-blur supports-[backdrop-filter]:bg-black/10 transition-[width] duration-300 ease-in-out ${railOpen ? "w-60" : "w-16"}`}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-primary-foreground grid place-items-center shadow-sm">
            <Target className="size-4" />
          </div>
          <span className={`font-semibold text-sm text-foreground transition-all duration-300 ease-in-out transform ${railOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
            NexCV Coach
          </span>
        </div>

        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label} className="relative">
                  {railOpen ? (
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`group relative w-full justify-start rounded-lg transition-all duration-200 ease-in-out ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:ring-1 hover:ring-white/10"} ${railOpen ? "px-3" : "px-2"}`}
                      size={railOpen ? "default" : "icon"}
                      onClick={() => router.push(item.href)}
                    >
                      <span aria-hidden className={`absolute left-0 top-0 h-full w-1 rounded-r transition-colors ${isActive ? "bg-white/90" : "bg-transparent group-hover:bg-white/20"}`} />
                      <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
                        <item.icon className="size-4" />
                      </motion.span>
                      {railOpen && <span className="ml-2">{item.label}</span>}
                    </Button>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className={`group relative w-full justify-center rounded-lg transition-all duration-200 ease-in-out ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5 hover:ring-1 hover:ring-white/10"} px-2`}
                            size="icon"
                            onClick={() => router.push(item.href)}
                            aria-label={item.label}
                          >
                            <span aria-hidden className={`absolute left-0 top-0 h-full w-1 rounded-r transition-colors ${isActive ? "bg-white/90" : "bg-transparent group-hover:bg-white/20"}`} />
                            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shrink-0">
                              <item.icon className="size-4" />
                            </motion.span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-foreground">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t px-3 py-3">
          <div className={`flex items-center ${railOpen ? "gap-3" : "justify-center"}`}>
            <UserButton />
            {railOpen && <p className="text-sm text-foreground/80">{user?.firstName ?? "User"}</p>}
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-black/20 backdrop-blur p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-primary-foreground grid place-items-center shadow-sm">
                  <Target className="size-4" />
                </div>
                <div className="font-semibold text-sm">NexCV Coach</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav>
              <ul className="space-y-2">
                {sidebarItems.map((item) => (
                  <li key={item.label}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-lg px-3 py-2 text-sm"
                      onClick={() => { setMobileMenuOpen(false); router.push(item.href) }}
                    >
                      <item.icon className="size-5 mr-3" />
                      <span>{item.label}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          {/* Mobile header */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="size-5" />
              </Button>
              <h2 className="text-lg font-semibold">Welcome</h2>
            </div>
            <div>
              <UserButton />
            </div>
          </div>

          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b0b12] via-[#0b0b12] to-[#121223] p-4 sm:p-6"
          >
            <div className="absolute -top-24 -right-20 size-48 sm:size-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-24 size-48 sm:size-72 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 grid gap-4 sm:gap-6 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">
                  Welcome back, {user?.firstName ?? "Gaurav"}!
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Let’s optimize your career journey today.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatChip label="JD Match" value="89%" />
                  <StatChip label="Skill gaps" value="4" />
                  <StatChip label="Resumes" value="3" />
                </div>
              </div>

              {/* Compact rings */}
              <div className="grid grid-cols-3 items-center gap-3 sm:gap-4 sm:justify-items-center">
                <div className="text-center">
                  <Ring value={progress.resume} colorClass="text-green-500" />
                  <p className="mt-1 text-xs text-muted-foreground">Resume</p>
                </div>
                <div className="text-center">
                  <Ring value={progress.gap} colorClass="text-primary" />
                  <p className="mt-1 text-xs text-muted-foreground">Gap</p>
                </div>
                <div className="text-center">
                  <Ring value={progress.learning} colorClass="text-amber-400" />
                  <p className="mt-1 text-xs text-muted-foreground">Learning</p>
                </div>
              </div>
            </div>

            {/* Progress journey */}
            <div className="relative z-10 mt-4 rounded-xl border bg-black/20 p-3 sm:p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Profile Journey</span>
                <span>Keep going!</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 via-primary to-amber-400"
                  style={{ width: `${Math.round((progress.resume + progress.gap + progress.learning) / 3)}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* QUICK ACTIONS */}
          <section className="mt-6 sm:mt-8">
            <h2 className="mb-3 sm:mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {quickActions.map((qa, i) => (
                <Card
                  key={qa.title}
                  onClick={() => router.push(qa.href)}
                  className="group cursor-pointer overflow-hidden border bg-card/70 backdrop-blur transition-all hover:shadow-lg"
                >
                  <CardContent className="p-4 sm:p-6 flex items-center">
                    <div className="flex items-center gap-4 sm:gap-6 w-full">
                      <div className="grid size-12 sm:size-14 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                        <qa.icon className="size-5 sm:size-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold leading-tight">{qa.title}</h3>
                        <p suppressHydrationWarning className="mt-1 text-xs sm:text-sm text-muted-foreground">{qa.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* MAIN GRID */}
          <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 xl:grid-cols-2">
            {/* My Resumes */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5" />
                  My Resumes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resumesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading resumes...</div>
                ) : userResumes.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No resumes yet — create one to get started.</div>
                ) : (
                  userResumes.slice(0, userResumes.length > 4 ? 4 : userResumes.length).map((r, idx) => (
                    <div key={r._id || idx} className="flex items-center justify-between rounded-xl border bg-white/5 p-3">
                      <div className="min-w-0">
                        <h4 className="truncate font-medium text-sm sm:text-base">{r.title || r.data?.name || `Resume ${idx + 1}`}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                          {typeof r.metadata?.generatedAt === 'string' && <span>Created: {new Date(r.createdAt || r.metadata.generatedAt).toLocaleDateString()}</span>}
                          {r.metadata?.targetRole && <span>Target: {r.metadata.targetRole}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === "optimized" ? "default" : "secondary"} className="capitalize text-xs">
                          {r.metadata?.status || (r.metadata?.generatedAt ? 'generated' : 'saved')}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/resumes/${r._id || ''}`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full bg-transparent mt-3" onClick={() => router.push("/dashboard/resumes")}>
                  {userResumes.length > 4 ? "View more" : "View All Resumes"}
                </Button>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="size-5" />
                  Skill Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillGaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border bg-white/5 p-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span
                        className={`inline-block size-2 rounded-full ${g.status === "critical" ? "bg-red-500" : g.status === "important" ? "bg-yellow-500" : "bg-muted-foreground"}`}
                      />
                      <span className="font-medium text-sm sm:text-base">{g.skill}</span>
                      <div className="ml-1 flex">
                        {Array.from({ length: g.severity }).map((_, j) => (
                          <Star key={j} className="size-3 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Add to Path
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent mt-3" onClick={() => router.push("/dashboard/gaps")}>
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Learning Path */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="size-5" />
                  Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(guidedLoading && !guidedPath) ? (
                  <div className="text-sm text-muted-foreground">Loading learning path...</div>
                ) : (
                  (guidedPath ?? learningModules).slice(0, (guidedPath ? (guidedPath.length > 4 ? 3 : guidedPath.length) : 4)).map((m: any, i: number) => (
                    <div key={m.id || i} className="flex items-center gap-2 sm:gap-3 rounded-xl border bg-white/5 p-3">
                      <div className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${m.completed ? "bg-green-500/15 text-green-500 ring-1 ring-green-500/30" : m.current ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-muted text-muted-foreground"}`}>
                        {m.completed ? <CheckCircle2 className="size-4" /> : (m.week || i + 1)}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm sm:text-base ${m.current ? "text-primary" : ""}`}>{m.title}</h4>
                        <p className="text-xs text-muted-foreground">{m.estimatedWeeks ? `~${m.estimatedWeeks} weeks` : (m.description || '')}</p>
                      </div>
                      {m.current && <Badge>Current</Badge>}
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full bg-transparent mt-3" onClick={() => router.push("/dashboard/learning")}>
                  {((guidedPath && guidedPath.length > 4) || (!guidedPath && learningModules.length > 4)) ? "View more" : "View Full Path"}
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="size-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-xl border bg-white/5 p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-400">3.2x</div>
                    <div className="text-xs text-muted-foreground">Callback Rate</div>
                  </div>
                  <div className="rounded-xl border bg-white/5 p-3 sm:p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">89%</div>
                    <div className="text-xs text-muted-foreground">JD Match Score</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span>Profile Strength</span>
                    <span className="font-medium">{progress.resume}%</span>
                  </div>
                  <Progress value={progress.resume} className="h-2" />
                </div>
                <Button variant="outline" className="w-full bg-transparent mt-3" onClick={() => router.push("/dashboard/analytics")}>
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Export */}
          <Card className="mt-6 sm:mt-8 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="size-5" />
                Export & Share
              </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button className="flex items-center gap-2 flex-1 sm:flex-none justify-center">
                  <Download className="size-4" />
                  PDF
                </Button>
                <Button variant="outline" className="flex items-center gap-2 flex-1 sm:flex-none bg-transparent justify-center">
                  <Download className="size-4" />
                  DOCX
                </Button>
                <Button variant="outline" className="flex items-center gap-2 flex-1 sm:flex-none bg-transparent justify-center">
                  <Share2 className="size-4" />
                  Share
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
}