import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";

function normalizePath(p: string) {
  try {
    new URL(p);
    return null;
  } catch { }
  if (!p.startsWith("/")) return null;
  if (p.startsWith("//")) return null;
  return p;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const locale = requestUrl.pathname.split("/")[1] || "en";
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextParam = requestUrl.searchParams.get("next");

  const supabase = await createClient();
  const fallbackUserRedirect = `/${locale}/dashboard`;

  let user = null;
  let sessionError = null;

  // Flow A: Magic Link / OTP / Recovery (uses token_hash + type)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (error) {
      sessionError = error;
    } else {
      user = data.user;
    }
  }
  // Flow B: OAuth / PKCE (uses code)
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      sessionError = error;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  }
  // Flow C: Neither (Invalid link)
  else {
    return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
  }

  // Handle Errors
  if (sessionError) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=auth_callback_failed&details=${encodeURIComponent(sessionError.message)}`, requestUrl.origin)
    );
  }

  // Handle Success - Admin Check


  let isPrivileged = false;

  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData && (roleData.role === 'owner' || roleData.role === 'admin')) {
      isPrivileged = true;
    }
  }

  if (isPrivileged) {
    return NextResponse.redirect(new URL(`/${locale}/admin`, requestUrl.origin));
  }

  const safeNext = nextParam ? normalizePath(nextParam) : null;

  // Handle password recovery redirect
  if (type === 'recovery') {
    return NextResponse.redirect(new URL(`/${locale}/auth/set-password`, requestUrl.origin));
  }

  return NextResponse.redirect(
    new URL(safeNext ?? fallbackUserRedirect, requestUrl.origin)
  );
}
