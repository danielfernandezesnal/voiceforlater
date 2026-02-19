import { getDictionary } from './dictionaries'
import { Locale } from './config'

describe('i18n Dictionary Smoke Test', () => {
    const locales: Locale[] = ['en', 'es']

    locales.forEach((locale) => {
        describe(`Locale: ${locale}`, () => {
            let dictionary: any

            beforeAll(async () => {
                dictionary = await getDictionary(locale)
            })

            test('should have basic wizard keys', () => {
                expect(dictionary.wizard.title).toBeDefined()
                expect(typeof dictionary.wizard.title).toBe('string')
                expect(dictionary.wizard.steps.type).toBeDefined()
                expect(dictionary.wizard.steps.content).toBeDefined()
            })

            test('should have new wizard step 1 keys', () => {
                expect(dictionary.wizard.step1.video.upgradeToPro).toBeDefined()
            })

            test('should have recording error and status keys', () => {
                const recording = dictionary.wizard.step2.recording
                expect(recording.errorMicrophone).toBeDefined()
                expect(recording.errorCamera).toBeDefined()
                expect(recording.errorStart).toBeDefined()
                expect(recording.loadingCamera).toBeDefined()
            })

            test('should have trusted contact wizard keys (step 4)', () => {
                const checkin = dictionary.wizard.step4.checkin
                expect(checkin.trustedContacts).toBeDefined()
                expect(checkin.freeLimit).toBeDefined()
                expect(checkin.contactLabel).toBeDefined()
                expect(checkin.contactLabelNumbered).toBeDefined()
                expect(checkin.selectPlaceholder).toBeDefined()
                expect(checkin.addNew).toBeDefined()
                expect(checkin.noContactWarning).toBeDefined()
            })

            test('should have review content and warning keys (step 5)', () => {
                const step5 = dictionary.wizard.step5
                expect(step5.audioContent).toBeDefined()
                expect(step5.videoContent).toBeDefined()
                expect(step5.noContactWarning).toBeDefined()
            })

            test('should have trusted contact management keys', () => {
                const tc = dictionary.trustedContact
                expect(tc.newContactTitle).toBeDefined()
                expect(tc.errorCreating).toBeDefined()
            })

            test('no keys should be empty strings', () => {
                // Sampling a few crucial ones
                expect(dictionary.wizard.title.length).toBeGreaterThan(0)
                expect(dictionary.wizard.step4.checkin.noContactWarning.length).toBeGreaterThan(0)
            })
        })
    })
})
