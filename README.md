# Simple Apps Collection

[![Expo](https://img.shields.io/badge/Expo-54.x-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

Monorepositório com 14 aplicativos móveis pequenos (Expo / React Native), cada um focado em uma utilidade específica. Cada pasta `app-*` é um projeto independente, com `package.json` e dependências próprias. **Não existe `package.json` na raiz**: todo comando roda dentro da pasta do app.

## Apps

| Pasta | Descrição | Gerenciador | Scripts úteis |
|-------|-----------|-------------|---------------|
| `app-color-palette` | Gerador e explorador de paletas de cores | npm | `test` |
| `app-daily-affirmations` | Afirmações diárias positivas (React Native 0.71 puro, sem Expo SDK 54) | sem lockfile | `test`, `lint` |
| `app-decision-roulette` | Roleta para decisões aleatórias | pnpm | `test`, `lint`, `format`, `e2e` (Maestro) |
| `app-hydration-tracker` | Monitoramento de ingestão de água | sem lockfile | só `start` |
| `app-morse-code-flasher` | Conversor e piscador de código Morse | pnpm | `test`, `lint` |
| `app-pomodoro-focus` | Timer Pomodoro para foco | sem lockfile | `lint` |
| `app-reaction-trainer` | Treinador de tempo de reação | pnpm | `test`, `lint`, `format` |
| `app-simple-bmi` | Calculadora de IMC | sem lockfile | só `start` |
| `app-strobe-light` | Efeito de luz estroboscópica | yarn 1.22 (`packageManager`) | só `start` |
| `app-tally-counter` | Contador simples | pnpm | `test` |
| `app-tip-splitter` | Divisor de conta e gorjeta | pnpm | `test`, `lint` |
| `app-unit-converter-pro` | Conversor de unidades | pnpm | `test` |
| `app-voice-vault` | Gravador e armazenamento de voz | pnpm | `test` |
| `app-zen-breather` | Exercício guiado de respiração | pnpm | `test`, `lint`, `format` |

Os scripts da tabela vêm do `package.json` de cada app. Onde não há lockfile, use o gerenciador de sua preferência (o README do app indica o recomendado).

## Requisitos

- Node.js 22 (o mesmo que o CI usa por padrão).
- pnpm ou npm, conforme a coluna "Gerenciador".
- Expo Go em um dispositivo, ou emulador Android/iOS, para abrir o app. `expo start --web` abre no navegador.

## Instalação e uso

```bash
git clone https://github.com/juninmd/simple-apps.git
cd simple-apps/app-tally-counter   # qualquer pasta app-*
pnpm install                       # npm install em app-color-palette
pnpm start                         # expo start (também: android, ios, web)
```

## Configuração

Nenhuma variável de ambiente é exigida pelos apps.

## Testes e lint

Dentro da pasta do app, apenas nos que definem o script (ver tabela):

```bash
pnpm test      # jest (jest-expo)
pnpm lint      # eslint . (pomodoro-focus usa `expo lint`)
pnpm format    # prettier --write . (decision-roulette, reaction-trainer, zen-breather)
```

Não há comando de teste, lint ou build na raiz. Um build de APK/EAS não é definido nos `package.json`.

## Gates de CI

Só os workflows em `.github/workflows/` da raiz rodam no GitHub:

| Workflow | Quando | O que checa |
|----------|--------|-------------|
| `validate.yml` | PR e push em `main` | Reusable `juninmd/base-actions` `reusable-validate.yml` (action `validate-pr`): varredura de segredos no intervalo do PR. Os passos Node (install, build, lint, test, audit) só rodam se existir `package.json` na raiz; como não existe, **não cobrem nenhum app** |
| `security.yml` | push em `main`, semanal (domingo 00:00 UTC), manual | Reusable `reusable-security-scan.yml` do `juninmd/base-actions` |

Na prática, testes e lint dos apps não são executados pelo CI; rode-os localmente. Os workflows dentro de `app-*/.github/` (build-apk, ci, release-drafter etc.) ficam em subpastas e não são executados pelo GitHub neste repositório.

## Screenshot

Screenshot pendente: os apps exigem dispositivo/emulador ou bundler Expo interativo, não executado neste procedimento.
