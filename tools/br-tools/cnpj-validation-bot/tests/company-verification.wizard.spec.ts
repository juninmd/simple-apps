import { describe, it, expect, beforeEach } from 'vitest';
import { CompanyVerificationWizard } from '../src/wizard/company-verification.wizard.js';
import { InMemorySessionStore } from '../src/wizard/session.store.js';
import { CompanyVerificationState } from '../src/wizard/types.js';

describe('CompanyVerificationWizard', () => {
  let sessionStore: InMemorySessionStore;
  let wizard: CompanyVerificationWizard;
  const userId = 'user_123';

  beforeEach(() => {
    sessionStore = new InMemorySessionStore();
    wizard = new CompanyVerificationWizard(sessionStore);
  });

  it('should start the wizard and prompt "Do you have the CNPJ?"', () => {
    const response = wizard.start(userId);

    expect(response.message).toBe('Do you have the CNPJ?');
    expect(response.options).toEqual(['Yes', 'No']);
    expect(response.state).toBe(CompanyVerificationState.ASK_HAS_CNPJ);
    expect(response.isCompleted).toBe(false);

    const session = sessionStore.getSession(userId);
    expect(session.state).toBe(CompanyVerificationState.ASK_HAS_CNPJ);
  });

  describe('Yes flow (User has CNPJ)', () => {

    it('should transition to ENTER_CNPJ when user answers "Yes"', () => {
      wizard.start(userId);
      const response = wizard.handleInput(userId, 'Yes');

      expect(response.message).toBe('Please enter your CNPJ number:');
      expect(response.state).toBe(CompanyVerificationState.ENTER_CNPJ);
      expect(response.isCompleted).toBe(false);
    });

    it('should accept Portuguese "Sim" for positive response', () => {
      wizard.start(userId);
      const response = wizard.handleInput(userId, 'Sim');

      expect(response.state).toBe(CompanyVerificationState.ENTER_CNPJ);
    });

    it('should prompt again if CNPJ is invalid', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'Yes');
      const response = wizard.handleInput(userId, '12345');

      expect(response.message).toContain('Invalid CNPJ format');
      expect(response.state).toBe(CompanyVerificationState.ENTER_CNPJ);
      expect(response.isCompleted).toBe(false);
    });

    it('should complete verification when valid 14-digit CNPJ is provided', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'Yes');
      const response = wizard.handleInput(userId, '12.345.678/0001-95');

      expect(response.message).toContain('12345678000195');
      expect(response.state).toBe(CompanyVerificationState.COMPLETED);
      expect(response.isCompleted).toBe(true);

      const session = sessionStore.getSession(userId);
      expect(session.data.hasCnpj).toBe(true);
      expect(session.data.cnpj).toBe('12345678000195');
    });
  });

  describe('No flow (User does NOT have CNPJ)', () => {
    it('should transition to ENTER_COMPANY_NAME when user answers "No"', () => {
      wizard.start(userId);
      const response = wizard.handleInput(userId, 'No');

      expect(response.message).toContain('Please enter your company name');
      expect(response.state).toBe(CompanyVerificationState.ENTER_COMPANY_NAME);
      expect(response.isCompleted).toBe(false);
    });

    it('should accept Portuguese "Não" for negative response', () => {
      wizard.start(userId);
      const response = wizard.handleInput(userId, 'Não');

      expect(response.state).toBe(CompanyVerificationState.ENTER_COMPANY_NAME);
    });

    it('should prompt again if company name is too short', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'No');
      const response = wizard.handleInput(userId, 'A');

      expect(response.message).toContain('Please enter a valid company name');
      expect(response.state).toBe(CompanyVerificationState.ENTER_COMPANY_NAME);
    });

    it('should complete verification when valid company name is provided', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'No');
      const response = wizard.handleInput(userId, 'Acme Corp LTDA');

      expect(response.message).toContain('Acme Corp LTDA');
      expect(response.state).toBe(CompanyVerificationState.COMPLETED);
      expect(response.isCompleted).toBe(true);

      const session = sessionStore.getSession(userId);
      expect(session.data.hasCnpj).toBe(false);
      expect(session.data.companyName).toBe('Acme Corp LTDA');
    });
  });

  describe('Edge cases and control commands', () => {
    it('should handle invalid options at ASK_HAS_CNPJ state', () => {
      wizard.start(userId);
      const response = wizard.handleInput(userId, 'maybe');

      expect(response.message).toContain('Invalid input. Do you have the CNPJ?');
      expect(response.options).toEqual(['Yes', 'No']);
      expect(response.state).toBe(CompanyVerificationState.ASK_HAS_CNPJ);
    });

    it('should support /cancel command at any stage', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'Yes');
      const response = wizard.handleInput(userId, '/cancel');

      expect(response.message).toBe('Verification process cancelled.');
      expect(response.state).toBe(CompanyVerificationState.CANCELLED);
    });

    it('should restart flow on /start if already completed', () => {
      wizard.start(userId);
      wizard.handleInput(userId, 'Yes');
      wizard.handleInput(userId, '12345678000195');

      const response = wizard.handleInput(userId, '/start');
      expect(response.state).toBe(CompanyVerificationState.ASK_HAS_CNPJ);
      expect(response.message).toBe('Do you have the CNPJ?');
    });

    it('should isolate sessions between different users', () => {
      const user1 = 'user_1';
      const user2 = 'user_2';

      wizard.start(user1);
      wizard.start(user2);

      wizard.handleInput(user1, 'Yes');
      wizard.handleInput(user2, 'No');

      expect(sessionStore.getSession(user1).state).toBe(CompanyVerificationState.ENTER_CNPJ);
      expect(sessionStore.getSession(user2).state).toBe(CompanyVerificationState.ENTER_COMPANY_NAME);
    });
  });
});
