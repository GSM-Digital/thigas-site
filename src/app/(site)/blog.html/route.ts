export function GET() { return Response.redirect(new URL('/blog', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), 308) }
