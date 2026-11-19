# app-simple-bmi

Calculadora de IMC (índice de massa corporal) em Expo / React Native: informe altura em cm e peso em kg e veja o valor com a faixa (Underweight, Normal, Overweight, Obese).

## Como rodar

Requisitos: Node.js 22 e um dispositivo com Expo Go (ou emulador). Não há lockfile nesta pasta.

```bash
cd app-simple-bmi
npm install
npm start          # expo start; também: npm run android | ios | web
```

## Como funciona

- `App.tsx`: tela com os dois campos, o botão **Calculate** e o resultado.
- `src/bmi.ts`: `calculateBmi(heightCm, weightKg)`, `peso / (altura em m)²` com uma casa decimal. Aceita vírgula decimal (por exemplo `70,5`) e devolve `null` para valores vazios, zero, negativos ou não numéricos (a tela mostra um aviso).

| IMC | Faixa |
|---|---|
| < 18.5 | Underweight |
| 18.5 a < 25 | Normal |
| 25 a < 30 | Overweight |
| >= 30 | Obese |

O banner "[Ad: Healthy Diet Plans]" é apenas um espaço reservado de exemplo.

Não há testes automatizados nesta pasta.
