import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface Props {
  params: Promise<{ locale: string; token: string }>;
}

export default async function RecibirPage({ params }: Props) {
  const { locale, token } = await params;
  const supabase = getAdminClient();

  // 1. Validate token existence
  const { data: deliveryToken } = await supabase
    .from('delivery_tokens')
    .select('message_id, expires_at, recipients(email)')
    .eq('token', token)
    .single();

  // 3. If the user is already logged in with the correct email, send them straight to the message
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  // --- TEMPORARY INSTRUMENTATION LOGS ---
  const maskEmail = (e: string | undefined | null) => e ? `${e.split('@')[0]?.substring(0, 2)}***@${e.split('@')[1]}` : 'none';
  const truncateToken = (t: string | undefined | null) => t ? t.substring(0, 8) + '...' : 'none';
  
  // Resolve recipient email from joined recipients table. Supabase nested select with single() might return an object or array.
  // We'll handle both just in case, but usually for a to-one join it's an object, or an array if the FK is not unique. 
  // delivery_tokens has `recipient_id UUID NOT NULL REFERENCES public.recipients(id)` which is a many-to-one, so it should be an object.
  const recipientEmailRaw = Array.isArray(deliveryToken?.recipients) 
    ? deliveryToken?.recipients[0]?.email 
    : (deliveryToken?.recipients as any)?.email;
    
  const recipientEmail = typeof recipientEmailRaw === 'string' ? recipientEmailRaw : null;
  
  console.log(`[received-flow:recibir] START | locale: ${locale} | token: ${truncateToken(token)}`);
  console.log(`[received-flow:recibir] deliveryToken exists: ${!!deliveryToken} | user logged in: ${!!user}`);
  
  if (deliveryToken && user && user.email && recipientEmail) {
    const match = user.email.trim().toLowerCase() === recipientEmail.trim().toLowerCase();
    console.log(`[received-flow:recibir] email match: ${match} | user: ${maskEmail(user.email)} | recipient: ${maskEmail(recipientEmail)}`);
  }

  if (!deliveryToken) {
    console.log(`[received-flow:recibir] END | Redirecting to login invalid_token`);
    redirect(`/${locale}/auth/login?error=invalid_token`);
  }

  // 2. Check expiry (belt-and-suspenders — column default enforces 15 days)
  if (new Date(deliveryToken.expires_at) < new Date()) {
    console.log(`[received-flow:recibir] END | Redirecting to login expired_token`);
    redirect(`/${locale}/auth/login?error=expired_token`);
  }

  if (user && user.email && recipientEmail && user.email.trim().toLowerCase() === recipientEmail.trim().toLowerCase()) {
    console.log(`[received-flow:recibir] END | Redirecting to dashboard received`);
    redirect(`/${locale}/dashboard/received?open=${token}`);
  }

  console.log(`[received-flow:recibir] END | Showing Gate Page`);

  // 4. Show the welcome / gate page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f3ee] to-[#fde8d8] px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">💌</div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
          Tenés un mensaje esperándote
        </h1>
        <p className="text-gray-500 mb-6">
          Alguien te dejó un mensaje especial en Carry My Words. Registrate o
          iniciá sesión para verlo.
        </p>

        <Link
          href={`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/recibir/${token}`)}`}
          className="block w-full bg-[#c4622a] hover:bg-[#a8521f] text-white font-medium py-3 px-6 rounded-xl mb-3 transition-colors"
        >
          Crear cuenta para ver el mensaje
        </Link>

        <Link
          href={`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/recibir/${token}`)}`}
          className="block w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
        >
          Ya tengo cuenta — Iniciar sesión
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          Este link es válido por 15 días
        </p>
      </div>
    </div>
  );
}
