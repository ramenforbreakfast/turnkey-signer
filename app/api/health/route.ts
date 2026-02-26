import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    org: process.env.TURNKEY_ORG_ID ?? 'not set',
    allowedWallet: process.env.ALLOWED_WALLET_ADDRESS ?? 'not set',
    publicKey: process.env.TURNKEY_API_PUBLIC_KEY?.slice(0, 8) + '...' ?? 'not set',
  })
}
