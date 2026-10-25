# Simple Apps

Monorepo de 14 apps Expo 54 / React Native 0.81 / TypeScript 5.9. Cada `app-*` é independente. Não há `package.json` na raiz.

## Comandos (sempre dentro de `app-<nome>/`)

- Instalar: `pnpm install` (npm em `app-color-palette`; `app-strobe-light` declara yarn 1.22; sem lockfile em daily-affirmations, hydration-tracker, pomodoro-focus, simple-bmi)
- Rodar: `pnpm start` (`expo start`)
- Testes: `pnpm test` (jest / jest-expo), só nos apps que definem o script
- Lint: `pnpm lint`, só onde existe (daily-affirmations, decision-roulette, morse-code-flasher, pomodoro-focus, reaction-trainer, tip-splitter, zen-breather)
- Formatar: `pnpm format` (decision-roulette, reaction-trainer, zen-breather)
- Confira o `scripts` do `package.json` do app antes de assumir um comando.

## Gates de CI

Só `.github/workflows/` da raiz roda: `validate.yml` (PR/main, reusable do `juninmd/base-actions`: varredura de segredos; os passos Node só rodam com `package.json` na raiz, que não existe, então testes/lint dos apps NÃO rodam no CI) e `security.yml` (main, semanal, manual). Workflows em `app-*/.github/` não executam. Rode testes/lint do app localmente antes do PR.

## Convenções

- Respeite o gerenciador do lockfile do app; não troque.
- TypeScript estrito; siga o estilo e o AGENTS.md do próprio app.
- `app-daily-affirmations` usa React Native 0.71 puro, diferente dos demais.

## Não fazer

- Não commitar `.env`, chaves ou segredos.
- Não editar lockfiles à mão.
- Não assumir comando na raiz (`npm test` na raiz não existe).

<!-- base-actions-main-policy -->
## GitHub Actions — padrão obrigatório (@main)

- Referencie as actions internas sempre pelo branch, nunca por SHA:
  - `uses: juninmd/base-actions/<action>@main`
  - `uses: juninmd/base-actions/.github/workflows/<arquivo>.yml@main`
- Não fixe `@<sha>` em `juninmd/base-actions`: a atualização é centralizada no
  `main` e passa a valer no próximo run.
- PRs cujos checks não iniciam por billing/spending limit são mesclados pelo bot central
  `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`.
  Para impedir o merge automático de um PR, aplique a label `do-not-merge`.