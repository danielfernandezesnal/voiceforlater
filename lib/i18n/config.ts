export const locales = ['es', 'en', 'pt', 'fr'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français'
};

export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  pt: '🇧🇷',
  fr: '🇫🇷'
};

export const localeCodes: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
  pt: 'PT',
  fr: 'FR'
};


export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale)
}
