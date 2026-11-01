# pixkey-cli

A command-line tool and JavaScript library for Brazilian developers to validate, generate, and format PIX keys (CPF, CNPJ, email, phone, and EVP/random keys). It helps ensure correct key formats before integration and can generate test keys for sandbox environments.

## Installation

```bash
npm install -g pixkey-cli
```

## CLI Usage

### Generate an EVP Key (Chave Aleatória / UUID)

```bash
pixkey generate evp
# Output: e.g. 123e4567-e89b-12d3-a456-426614174000
```

### Validate an EVP Key

```bash
pixkey validate evp 123e4567-e89b-12d3-a456-426614174000
# Output: Valid EVP key: 123e4567-e89b-12d3-a456-426614174000
```

### Format an EVP Key

```bash
pixkey format evp 123E4567-E89B-12D3-A456-426614174000
# Output: 123e4567-e89b-12d3-a456-426614174000
```

## JavaScript / Node.js API Usage

```javascript
import { generateEVP, validateEVP, formatEVP } from 'pixkey-cli';

// Generate a random EVP key
const key = generateEVP();
console.log(key); // e.g. "c736561f-13a8-4720-8326-897f1f5d6ff7"

// Validate an EVP key
console.log(validateEVP('123e4567-e89b-12d3-a456-426614174000')); // true
console.log(validateEVP('invalid-key')); // false

// Format an EVP key
console.log(formatEVP(' 123E4567-E89B-12D3-A456-426614174000 ')); // "123e4567-e89b-12d3-a456-426614174000"
```

## License

MIT
