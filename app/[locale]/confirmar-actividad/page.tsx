import { getDictionary, type Locale, isValidLocale, defaultLocale } from '@/lib/i18n'
import { ConfirmActivityWrapper } from './confirm-activity-content'

export default async function ConfirmActivityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale
  const dict = await getDictionary(locale)

  return (
    <ConfirmActivityWrapper
      dict={dict.confirmarActividad}
      tagline={dict.emails.common.tagline}
    />
  )
}
