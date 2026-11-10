import { Bot } from 'grammy';
import { handleLangCommand } from './commands/lang.js';

export function createBot(token: string) {
  const bot = new Bot(token);

  bot.command('lang', async (ctx) => {
    await handleLangCommand(ctx);
  });

  bot.command('start', async (ctx) => {
    await ctx.reply('CNPJ Validation Bot is ready. Use /lang to switch language.');
  });

  return bot;
}
