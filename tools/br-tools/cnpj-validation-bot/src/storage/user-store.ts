import { SupportedLocale, DEFAULT_LOCALE } from '../i18n/translations.js';

export class UserStore {
  private userLocales: Map<number, SupportedLocale> = new Map();

  public getUserLocale(userId: number): SupportedLocale {
    return this.userLocales.get(userId) || DEFAULT_LOCALE;
  }

  public setUserLocale(userId: number, locale: SupportedLocale): void {
    this.userLocales.set(userId, locale);
  }

  public clear(): void {
    this.userLocales.clear();
  }
}

export const userStore = new UserStore();
