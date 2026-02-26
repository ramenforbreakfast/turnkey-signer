/**
 * Validates and approves a Turnkey signing activity.
 *
 *   1. Re-fetch the activity from Turnkey to verify its current state
 *   2. Verify the activity type is a signing request (not an admin action)
 *   3. Verify the target wallet matches WALLET_ADDRESS
 *   4. Call approveActivity with this signer's credentials
 */
import { getClient, requireEnv } from './turnkey'

const SIGNABLE_TYPES = new Set([
  'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
  'ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2',
])

export type ApprovalResult = {
  activityId: string
  skipped?: string
  approved?: boolean
  status?: string
  error?: string
}

export async function approveIfValid(
  activityId: string,
  organizationId: string
): Promise<ApprovalResult> {
  const client = getClient()
  const allowedWallet = requireEnv('WALLET_ADDRESS')

  // Re-fetch the activity directly from Turnkey — never trust the caller's payload alone
  const res = await client.getActivity({ organizationId, activityId })
  const activity = res.activity

  if (activity.status !== 'ACTIVITY_STATUS_CONSENSUS_NEEDED') {
    return { activityId, skipped: `status=${activity.status}` }
  }

  if (!SIGNABLE_TYPES.has(activity.type)) {
    console.warn(`[signer] Skipping unexpected activity type: ${activity.type}`)
    return { activityId, skipped: `unexpected_type=${activity.type}` }
  }

  // Verify the signing target is the expected wallet address
  // V2 activity types use signTransactionIntentV2 / signRawPayloadIntentV2, both of which have signWith
  const signWith: string =
    activity.intent?.signTransactionIntentV2?.signWith ??
    activity.intent?.signRawPayloadIntentV2?.signWith ??
    ''

  if (signWith !== allowedWallet) {
    console.warn(`[signer] Rejecting activity for unexpected wallet: ${signWith}`)
    return { activityId, skipped: `unexpected_wallet=${signWith}` }
  }

  // Approve
  const approveRes = await client.approveActivity({
    type: 'ACTIVITY_TYPE_APPROVE_ACTIVITY',
    timestampMs: Date.now().toString(),
    organizationId,
    parameters: { fingerprint: activity.fingerprint },
  })

  const newStatus = approveRes.activity?.status
  console.log(`[signer] Approved activity ${activityId} → ${newStatus}`)
  return { activityId, approved: true, status: newStatus }
}
