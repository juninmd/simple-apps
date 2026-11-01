#!/usr/bin/env node

import { generateEVP, validateEVP, formatEVP } from './evp.js';

function showHelp() {
  console.log(`
pixkey - PIX key CLI tool

Usage:
  pixkey generate <type>
  pixkey validate <type> <key>
  pixkey validate <key>
  pixkey format <type> <key>
  pixkey format <key>

Key Types:
  evp (chave aleatória / random key)

Examples:
  pixkey generate evp
  pixkey validate evp 123e4567-e89b-12d3-a456-426614174000
  pixkey format evp 123E4567-E89B-12D3-A456-426614174000
`);
}

// Accepts `<type> <key>` or just `<key>` (type defaults to evp). A lone
// `evp` is the type with the key missing, not a key to validate.
function parseTypeAndKey(args) {
  if (args.length >= 3) {
    return { type: args[1].toLowerCase(), key: args[2] };
  }
  if (args[1]?.toLowerCase() === 'evp') {
    return { type: 'evp', key: undefined };
  }
  return { type: 'evp', key: args[1] };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'generate': {
      const type = args[1]?.toLowerCase();
      if (!type) {
        console.error('Error: Key type required for generate command.');
        process.exit(1);
      }
      if (type === 'evp') {
        const key = generateEVP();
        console.log(key);
      } else {
        console.error(`Error: Unsupported key type "${type}". Supported types: evp`);
        process.exit(1);
      }
      break;
    }

    case 'validate': {
      const { type, key } = parseTypeAndKey(args);
      if (key === undefined) {
        console.error(`Error: Key required for validate command.`);
        process.exit(1);
      }

      if (type === 'evp') {
        const isValid = validateEVP(key);
        if (isValid) {
          console.log(`Valid EVP key: ${key}`);
          process.exit(0);
        } else {
          console.error(`Invalid EVP key: ${key}`);
          process.exit(1);
        }
      } else {
        console.error(`Error: Unsupported key type "${type}". Supported types: evp`);
        process.exit(1);
      }
      break;
    }

    case 'format': {
      const { type, key } = parseTypeAndKey(args);
      if (key === undefined) {
        console.error(`Error: Key required for format command.`);
        process.exit(1);
      }

      if (type === 'evp') {
        const formatted = formatEVP(key);
        if (formatted) {
          console.log(formatted);
          process.exit(0);
        } else {
          console.error(`Invalid EVP key: ${key}`);
          process.exit(1);
        }
      } else {
        console.error(`Error: Unsupported key type "${type}". Supported types: evp`);
        process.exit(1);
      }
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
  }
}

main();
