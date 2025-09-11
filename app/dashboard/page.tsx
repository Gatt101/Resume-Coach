"use client"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { useUser } from '@clerk/nextjs'
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
import { UserButton, UserProfile } from '@clerk/nextjs'


const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Builder", href: "/dashboard/builder" },
  { icon: FileText, label: "Tailor", href: "/dashboard/tailor" },
  { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
  { icon: Target, label: "Analysis", href: "/dashboard/analysis" },
  { icon: BookOpen, label: "Path", href: "/dashboard/learning" },
  { icon: Brain, label: "Chat", href: `/dashboard/chat` },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

const quickActions = [
  {
    title: "Upload Resume",
    description: "Add a new resume for optimization",
    icon: Upload,
    action: "upload",
    color: "bg-secondary",
    href: "/dashboard/resumes"
  },
  {
    title: "Paste Job Description",
    description: "Add a target job for analysis",
    icon: PlusCircle,
    action: "paste-jd",
    color: "bg-primary",
    href: "/dashboard/resumes"
  },
  {
    title: "Generate Optimized Resume",
    description: "Create your tailored resume",
    icon: Zap,
    action: "optimize",
    color: "bg-accent",
    href: "/dashboard/resumes"
  },
]

const recentResumes = [
  {
    name: "Software Engineer Resume",
    jdMatch: 89,
    lastUpdated: "2 hours ago",
    status: "optimized",
  },
  {
    name: "Product Manager Resume",
    jdMatch: 76,
    lastUpdated: "1 day ago",
    status: "pending",
  },
  {
    name: "Data Scientist Resume",
    jdMatch: 92,
    lastUpdated: "3 days ago",
    status: "optimized",
  },
]

const skillGaps = [
  { skill: "React", severity: 3, status: "critical" },
  { skill: "AWS", severity: 2, status: "important" },
  { skill: "TypeScript", severity: 2, status: "important" },
  { skill: "Docker", severity: 1, status: "nice-to-have" },
]

const learningModules = [
  { week: 1, title: "React Fundamentals", completed: true },
  { week: 2, title: "Advanced React Patterns", completed: true },
  { week: 3, title: "AWS Basics", completed: false, current: true },
  { week: 4, title: "TypeScript Deep Dive", completed: false },
  { week: 5, title: "Docker & Containerization", completed: false },
  { week: 6, title: "System Design Principles", completed: false },
]

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-64"
          } bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
              <Target className="size-4" />
            </div>
            {!sidebarCollapsed && <span className="font-sans font-bold text-sidebar-foreground">AI Resume Coach</span>}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.label}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start transition-colors ${isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      } ${sidebarCollapsed ? "px-2" : ""}`}
                    size={sidebarCollapsed ? "icon" : "default"}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="size-4" />
                    {!sidebarCollapsed && <span className="ml-2">{item.label}</span>}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            {!sidebarCollapsed && (
              <div className=" flex items-center gap-3">
                <UserButton />
                <p className="text-sm text-sidebar-foreground">{user?.firstName}</p>
              </div>

            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">Welcome back, {user?.firstName || 'User'}!</h1>
              <p className="text-muted-foreground">Let's optimize your career journey today.</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:hidden"
            >
              <LayoutDashboard className="size-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action, i) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:border-secondary/20"
                  >
                    <CardContent className="p-6" onClick={() => router.push(action.href)}>
                      <div className="flex items-start gap-4">
                        <div
                          className={`size-12 rounded-lg ${action.color} flex items-center justify-center text-white`}
                        >
                          <action.icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Progress Tracker */}
          <section>
            <h2 className="text-xl font-bold mb-4">Progress Tracker</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative size-20 mx-auto mb-4">
                    <svg className="size-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-secondary stroke-current"
                        strokeWidth="3"
                        strokeDasharray="85, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">85%</span>
                    </div>
                  </div>
                  <h3 className="font-bold">Resume Tailored</h3>
                  <p className="text-sm text-muted-foreground">ATS optimization complete</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative size-20 mx-auto mb-4">
                    <svg className="size-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary stroke-current"
                        strokeWidth="3"
                        strokeDasharray="60, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">60%</span>
                    </div>
                  </div>
                  <h3 className="font-bold">Gap Closure</h3>
                  <p className="text-sm text-muted-foreground">Skills development progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative size-20 mx-auto mb-4">
                    <svg className="size-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-accent stroke-current"
                        strokeWidth="3"
                        strokeDasharray="40, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">40%</span>
                    </div>
                  </div>
                  <h3 className="font-bold">Learning Path</h3>
                  <p className="text-sm text-muted-foreground">Course completion rate</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Main Dashboard Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resumes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  My Resumes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResumes.map((resume, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{resume.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">JD Match: {resume.jdMatch}%</span>
                          <span className="text-sm text-muted-foreground">{resume.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={resume.status === "optimized" ? "default" : "secondary"}>{resume.status}</Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/resumes')}
                  >
                    View All Resumes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gap Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-5" />
                  Skill Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skillGaps.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-3 rounded-full ${gap.status === "critical"
                            ? "bg-destructive"
                            : gap.status === "important"
                              ? "bg-yellow-500"
                              : "bg-muted-foreground"
                            }`}
                        />
                        <span className="font-medium">{gap.skill}</span>
                        <div className="flex">
                          {Array(gap.severity)
                            .fill(0)
                            .map((_, j) => (
                              <Star key={j} className="size-3 text-yellow-500 fill-yellow-500" />
                            ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Add to Path
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/gaps')}
                  >
                    View Full Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Learning Path Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5" />
                  Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningModules.slice(0, 4).map((module, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${module.completed
                          ? "bg-secondary text-secondary-foreground"
                          : module.current
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {module.completed ? <CheckCircle2 className="size-4" /> : module.week}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${module.current ? "text-primary" : ""}`}>{module.title}</h4>
                        <p className="text-sm text-muted-foreground">Week {module.week}</p>
                      </div>
                      {module.current && <Badge>Current</Badge>}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/learning')}
                  >
                    View Full Path
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5" />
                  Analytics Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">3.2x</div>
                      <div className="text-sm text-muted-foreground">Callback Rate</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">89%</div>
                      <div className="text-sm text-muted-foreground">JD Match Score</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Profile Strength</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => router.push('/dashboard/analytics')}
                  >
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="size-5" />
                Export & Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
