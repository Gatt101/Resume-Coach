'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NavigationCreditBalance } from './navigation-credit-balance';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Briefcase,
  Target,
  BookOpen,
  Brain,
  Menu,
  X,
  CreditCard,
  Crown,
  ArrowLeft
} from 'lucide-react';

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Settings, label: "Builder", href: "/dashboard/builder" },
  { icon: FileText, label: "Tailor", href: "/dashboard/tailor" },
  { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
  { icon: Target, label: "Analysis", href: "/dashboard/analysis" },
  { icon: BookOpen, label: "Path", href: "/dashboard/learning" },
  { icon: Brain, label: "Chat", href: "/dashboard/chat" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface DashboardNavigationProps {
  children: React.ReactNode;
}

export function DashboardNavigation({ children }: DashboardNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [railOpen, setRailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUpgradeClick = () => {
    router.push('/dashboard/subscription');
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="relative flex h-dvh overflow-x-hidden bg-gradient-to-b from-background via-background to-background">
      {/* Top-left back button */}
      <div className="fixed top-4 z-30 sm:left-16 left-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="rounded-full bg-black/10 backdrop-blur hover:bg-black/20"
        >
          <ArrowLeft className="size-4" />
        </Button>
      </div>

      {/* Top-right credit balance - visible on all screen sizes */}
      <div className="fixed top-4 right-4 z-30">
        <div className="flex items-center gap-3">
          <NavigationCreditBalance 
            compact 
            onUpgradeClick={handleUpgradeClick}
            className="bg-white/10 backdrop-blur rounded-lg px-3 py-2"
          />
          <div className="sm:hidden">
            <UserButton />
          </div>
        </div>
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
              const isActive = pathname === item.href;
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
              );
            })}
          </ul>
        </nav>

        {/* Subscription management section */}
        <div className="border-t border-white/10 p-2">
          <div className="space-y-1">
            {railOpen ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-lg text-muted-foreground hover:bg-white/5 hover:ring-1 hover:ring-white/10"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  <Crown className="size-4 mr-2" />
                  <span>Subscription</span>
                </Button>
                <NavigationCreditBalance 
                  onUpgradeClick={handleUpgradeClick}
                  className="px-2 py-1"
                />
              </>
            ) : (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:ring-1 hover:ring-white/10"
                      onClick={() => router.push('/dashboard/subscription')}
                      aria-label="Subscription"
                    >
                      <Crown className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-foreground">
                    Subscription
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

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

            {/* Mobile credit balance */}
            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <NavigationCreditBalance onUpgradeClick={handleUpgradeClick} />
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
                
                {/* Mobile subscription link */}
                <li className="border-t border-white/10 pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-lg px-3 py-2 text-sm"
                    onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/subscription') }}
                  >
                    <Crown className="size-5 mr-3" />
                    <span>Subscription</span>
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          {/* Mobile header */}
          <div className="sm:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="size-5" />
              </Button>
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}