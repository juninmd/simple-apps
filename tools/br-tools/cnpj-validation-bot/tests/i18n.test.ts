import { describe, it, expect } from 'vitest';
import { I18nService } from '../src/i18n/i18n.service.js';

describe('I18nService', () => {
  const i18n = new I18nService();

  it('should translate keys correctly for Portuguese', () => {
    expect(i18n.translate('language_changed', 'pt')).toContain('Português');
    expect(i18n.translate('welcome', 'pt')).toBe('Bem-vindo ao Robô de Validação de CNPJ!');
  });

  it('should translate keys correctly for English', () => {
    expect(i18n.translate('language_changed', 'en')).toContain('English');
    expect(i18n.translate('welcome', 'en')).toBe('Welcome to CNPJ Validation Bot!');
  });

  it('should fallback to default locale if unknown locale is provided', () => {
    // @ts-expect-error testing runtime fallback for invalid locale
    expect(i18n.translate('welcome', 'fr')).toBe('Bem-vindo ao Robô de Validação de CNPJ!');
  });

  it('should validate supported locales', () => {
    expect(i18n.isSupportedLocale('pt')).toBe(true);
    expect(i18n.isSupportedLocale('en')).toBe(true);
    expect(i18n.isSupportedLocale('es')).toBe(false);
  });

  it('should correctly determine the next toggled locale', () => {
    expect(i18n.getNextLocale('pt')).toBe('en');
    expect(i18n.getNextLocale('en')).toBe('pt');
  });
});
