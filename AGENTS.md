# AGENTS.md

Monorepo of 14 small Expo / React Native apps (Expo 54, React Native 0.81, TypeScript 5.9). Each `app-*/` folder is independent, with its own `package.json` and lockfile. There is no root `package.json`.

## Stack

- Expo 54, React Native 0.81, TypeScript 5.9 (strict)
- Exception: `app-daily-affirmations` uses plain React Native 0.71
- Node.js 22
- Package managers: pnpm in most apps, yarn 1.22 in `app-strobe-light`. Read the `packageManager` field and the lockfile of the app you touch.

## Commands

Run every command inside the app folder, for example `cd app-tally-counter`:

- Install: `pnpm install` (or the manager the app declares)
- Start: `pnpm start` (`expo start`). Also `android`, `ios`, `web` where the script exists
- Test: `pnpm test` (Jest / jest-expo) only in apps that define it: color-palette, decision-roulette, morse-code-flasher, reaction-trainer, tally-counter, tip-splitter, unit-converter-pro, voice-vault, zen-breather
- Lint and format: only where the app defines the script. Check its `package.json`
- Do not assume a command at the root. `npm test` at the root does not exist

## Structure

- `app-*/`: one app each. Some have their own `AGENTS.md`, `GEMINI.md` or `README.md`
- `tools/`: CLIs and experiments with their own README (for example `tools/br-tools/pixkey-cli`). Not part of root CI
- `.github/workflows/`: root CI. `validate.yml` (reusable from `juninmd/base-actions`, secret scan) and `security.yml`
- Workflows under `app-*/.github/` do not run from the root

## Conventions

- Keep each app's lockfile and manager. Do not switch managers.
- Follow the style and `AGENTS.md` of the app you touch.
- Run the app's tests and lint locally before opening a PR. Root CI does not run them (see Gotchas).

## Gotchas

- Root CI does not run app tests or lint. `validate.yml` has no Node steps, because there is no root `package.json`. Only the secret scan runs.
- Lockfiles: none in `app-daily-affirmations`, `app-hydration-tracker`, `app-pomodoro-focus`, `app-simple-bmi`. Do not hand-edit lockfiles.
- Do not commit `.env`, keys or secrets.
- Agent output logs (`*.log`) and `.jules/` folders are not source. They are git-ignored at the root.

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
