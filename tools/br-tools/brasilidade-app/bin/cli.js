#!/usr/bin/env node

import { getCategories, getEntriesByCategory, searchEntries } from '../src/data.js';

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--category' || arg === '-c') {
      options.category = args[++i];
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg === '--list-categories' || arg === '-l') {
      options.listCategories = true;
    } else if (arg === '--search' || arg === '-s') {
      options.search = args[++i];
    } else if (arg.startsWith('--search=')) {
      options.search = arg.split('=')[1];
    } else if (arg === '--serve') {
      options.serve = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  return options;
}

function showHelp() {
  console.log(`
🇧🇷 Brasilidade CLI - Encyclopedia of Brazilian Culture

Usage:
  brasilidade [options]

Options:
  -c, --category <name>   Filter content entries by themed category (e.g., Gastronomy, Music, History)
  -l, --list-categories   List all available themed categories
  -s, --search <term>     Search entries by term
  --serve                 Launch the local web application server
  -h, --help              Show this help message
  `);
}

async function run() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.serve) {
    await import('../src/server.js');
    return;
  }

  if (options.listCategories) {
    const categories = getCategories();
    console.log('\nAvailable Themed Categories:');
    categories.forEach((cat) => console.log(`  - ${cat}`));
    console.log();
    return;
  }

  const entries = searchEntries(options.search, options.category);

  if (options.category) {
    console.log(`\nFiltered by Category: "${options.category}" (${entries.length} results)`);
  } else if (options.search) {
    console.log(`\nSearch results for: "${options.search}" (${entries.length} results)`);
  } else {
    console.log(`\nAll Cultural Entries (${entries.length} items)`);
  }
  console.log('='.repeat(50));

  if (entries.length === 0) {
    console.log('No matching entries found.');
  } else {
    entries.forEach((entry) => {
      console.log(`\n📌 [${entry.category}] ${entry.title}`);
      console.log(`   ${entry.summary}`);
      console.log(`   Details: ${entry.description}`);
    });
  }
  console.log();
}

run();
