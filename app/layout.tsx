import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next"
import type React from "react"

export const metadata: Metadata = {
  title: "NexCV Coach - Smarter Resumes. Stronger Careers.",
  description:
    "Upload your resume, paste a job description, and let AI optimize your CV, close your skill gaps, and craft a growth path tailored for you.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
