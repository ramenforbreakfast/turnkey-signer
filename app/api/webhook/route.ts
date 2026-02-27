/**
 * POST /api/webhook
 *
 * Called by your application immediately after Turnkey returns CONSENSUS_NEEDED.
 * Notify both signers in parallel — no Turnkey webhook config needed.
 *
 * Expected body: { activityId: string }
 *
 * Caller usage:
 *   await Promise.all([
 *     fetch(process.env.SIGNER_A_URL, { method: 'POST', body: JSON.stringify({ activityId }) }),
 *     fetch(process.env.SIGNER_B_URL, { method: 'POST', body: JSON.stringify({ activityId }) }),
 *   ])
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '../lib/turnkey'
import { approveIfValid } from '../lib/approve'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Log the full payload so we can see Turnkey's webhook format
  console.log('[signer] Incoming webhook body:', JSON.stringify(body))

  const activityId: string = body?.activityId ?? body?.activity?.id
  if (!activityId) {
    console.log('[signer] Could not extract activityId from payload')
    return NextResponse.json({ error: 'Missing activityId', received: body }, { status: 400 })
  }

  const orgId = requireEnv('TURNKEY_ORG_ID')
  try {
    const result = await approveIfValid(activityId, orgId)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[signer] Error processing activity:', err)
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}
