import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const publicPaths = ['/login', '/register']
const publicApiPaths = ['/api/auth/login', '/api/auth/register']

// Pages blocked for USER role (admin only)
const adminOnlyPaths = ['/dashboard', '/products', '/stock', '/customers', '/expenses', '/fiado', '/reports', '/users']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (publicApiPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string

    // Redirect USER role away from admin-only pages
    if (role !== 'ADMIN' && adminOnlyPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/sales', request.url))
    }

    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
