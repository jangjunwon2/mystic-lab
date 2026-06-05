import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Admin route protection
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const proxyResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              proxyResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/en/sign-in?redirect=/admin", request.url));
    }

    // 어드민 판별은 이메일 기준으로 통일 (profiles.role 체크는 RLS 재귀 버그로 금지)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/en", request.url));
    }

    return proxyResponse;
  }

  // i18n routing for all other paths
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/(en|ko|ja|zh-CN|es|fr|de)/:path*",
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
