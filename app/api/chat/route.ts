import { inngest } from "@/inngest/client";
import axios from "axios"
import { NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {

  const { has } = await auth()
  const hasPremiumUser = has({plan : 'plus'})

  if(!hasPremiumUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { userInput } = await request.json();
  const resultIds = await inngest.send
  ({
    name:"AiCareerAgent",
    data:{
      userInput : userInput
    }
  })
  const runId = Array.isArray(resultIds?.ids) && resultIds.ids.length ? resultIds.ids[0] : null;

  if (!runId) {
    return NextResponse.json({ error: 'Failed to start Inngest run (no run id returned).' }, { status: 502 });
  }

  let runStatus: any = null;
  const maxAttempts = 30; // ~60 seconds
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      runStatus = await getRuns(runId);
    } catch (err) {
      // log and continue retrying
      console.warn('getRuns failed (attempt ' + attempts + '):', err);
      runStatus = null;
    }

    const status = runStatus && Array.isArray(runStatus.data) && runStatus.data[0] ? runStatus.data[0].status : null;
    if (status === 'Completed' || status === 'Failed') {
      break;
    }
    // wait before next check
    await new Promise(res => setTimeout(res, 2000));
  }

  if (!runStatus) {
    return NextResponse.json({ error: 'Timed out waiting for run status or no data returned.' }, { status: 504 });
  }

  return NextResponse.json(runStatus.data?.[0].output?.output[0])
}

export async function getRuns(runId:string){
  try {
    if (!process.env.INNGEST_SERVER_HOST) throw new Error('INNGEST_SERVER_HOST not configured')
    const url = `${process.env.INNGEST_SERVER_HOST.replace(/\/+$/,'')}/v1/events/${encodeURIComponent(runId)}/runs`;
    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.INNGEST_SIGNING_KEY}`
      }
    })
    return result.data;
  } catch (err) {
    console.error('Error fetching run status:', err)
    throw err
  }
}