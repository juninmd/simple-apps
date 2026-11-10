import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  validateWeaverConfig,
  loadWeaverConfig,
  getSectionTitle,
  DEFAULT_TYPES_MAP
} from '../src/weaver-config.js';
import { WeaverConfig } from '../src/types.js';

describe('Weaver Configuration Module', () => {
  describe('validateWeaverConfig', () => {
    it('should validate a valid conventional-commits configuration', () => {
      const config: WeaverConfig = {
        strategy: 'conventional-commits',
        defaultLanguage: 'pt-BR',
        includeScopes: true,
        groupUnclassified: false
      };

      const result = validateWeaverConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid custom-regex configuration', () => {
      const config: WeaverConfig = {
        strategy: 'custom-regex',
        customRegex: {
          pattern: '^\\[(?<type>\\w+)\\](?:\\((?<scope>[^\\)]+)\\))?: (?<description>.+)$',
          captureGroups: {
            type: 'type',
            scope: 'scope',
            description: 'description'
          }
        }
      };

      const result = validateWeaverConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject custom-regex strategy if customRegex object is missing', () => {
      const config = {
        strategy: 'custom-regex'
      };

      const result = validateWeaverConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject configuration with invalid strategy', () => {
      const config = {
        strategy: 'invalid-strategy'
      };

      const result = validateWeaverConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject configuration with invalid RegExp pattern in customRegex', () => {
      const config = {
        strategy: 'custom-regex',
        customRegex: {
          pattern: '[unclosed-group',
          captureGroups: {
            type: '1',
            description: '2'
          }
        }
      };

      const result = validateWeaverConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid customRegex.pattern RegExp');
    });
  });

  describe('loadWeaverConfig', () => {
    it('should load and apply defaults from a valid JSON file', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weaver-test-'));
      const configPath = path.join(tempDir, 'weaver.json');

      const configData = {
        strategy: 'conventional-commits',
        defaultLanguage: 'pt-BR'
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const loaded = loadWeaverConfig(configPath);
      expect(loaded.strategy).toBe('conventional-commits');
      expect(loaded.defaultLanguage).toBe('pt-BR');
      expect(loaded.includeScopes).toBe(true);
      expect(loaded.groupUnclassified).toBe(true);
      expect(loaded.typesMap).toEqual(DEFAULT_TYPES_MAP);

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should throw error when file does not exist', () => {
      expect(() => loadWeaverConfig('/non/existent/path/weaver.json')).toThrow(
        /Configuration file not found/
      );
    });

    it('should throw error when file contains invalid JSON', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weaver-test-'));
      const configPath = path.join(tempDir, 'weaver.json');

      fs.writeFileSync(configPath, '{ invalid json }');

      expect(() => loadWeaverConfig(configPath)).toThrow(
        /Failed to parse configuration JSON/
      );

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should throw error when file content fails schema validation', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weaver-test-'));
      const configPath = path.join(tempDir, 'weaver.json');

      fs.writeFileSync(configPath, JSON.stringify({ strategy: 'unknown' }));

      expect(() => loadWeaverConfig(configPath)).toThrow(
        /Invalid Weaver configuration/
      );

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('getSectionTitle', () => {
    it('should resolve default language section titles', () => {
      const config: WeaverConfig = {
        strategy: 'conventional-commits',
        defaultLanguage: 'en',
        typesMap: DEFAULT_TYPES_MAP
      };

      expect(getSectionTitle(config, 'feat')).toBe('Features');
      expect(getSectionTitle(config, 'fix')).toBe('Bug Fixes');
    });

    it('should resolve multi-language section titles based on defaultLanguage or param', () => {
      const config: WeaverConfig = {
        strategy: 'conventional-commits',
        defaultLanguage: 'pt-BR',
        typesMap: DEFAULT_TYPES_MAP
      };

      expect(getSectionTitle(config, 'feat')).toBe('Recursos');
      expect(getSectionTitle(config, 'fix')).toBe('Correções de Bugs');
      expect(getSectionTitle(config, 'feat', 'es')).toBe('Características');
    });

    it('should respect custom typesMap overrides', () => {
      const config: WeaverConfig = {
        strategy: 'conventional-commits',
        defaultLanguage: 'en',
        typesMap: {
          feat: {
            en: 'New Features',
            'pt-BR': 'Novas Funcionalidades'
          },
          security: {
            en: 'Security Fixes',
            'pt-BR': 'Correções de Segurança'
          }
        }
      };

      expect(getSectionTitle(config, 'feat')).toBe('New Features');
      expect(getSectionTitle(config, 'feat', 'pt-BR')).toBe('Novas Funcionalidades');
      expect(getSectionTitle(config, 'security')).toBe('Security Fixes');
      expect(getSectionTitle(config, 'fix')).toBe('Bug Fixes');
    });

    it('should fallback gracefully for unknown types', () => {
      const config: WeaverConfig = {
        strategy: 'conventional-commits',
        defaultLanguage: 'en'
      };

      expect(getSectionTitle(config, 'custom-type')).toBe('custom-type');
    });
  });
});
