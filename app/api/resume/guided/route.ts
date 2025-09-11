import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import buildGuidedPath from '@/lib/actions/guided.action'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    function safeParseUrl(request: NextRequest) {
      try { return new URL(request.url); }
      catch (e) { const host = request.headers?.get?.('host') || 'localhost'; return new URL(request.url, `http://${host}`); }
    }
    const url = safeParseUrl(req)
    const resumeId = url.searchParams.get('resumeId') || undefined
    const max = Number(url.searchParams.get('max') || '8')

    const guided = await buildGuidedPath(userId, resumeId, max)

    return new Response(JSON.stringify({ success: true, guidedPath: guided }), { status: 200 })
  } catch (err) {
    console.error('Error building guided path', err)
    return new Response(JSON.stringify({ error: 'Failed to build guided path' }), { status: 500 })
  }
}
