declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name: string
    length?: number
    issuer?: string
  }

  export interface Secret {
    ascii: string
    hex: string
    base32: string
    qr_code_ascii?: string
    qr_code_hex?: string
    qr_code_base32?: string
    google_auth_qr?: string
    otpauth_url?: string
  }

  export interface GenerateSecretResult {
    secret: Secret
  }

  export function generateSecret(options: GenerateSecretOptions): GenerateSecretResult
  export function totp(options: { secret: string; encoding?: string }): string
  export function verify(options: {
    secret: string
    token: string
    encoding?: string
    window?: number
  }): boolean

  export namespace totp {
    function verify(options: {
      secret: string
      token: string
      encoding?: string
      window?: number
    }): boolean
  }

  export default {
    generateSecret,
    totp,
    verify,
  }
}

