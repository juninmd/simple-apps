export type SupportedLocale = 'en' | 'pt';

export const DEFAULT_LOCALE: SupportedLocale = 'pt';

export type TranslationKey =
  | 'language_changed'
  | 'current_language'
  | 'language_option_invalid'
  | 'welcome';

export const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  pt: {
    language_changed: 'Idioma alterado para Português 🇧🇷.',
    current_language: 'O idioma atual é Português.',
    language_option_invalid: 'Idioma inválido. Use /lang pt ou /lang en.',
    welcome: 'Bem-vindo ao Robô de Validação de CNPJ!',
  },
  en: {
    language_changed: 'Language set to English 🇬🇧.',
    current_language: 'Current language is English.',
    language_option_invalid: 'Invalid language. Use /lang pt or /lang en.',
    welcome: 'Welcome to CNPJ Validation Bot!',
  },
};
