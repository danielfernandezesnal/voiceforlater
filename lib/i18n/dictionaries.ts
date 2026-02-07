import type { Locale } from './config'

const dictionaries = {
    en: () => import('@/messages/en.json').then((module) => module.default),
    es: () => import('@/messages/es.json').then((module) => module.default),
}

export async function getDictionary(locale: Locale) {
    return dictionaries[locale]()
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
