import { translations, SupportedLocale, DEFAULT_LOCALE, TranslationKey } from './translations.js';

export class I18nService {
  private defaultLocale: SupportedLocale;

  constructor(defaultLocale: SupportedLocale = DEFAULT_LOCALE) {
    this.defaultLocale = defaultLocale;
  }

  public isSupportedLocale(locale: string): locale is SupportedLocale {
    return locale === 'en' || locale === 'pt';
  }

  public getSupportedLocales(): SupportedLocale[] {
    return ['en', 'pt'];
  }

  public translate(key: TranslationKey, locale: SupportedLocale = this.defaultLocale): string {
    const localeTranslations = translations[locale] || translations[this.defaultLocale];
    return localeTranslations[key] || translations[DEFAULT_LOCALE][key] || key;
  }

  public getNextLocale(currentLocale: SupportedLocale): SupportedLocale {
    return currentLocale === 'pt' ? 'en' : 'pt';
  }
}

export const i18nService = new I18nService();
