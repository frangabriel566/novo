import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: string
}

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function setAuthCookie(token: string) {
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // no maxAge = session cookie: expires when browser is closed
    path: '/',
  })
}

export function clearAuthCookie() {
  cookies().set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}
