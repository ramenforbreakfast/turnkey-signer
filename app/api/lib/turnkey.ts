import { TurnkeyClient } from '@turnkey/http'
import { ApiKeyStamper } from '@turnkey/api-key-stamper'

export function getClient(): TurnkeyClient {
  const baseUrl = process.env.TURNKEY_BASE_URL ?? 'https://api.turnkey.com'
  const stamper = new ApiKeyStamper({
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  })
  return new TurnkeyClient({ baseUrl }, stamper)
}

export function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required env var: ${name}`)
  return val
}
