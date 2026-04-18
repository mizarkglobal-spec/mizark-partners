import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://partners.mizarkglobal.com";
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback]", error);
      return NextResponse.redirect(`${appUrl}/login?error=invalid_code`);
    }

    // Redirect admins to admin panel
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(`${appUrl}/admin`);
    }

    const redirectUrl = next.startsWith("/") ? `${appUrl}${next}` : `${appUrl}/dashboard`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[auth/callback] unexpected:", err);
    return NextResponse.redirect(`${appUrl}/login?error=server_error`);
  }
}
