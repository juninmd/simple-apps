import { Context } from 'grammy';
import { I18nService, i18nService as defaultI18n } from '../../i18n/i18n.service.js';
import { UserStore, userStore as defaultUserStore } from '../../storage/user-store.js';

export async function handleLangCommand(
  ctx: Context,
  i18n: I18nService = defaultI18n,
  store: UserStore = defaultUserStore
): Promise<string> {
  const userId = ctx.from?.id;

  if (!userId) {
    const defaultMsg = i18n.translate('language_option_invalid');
    await ctx.reply(defaultMsg);
    return defaultMsg;
  }

  const currentLocale = store.getUserLocale(userId);
  const arg = ctx.match ? String(ctx.match).trim().toLowerCase() : '';

  if (arg) {
    if (i18n.isSupportedLocale(arg)) {
      store.setUserLocale(userId, arg);
      const msg = i18n.translate('language_changed', arg);
      await ctx.reply(msg);
      return msg;
    } else {
      const msg = i18n.translate('language_option_invalid', currentLocale);
      await ctx.reply(msg);
      return msg;
    }
  }

  // Toggle locale if no argument provided
  const newLocale = i18n.getNextLocale(currentLocale);
  store.setUserLocale(userId, newLocale);
  const msg = i18n.translate('language_changed', newLocale);
  await ctx.reply(msg);
  return msg;
}
