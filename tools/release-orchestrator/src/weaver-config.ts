import Ajv from 'ajv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { WeaverConfig, ValidationResult } from './types.js';

const nodeRequire = createRequire(import.meta.url);
const weaverSchema = nodeRequire('../schemas/weaver-config.schema.json');

const ajv = new (Ajv as any)({ allErrors: true });
const validateSchema = ajv.compile(weaverSchema);

export const DEFAULT_TYPES_MAP: Record<string, Record<string, string>> = {
  feat: {
    en: 'Features',
    'pt-BR': 'Recursos',
    es: 'Características'
  },
  fix: {
    en: 'Bug Fixes',
    'pt-BR': 'Correções de Bugs',
    es: 'Correcciones de errores'
  },
  docs: {
    en: 'Documentation',
    'pt-BR': 'Documentação',
    es: 'Documentación'
  },
  refactor: {
    en: 'Code Refactoring',
    'pt-BR': 'Refatoração de Código',
    es: 'Refactorización de código'
  },
  perf: {
    en: 'Performance Improvements',
    'pt-BR': 'Melhorias de Desempenho',
    es: 'Mejoras de rendimiento'
  },
  test: {
    en: 'Tests',
    'pt-BR': 'Testes',
    es: 'Pruebas'
  },
  chore: {
    en: 'Maintenance',
    'pt-BR': 'Manutenção',
    es: 'Mantenimiento'
  }
};

export function validateWeaverConfig(config: unknown): ValidationResult {
  const valid = validateSchema(config);
  if (!valid) {
    const errors = (validateSchema.errors || []).map(
      (err: { instancePath?: string; message?: string }) => `${err.instancePath || 'root'} ${err.message}`
    );
    return { valid: false, errors };
  }

  const typedConfig = config as WeaverConfig;

  if (typedConfig.strategy === 'custom-regex' && typedConfig.customRegex?.pattern) {
    try {
      new RegExp(typedConfig.customRegex.pattern);
    } catch (e) {
      return {
        valid: false,
        errors: [`Invalid customRegex.pattern RegExp: ${(e as Error).message}`]
      };
    }
  }

  return { valid: true, errors: [] };
}

export function loadWeaverConfig(filePath: string): WeaverConfig {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    throw new Error(`Failed to parse configuration JSON: ${(e as Error).message}`);
  }

  const validation = validateWeaverConfig(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid Weaver configuration:\n- ${validation.errors.join('\n- ')}`);
  }

  const config = parsed as WeaverConfig;
  return {
    defaultLanguage: 'en',
    includeScopes: true,
    groupUnclassified: true,
    typesMap: DEFAULT_TYPES_MAP,
    ...config
  };
}

export function getSectionTitle(
  config: WeaverConfig,
  type: string,
  lang?: string
): string {
  const targetLang = lang || config.defaultLanguage || 'en';
  const customTitle = config.typesMap?.[type]?.[targetLang];
  if (customTitle) {
    return customTitle;
  }

  const defaultTitle = DEFAULT_TYPES_MAP[type]?.[targetLang];
  if (defaultTitle) {
    return defaultTitle;
  }

  const fallbackTitle = config.typesMap?.[type]?.['en'] || DEFAULT_TYPES_MAP[type]?.['en'];
  if (fallbackTitle) {
    return fallbackTitle;
  }

  return type;
}
