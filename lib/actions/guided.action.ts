import { connect } from '@/lib/mongoose'
import Resume from '@/models/resume'

// Simple mapper from detected gaps to learning modules.
// This is intentionally small and deterministic so you can extend with AI later.
export async function buildGuidedPath(userId: string, resumeId?: string, maxModules = 8) {
  await connect()

  let resume = null
  if (resumeId) resume = await Resume.findOne({ userId, _id: resumeId })

  // derive simple gap list from resume content (mock): if skills missing -> suggest fundamentals
  const modules: any[] = []
  const skillList = resume?.data?.skills || []
  const summary = resume?.data?.summary || ''

  // heuristic suggestions
  if (!skillList || skillList.length === 0) {
    modules.push({ id: 'm-react', title: 'React Fundamentals', description: 'Learn the basics of React and component patterns.', priority: 1, estimatedWeeks: 2, effortHours: 8, resources: [{ title: 'React Official', url: 'https://react.dev', type: 'link' }], confidence: 0.8 })
    modules.push({ id: 'm-typescript', title: 'TypeScript Basics', description: 'Add types to make your code reliable.', priority: 2, estimatedWeeks: 2, effortHours: 6, resources: [{ title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'link' }], confidence: 0.7 })
  }

  // if resume mentions cloud or AWS keywords
  if (/aws|cloud|lambda/i.test(summary) || (skillList || []).some((s: string) => /aws|cloud/i.test(s))) {
    modules.push({ id: 'm-aws', title: 'AWS Fundamentals', description: 'Core AWS services for developers.', priority: 3, estimatedWeeks: 3, effortHours: 10, resources: [{ title: 'AWS Basics', url: 'https://aws.amazon.com/training', type: 'link' }], confidence: 0.75 })
  }

  // filler modules to reach up to maxModules
  const filler = [
    { id: 'm-ds', title: 'Data Structures & Algorithms', description: 'Core DS&A for interviews.', priority: 4, estimatedWeeks: 4, effortHours: 20, resources: [{ title: 'LeetCode', url: 'https://leetcode.com', type: 'link' }], confidence: 0.6 },
    { id: 'm-devops', title: 'Docker & Containers', description: 'Containers and local development.', priority: 5, estimatedWeeks: 2, effortHours: 6, resources: [{ title: 'Docker Docs', url: 'https://docs.docker.com', type: 'link' }], confidence: 0.6 },
  ]

  for (const f of filler) {
    if (modules.length >= maxModules) break
    modules.push(f)
  }

  // sort by priority
  modules.sort((a, b) => (a.priority || 999) - (b.priority || 999))

  return modules.slice(0, maxModules)
}

export default buildGuidedPath
