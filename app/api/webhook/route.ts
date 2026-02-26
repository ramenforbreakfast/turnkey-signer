/**
 * POST /api/webhook
 *
 * Called by the RFQ engine immediately after Turnkey returns CONSENSUS_NEEDED.
 * The RFQ engine notifies both signers in parallel — no Turnkey webhook config needed.
 *
 * Expected body: { activityId: string }
 *
 * RFQ engine usage:
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

  const activityId: string = body?.activityId
  if (!activityId) {
    return NextResponse.json({ error: 'Missing activityId' }, { status: 400 })
  }

  const orgId = requireEnv('TURNKEY_ORG_ID')
  const result = await approveIfValid(activityId, orgId)
  return NextResponse.json(result)
}
