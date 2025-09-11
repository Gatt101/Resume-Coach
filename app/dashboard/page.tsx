"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useUser, UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  BookOpen,
  BarChart3,
  Settings,
  Upload,
  PlusCircle,
  Zap,
  Download,
  Share2,
  CheckCircle2,
  Star,
  Brain,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

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
  // SVG ring with stroke-dasharray based on value
  const dash = `${Math.min(Math.max(value, 0), 100)}, 100`
  return (
    <div className="relative size-20">
      <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
        <path className="text-muted/40 stroke-current" strokeWidth="3" fill="none"
          d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0-31.831" />
        <path className={`${colorClass} stroke-current`} strokeWidth="3" strokeDasharray={dash} strokeLinecap="round" fill="none"
          d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0-31.831" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-semibold">{value}%</span>
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-2 text-sm text-muted-foreground ring-1 ring-white/10 backdrop-blur">
      <span className="text-foreground font-semibold">{value}</span> {label}
    </div>
  )
}

/** ---------- main page ---------- */
export default function DashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [railOpen, setRailOpen] = useState(false)

  const progress = useMemo(
    () => ({
      resume: 85,
      gap: 60,
      learning: 40,
    }),
    []
  )

  return (
    <div className="relative flex h-dvh overflow-hidden bg-gradient-to-b from-background via-background to-background">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-[420px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Sidebar rail (hover to expand) */}
      <aside
        onMouseEnter={() => setRailOpen(true)}
        onMouseLeave={() => setRailOpen(false)}
        className={`group sticky left-0 top-0 z-20 flex h-dvh flex-col border-r bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10 transition-[width] duration-300 ${railOpen ? "w-60" : "w-16"}`}
      >
        <div className="flex items-center gap-2 border-b px-3 py-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 text-primary-foreground grid place-items-center">
            <Target className="size-4" />
          </div>
          <span className={`font-semibold text-sm text-foreground transition-opacity ${railOpen ? "opacity-100" : "opacity-0"}`}>
            AI Resume Coach
          </span>
        </div>

        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/5"} ${railOpen ? "px-3" : "px-2"} `}
                    size={railOpen ? "default" : "icon"}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="size-4" />
                    {railOpen && <span className="ml-2">{item.label}</span>}
                  </Button>
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8">
          {/* HERO */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b0b12] via-[#0b0b12] to-[#121223] p-6 md:p-8"
          >
            <div className="absolute -top-24 -right-20 size-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Welcome back, {user?.firstName ?? "Gaurav"}!
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Let’s optimize your career journey today. Your dashboard highlights progress, gaps, and next actions.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatChip label="JD Match" value="89%" />
                  <StatChip label="Skill gaps tracked" value="4" />
                  <StatChip label="Resumes" value="3" />
                </div>
              </div>

              {/* compact rings */}
              <div className="grid grid-cols-3 items-center gap-4 md:justify-items-center">
                <div className="text-center">
                  <Ring value={progress.resume} colorClass="text-green-500" />
                  <p className="mt-1 text-xs text-muted-foreground">Resume Tailored</p>
                </div>
                <div className="text-center">
                  <Ring value={progress.gap} colorClass="text-primary" />
                  <p className="mt-1 text-xs text-muted-foreground">Gap Closure</p>
                </div>
                <div className="text-center">
                  <Ring value={progress.learning} colorClass="text-amber-400" />
                  <p className="mt-1 text-xs text-muted-foreground">Learning Path</p>
                </div>
              </div>
            </div>

            {/* progress journey */}
            <div className="relative z-10 mt-6 rounded-xl border bg-black/20 p-4">
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
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((qa, i) => (
                <motion.div
                  key={qa.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                >
                  <Card
                    onClick={() => router.push(qa.href)}
                    className="group cursor-pointer overflow-hidden border bg-card/70 backdrop-blur transition-all hover:shadow-lg"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="grid size-11 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 transition group-hover:scale-105">
                          <qa.icon className="size-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold leading-tight">{qa.title}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{qa.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* MAIN GRID */}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {/* My Resumes */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  My Resumes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentResumes.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border bg-white/5 p-3">
                    <div className="min-w-0">
                      <h4 className="truncate font-medium">{r.name}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>JD Match: <span className="font-semibold text-foreground">{r.jdMatch}%</span></span>
                        <span>Updated: {r.lastUpdated}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.status === "optimized" ? "default" : "secondary"} className="capitalize">
                        {r.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/tailor")}>
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/dashboard/resumes")}>
                  View All Resumes
                </Button>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5" />
                  Skill Gaps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillGaps.map((g, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-block size-2 rounded-full ${
                          g.status === "critical" ? "bg-red-500" : g.status === "important" ? "bg-yellow-500" : "bg-muted-foreground"
                        }`}
                      />
                      <span className="font-medium">{g.skill}</span>
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
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/dashboard/gaps")}>
                  View Full Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Learning Path */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5" />
                  Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningModules.slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border bg-white/5 p-3">
                    <div
                      className={`grid size-8 place-items-center rounded-full text-xs font-semibold ${
                        m.completed ? "bg-green-500/15 text-green-500 ring-1 ring-green-500/30"
                          : m.current ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.completed ? <CheckCircle2 className="size-4" /> : m.week}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${m.current ? "text-primary" : ""}`}>{m.title}</h4>
                      <p className="text-xs text-muted-foreground">Week {m.week}</p>
                    </div>
                    {m.current && <Badge>Current</Badge>}
                  </div>
                ))}
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/dashboard/learning")}>
                  View Full Path
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">3.2x</div>
                    <div className="text-xs text-muted-foreground">Callback Rate</div>
                  </div>
                  <div className="rounded-xl border bg-white/5 p-4 text-center">
                    <div className="text-2xl font-bold text-primary">89%</div>
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
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/dashboard/analytics")}>
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Export */}
          <Card className="mt-8 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5" />
                Export & Share
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="flex items-center gap-2">
                <Download className="size-4" />
                Download Resume (PDF)
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="size-4" />
                Download Resume (DOCX)
              </Button>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Share2 className="size-4" />
                Share Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
