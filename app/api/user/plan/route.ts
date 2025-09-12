import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GetUser, UpdateUser } from '@/lib/actions/user.action'

export async function GET(req: Request) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await GetUser(userId)
    if (!user) return NextResponse.json({ plan: 'free' })

    return NextResponse.json({ plan: user.plan || 'free', user })
  } catch (err) {
    console.error('Error in GET /api/user/plan', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // For demo: toggle to plus. In production, validate payment before updating.
    const body = await req.json().catch(() => ({}))
    const newPlan = body.plan || 'plus'

    const updated = await UpdateUser(userId, { plan: newPlan })

    return NextResponse.json({ plan: updated.plan })
  } catch (err) {
    console.error('Error in POST /api/user/plan', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
