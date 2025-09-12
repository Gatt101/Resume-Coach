"use client"
import HeroScrollDemo from "@/components/container-scroll-animation-demo"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NavbarDemo } from "@/components/ui/MarketingNavbar"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Menu,
  Moon,
  Shield,
  Sun,
  Target,
  TrendingUp,
  Upload,
  X
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const sidebarItems = [
    { label: "Features", href: "#features", icon: FileText, active: false },
    { label: "Demo", href: "#demo", icon: Upload, active: false },
    { label: "Pricing", href: "#pricing", icon: BarChart3, active: false },
    { label: "FAQ", href: "#faq", icon: Eye, active: false },
    { label: "Log in", href: "#", icon: Moon, active: false },
  ]

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const features = [
    {
      title: "Resume Optimizer",
      description: "Tailored bullets, ATS-friendly summaries that get you noticed by recruiters.",
      icon: <FileText className="size-5" />,
    },
    {
      title: "Skill Gap Analysis",
      description: "Clear gaps mapped to job description requirements with actionable insights.",
      icon: <Target className="size-5" />,
    },
    {
      title: "Personalized Learning Path",
      description: "6-week upskilling plan with modules tailored to your career goals.",
      icon: <BookOpen className="size-5" />,
    },
    {
      title: "Impact Tracking",
      description: "Metrics on time saved, JD-match improvement, and callback rates.",
      icon: <TrendingUp className="size-5" />,
    },
    {
      title: "AI-Powered Insights",
      description: "Advanced AI analyzes thousands of successful resumes to optimize yours.",
      icon: <Brain className="size-5" />,
    },
    {
      title: "Privacy & Security",
      description: "Your data stays yours. Secure, transparent, and GDPR compliant.",
      icon: <Shield className="size-5" />,
    },
  ]

  return (
    <div className="flex min-h-[100dvh]">
      <div className="fixed inset-x-0 top-0 z-40">
        <NavbarDemo />
      </div>
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-sidebar-background transition-transform ${
          sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {sidebarCollapsed ? <Menu className="size-5" /> : <X className="size-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          {!sidebarCollapsed && <span className="font-sans font-bold text-sidebar-foreground">NexCV Coach</span>}
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    item.active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  size={sidebarCollapsed ? "icon" : "default"}
                >
                  <item.icon className="size-4" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 pt-20">
        <header
          className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"} hidden`}
        >
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
                <Brain className="size-4" />
              </div>
              <span className="text-xl font-sans">NexCV Coach</span>
            </div>
            <nav className="hidden md:flex gap-8">
              <Link
                href="#features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="#demo"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Demo
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                FAQ
              </Link>
            </nav>
            <div className="hidden md:flex gap-4 items-center">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Button className="rounded-full bg-secondary text-white hover:bg-secondary/90">
                Get Started Free
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b"
            >
              <div className="container py-4 flex flex-col gap-4">
                <Link href="#features" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Link>
                <Link href="#demo" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Demo
                </Link>
                <Link href="#pricing" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <Link href="#faq" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </Link>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Link href="#" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Log in
                  </Link>
                  <Button className="rounded-full bg-secondary text-white hover:bg-secondary/90">
                    Get Started Free
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </header>
        <main className="flex-1">
          {/* Hero Section with Scroll Animation */}
          <section className="w-full relative overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:6rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <HeroScrollDemo />

            {/* CTA Section */}
            <div className="container px-4 md:px-6 relative max-w-5xl mx-auto pb-16 -mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-6 text-center"
              >
                <Badge
                  className="rounded-full px-4 py-1.5 text-sm font-medium bg-secondary text-white border-secondary/20"
                  variant="outline"
                >
                  AI-Powered Career Assistant
                </Badge>

                <p className="max-w-2xl text-muted-foreground md:text-lg lg:text-xl text-pretty leading-relaxed">
                  Upload your resume, paste a job description, and let AI optimize your CV, close your skill gaps, and
                  craft a growth path tailored for you.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button
                    size="lg"
                    className="rounded-full h-12 px-8 text-base bg-secondary text-white hover:bg-secondary/90"
                    onClick={
                      () =>{router.push("/dashboard")}
                    }
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-transparent">
                    See Demo
                    <Eye className="ml-2 size-4" />
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-muted-foreground mt-6">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-secondary" />
                    <span>No credit card</span>
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
            </div>
          </section>

          {/* How It Works Section */}
          <section className="w-full py-16 md:py-20 lg:py-24 bg-muted/30 relative overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

            <div className="container px-4 md:px-6 relative max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  How It Works
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  Simple Process, Powerful Results
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  Get your optimized resume and personalized career plan in just three simple steps.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>

                {[
                  {
                    step: "01",
                    title: "Upload Resume",
                    description:
                      "Upload your current resume in PDF or Word format. Our AI will analyze your experience and skills.",
                    icon: <Upload className="size-6" />,
                  },
                  {
                    step: "02",
                    title: "Paste Job Description",
                    description:
                      "Add the job description you're targeting. We'll identify gaps and optimization opportunities.",
                    icon: <FileText className="size-6" />,
                  },
                  {
                    step: "03",
                    title: "Get Optimized Resume + Plan",
                    description:
                      "Receive your ATS-optimized resume and personalized 6-week learning path to close skill gaps.",
                    icon: <Target className="size-6" />,
                  },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative z-10 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground shadow-lg">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground text-pretty">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="w-full py-16 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  Features
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  Everything You Need to Land Your Dream Job
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  Our AI-powered platform provides comprehensive tools to optimize your resume, identify skill gaps, and
                  accelerate your career growth.
                </p>
              </motion.div>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {features.map((feature, i) => (
                  <motion.div key={i} variants={item}>
                    <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md hover:border-secondary/20">
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="size-10 rounded-full bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary mb-4">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-pretty">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Demo Preview Section */}
          <section id="demo" className="w-full py-16 md:py-20 lg:py-24 bg-muted/30 relative overflow-hidden">
            <div className="container px-4 md:px-6 relative max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  Demo Preview
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  See the Transformation
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  Watch how our AI transforms generic resume content into compelling, results-driven achievements.
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-2 gap-8 mb-12">
                <Card className="p-6 bg-gradient-to-b from-background to-muted/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="size-5 text-secondary" />
                    JD-Match Score Growth
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Before Optimization</span>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-muted-foreground h-2 rounded-full" style={{ width: "42%" }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">After Optimization</span>
                      <span className="text-sm font-medium text-secondary">89%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{ width: "89%" }}></div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-b from-background to-muted/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="size-5 text-secondary" />
                    Callback Rate Improvement
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-secondary">3.2x</div>
                      <div className="text-sm text-muted-foreground">Average increase in interview callbacks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">67%</div>
                      <div className="text-sm text-muted-foreground">Users land interviews within 2 weeks</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Trust Section */}
          <section className="w-full py-16 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6 max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  Privacy & Ethics
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  Your Data Stays Yours
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  We prioritize your privacy and maintain the highest standards of data security and transparency.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Secure & Private",
                    description: "End-to-end encryption ensures your resume data is always protected.",
                    icon: <Shield className="size-6" />,
                  },
                  {
                    title: "Transparent AI",
                    description: "Clear explanations of how our AI makes optimization recommendations.",
                    icon: <Eye className="size-6" />,
                  },
                  {
                    title: "GDPR Compliant",
                    description: "Full compliance with international data protection regulations.",
                    icon: <Check className="size-6" />,
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card className="h-full text-center p-6 bg-gradient-to-b from-background to-muted/10">
                      <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mx-auto mb-4">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-pretty">{item.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="w-full py-16 md:py-20 lg:py-24 bg-muted/30 relative overflow-hidden">
            <div className="container px-4 md:px-6 relative max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  Pricing
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  Simple, Transparent Pricing
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  Choose the plan that fits your career goals. Start free and upgrade as you grow.
                </p>
              </motion.div>

              <div className="mx-auto max-w-4xl">
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                  {[
                    {
                      name: "Free",
                      price: "$0",
                      description: "Perfect for getting started with AI resume optimization.",
                      features: [
                        "1 resume optimization per month",
                        "Basic ATS scoring",
                        "Standard templates",
                        "Email support",
                      ],
                      cta: "Get Started Free",
                    },
                    {
                      name: "Plus",
                      price: "$5",
                      description: "Ideal for active job seekers and career changers.",
                      features: [
                        "Unlimited resume optimizations",
                        "Advanced skill gap analysis",
                        "Personalized learning paths",
                        "AI Chat Agent"
                      ],
                      cta: "Start Plus Trial",
                      popular: true,
                    },
                    {
                      name: "Pro",
                      price: "$20",
                      description: "For career coaches and HR professionals.",
                      features: [
                        "Everything in Plus",
                        "Unlimited AI Agent Usage",
                        "Resume versioning",
                        "Dedicated account manager",
                      ],
                      cta: "Contact Sales",
                    },
                  ].map((plan, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <Card
                        className={`relative overflow-hidden h-full ${plan.popular ? "border-secondary shadow-lg scale-105" : "border-border/40 shadow-md"} bg-gradient-to-b from-background to-muted/10 backdrop-blur`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                            Most Popular
                          </div>
                        )}
                        <CardContent className="p-6 flex flex-col h-full">
                          <h3 className="text-2xl font-bold">{plan.name}</h3>
                          <div className="flex items-baseline mt-4">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground ml-1">/month</span>
                          </div>
                          <p className="text-muted-foreground mt-2 text-pretty">{plan.description}</p>
                          <ul className="space-y-3 my-6 flex-grow">
                            {plan.features.map((feature, j) => (
                              <li key={j} className="flex items-center">
                                <Check className="mr-2 size-4 text-secondary" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            className={`w-full mt-auto rounded-full ${plan.popular ? "bg-secondary hover:bg-secondary/90" : ""}`}
                            variant={plan.popular ? "default" : "outline"}
                          >
                            {plan.cta}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="w-full py-16 md:py-20 lg:py-24">
            <div className="container px-4 md:px-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
              >
                <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                  FAQ
                </Badge>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-balance">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-2xl text-muted-foreground md:text-lg text-pretty">
                  Find answers to common questions about our AI resume optimization platform.
                </p>
              </motion.div>

              <div className="mx-auto max-w-3xl">
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      question: "How does the AI resume optimization work?",
                      answer:
                        "Our AI analyzes your resume against the job description you provide, identifying gaps in keywords, skills, and experience. It then suggests specific improvements to increase your ATS compatibility and match score, while maintaining authenticity to your actual experience.",
                    },
                    {
                      question: "Is my resume data secure and private?",
                      answer:
                        "Absolutely. We use end-to-end encryption and never share your personal data with third parties. Your resume content is processed securely and you can delete your data at any time. We're fully GDPR compliant and prioritize your privacy.",
                    },
                    {
                      question: "What file formats do you support?",
                      answer:
                        "We support PDF, Word (.docx), and plain text formats for resume uploads. For best results, we recommend uploading a well-formatted PDF or Word document with clear section headers.",
                    },
                    {
                      question: "How accurate is the skill gap analysis?",
                      answer:
                        "Our AI has been trained on thousands of successful resumes and job descriptions across various industries. The skill gap analysis typically achieves 85-90% accuracy in identifying relevant missing skills and suggesting improvements.",
                    },
                    {
                      question: "Can I use this for different industries?",
                      answer:
                        "Yes! Our AI is trained across multiple industries including tech, finance, healthcare, marketing, and more. It adapts its recommendations based on the specific job description and industry context you provide.",
                    },
                    {
                      question: "What's included in the learning path?",
                      answer:
                        "The personalized learning path includes curated courses, certifications, and resources to help you develop the skills identified in your gap analysis. It's structured as a 6-week program with weekly milestones and progress tracking.",
                    },
                  ].map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <AccordionItem value={`item-${i}`} className="border-b border-border/40 py-2">
                        <AccordionTrigger className="text-left font-medium hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-pretty">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="w-full py-16 md:py-20 lg:py-24 bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="container px-4 md:px-6 relative max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-6 text-center"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-sans font-bold tracking-tight text-balance">
                  Ready to Land Your Dream Job?
                </h2>
                <p className="mx-auto max-w-2xl text-secondary-foreground/80 md:text-xl text-pretty">
                  Join thousands of professionals who have transformed their careers with AI-powered resume optimization
                  and personalized learning paths.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full h-11 md:h-12 px-6 md:px-8 text-sm md:text-base bg-white text-secondary hover:bg-white/90"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full h-11 md:h-12 px-6 md:px-8 text-sm md:text-base bg-transparent border-white text-white hover:bg-white/10"
                  >
                    See Demo
                  </Button>
                </div>
                <p className="text-sm text-secondary-foreground/80 mt-4">
                  No credit card required. Start optimizing your resume in minutes.
                </p>
              </motion.div>
            </div>
          </section>
        </main>
        <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
          <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16 max-w-6xl mx-auto">
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
                    <Brain className="size-4" />
                  </div>
                  <span className="font-sans">NexCV Coach</span>
                </div>
                <p className="text-sm text-muted-foreground text-pretty">
                  AI-powered resume optimization and career coaching to help you land your dream job faster.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
                      Demo
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Docs
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Career Guide
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Support
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} NexCV Coach. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
