import * as React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { CheckinReminderLayout } from './_shared/checkin-reminder-layout';
import { render } from '@react-email/render';

export interface CheckinReminder1EmailProps {
  checkinUrl: string;
  locale: Locale;
}

export async function CheckinReminder1Email({
  checkinUrl,
  locale,
}: CheckinReminder1EmailProps) {
  const dict = await getDictionary(locale);
  const t = dict.emails.checkinReminder1;
  const common = dict.emails.common;
  const dashboardUrl = checkinUrl.replace(/confirmar-actividad.*/, 'dashboard').replace(/verify-status.*/, 'dashboard');
  const supportUrl = checkinUrl.replace(/confirmar-actividad.*/, 'contact').replace(/verify-status.*/, 'contact');

  return (
    <CheckinReminderLayout
      locale={locale}
      title={t.subject}
      heroTitle={t.heroTitle}
      heroEyebrow={t.eyebrow}
      checkinUrl={checkinUrl}
      dashboardUrl={dashboardUrl}
      supportUrl={supportUrl}
      common={common}
      body={t.body}
    />
  );
}

export async function sendCheckinReminder1Email(toUserEmail: string, checkinUrl: string, locale: Locale) {
  const resend = getResend();
  const dict = await getDictionary(locale);

  if (!resend) {
    console.error("Resend client not available");
    return { error: "Resend client not available" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: toUserEmail,
      subject: dict.emails.checkinReminder1.subject,
      html: await render(await CheckinReminder1Email({ checkinUrl, locale })),
    });
    if (error) {
      console.error("Error sending Checkin Reminder 1:", error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error("Error sending Checkin Reminder 1:", error);
    return { error };
  }
}
