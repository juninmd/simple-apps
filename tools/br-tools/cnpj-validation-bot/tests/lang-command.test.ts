import { describe, it, expect, beforeEach } from 'vitest';
import { handleLangCommand } from '../src/bot/commands/lang.js';
import { UserStore } from '../src/storage/user-store.js';
import { I18nService } from '../src/i18n/i18n.service.js';
import { Context } from 'grammy';

describe('/lang Command Handler', () => {
  let userStore: UserStore;
  let i18nService: I18nService;

  beforeEach(() => {
    userStore = new UserStore();
    i18nService = new I18nService();
  });

  function createMockContext(userId: number, match = ''): { ctx: Context; replies: string[] } {
    const replies: string[] = [];
    const ctx = {
      from: { id: userId, is_bot: false, first_name: 'TestUser' },
      match,
      reply: async (text: string) => {
        replies.push(text);
        return {} as any;
      },
    } as unknown as Context;

    return { ctx, replies };
  }

  it('should toggle language from default (pt) to en when /lang is executed without args', async () => {
    const userId = 1001;
    const { ctx, replies } = createMockContext(userId, '');

    expect(userStore.getUserLocale(userId)).toBe('pt');

    await handleLangCommand(ctx, i18nService, userStore);

    expect(userStore.getUserLocale(userId)).toBe('en');
    expect(replies[0]).toContain('Language set to English');
  });

  it('should toggle language from en back to pt on subsequent /lang call', async () => {
    const userId = 1002;
    userStore.setUserLocale(userId, 'en');

    const { ctx, replies } = createMockContext(userId, '');

    await handleLangCommand(ctx, i18nService, userStore);

    expect(userStore.getUserLocale(userId)).toBe('pt');
    expect(replies[0]).toContain('Idioma alterado para Português');
  });

  it('should set specific language when provided as argument (/lang en)', async () => {
    const userId = 1003;
    const { ctx, replies } = createMockContext(userId, 'en');

    await handleLangCommand(ctx, i18nService, userStore);

    expect(userStore.getUserLocale(userId)).toBe('en');
    expect(replies[0]).toContain('Language set to English');
  });

  it('should set specific language when provided as argument (/lang pt)', async () => {
    const userId = 1004;
    userStore.setUserLocale(userId, 'en');

    const { ctx, replies } = createMockContext(userId, 'pt');

    await handleLangCommand(ctx, i18nService, userStore);

    expect(userStore.getUserLocale(userId)).toBe('pt');
    expect(replies[0]).toContain('Idioma alterado para Português');
  });

  it('should handle invalid language argument gracefully', async () => {
    const userId = 1005;
    const { ctx, replies } = createMockContext(userId, 'es');

    await handleLangCommand(ctx, i18nService, userStore);

    expect(userStore.getUserLocale(userId)).toBe('pt');
    expect(replies[0]).toContain('Idioma inválido');
  });

  it('should maintain independent language states for different users', async () => {
    const user1 = 2001;
    const user2 = 2002;

    const mock1 = createMockContext(user1, 'en');
    const mock2 = createMockContext(user2, 'pt');

    await handleLangCommand(mock1.ctx, i18nService, userStore);
    await handleLangCommand(mock2.ctx, i18nService, userStore);

    expect(userStore.getUserLocale(user1)).toBe('en');
    expect(userStore.getUserLocale(user2)).toBe('pt');
  });
});
