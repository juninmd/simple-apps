import { ISessionStore, InMemorySessionStore } from './session.store.js';
import { CompanyVerificationState, WizardResponse, WizardSession } from './types.js';

export class CompanyVerificationWizard {
  private sessionStore: ISessionStore;

  constructor(sessionStore: ISessionStore = new InMemorySessionStore()) {
    this.sessionStore = sessionStore;
  }

  public start(userId: string): WizardResponse {
    const session: WizardSession = {
      userId,
      state: CompanyVerificationState.ASK_HAS_CNPJ,
      data: {},
      updatedAt: new Date(),
    };
    this.sessionStore.saveSession(session);

    return {
      message: 'Do you have the CNPJ?',
      options: ['Yes', 'No'],
      state: CompanyVerificationState.ASK_HAS_CNPJ,
      isCompleted: false,
    };
  }

  public handleInput(userId: string, input: string): WizardResponse {
    const trimmedInput = input.trim();
    const session = this.sessionStore.getSession(userId);

    if (trimmedInput.toLowerCase() === '/cancel') {
      session.state = CompanyVerificationState.CANCELLED;
      this.sessionStore.saveSession(session);
      return {
        message: 'Verification process cancelled.',
        state: CompanyVerificationState.CANCELLED,
        isCompleted: false,
      };
    }

    if (
      session.state === CompanyVerificationState.NOT_STARTED ||
      trimmedInput.toLowerCase() === '/start' ||
      trimmedInput.toLowerCase() === 'verify'
    ) {
      return this.start(userId);
    }

    switch (session.state) {
      case CompanyVerificationState.ASK_HAS_CNPJ:
        return this.handleAskHasCnpj(session, trimmedInput);

      case CompanyVerificationState.ENTER_CNPJ:
        return this.handleEnterCnpj(session, trimmedInput);

      case CompanyVerificationState.ENTER_COMPANY_NAME:
        return this.handleEnterCompanyName(session, trimmedInput);

      case CompanyVerificationState.COMPLETED:
        return {
          message: 'Company verification is already completed. Send /start to begin a new verification.',
          state: CompanyVerificationState.COMPLETED,
          isCompleted: true,
        };

      case CompanyVerificationState.CANCELLED:
        return this.start(userId);

      default:
        return this.start(userId);
    }
  }

  private handleAskHasCnpj(session: WizardSession, input: string): WizardResponse {
    const normalized = input.toLowerCase();
    const positiveAnswers = ['yes', 'sim', 'y', 's', '1', 'true'];
    const negativeAnswers = ['no', 'não', 'nao', 'n', '2', 'false'];

    if (positiveAnswers.includes(normalized)) {
      session.state = CompanyVerificationState.ENTER_CNPJ;
      session.data.hasCnpj = true;
      this.sessionStore.saveSession(session);

      return {
        message: 'Please enter your CNPJ number:',
        state: CompanyVerificationState.ENTER_CNPJ,
        isCompleted: false,
      };
    }

    if (negativeAnswers.includes(normalized)) {
      session.state = CompanyVerificationState.ENTER_COMPANY_NAME;
      session.data.hasCnpj = false;
      this.sessionStore.saveSession(session);

      return {
        message: 'Please enter your company name to proceed with verification:',
        state: CompanyVerificationState.ENTER_COMPANY_NAME,
        isCompleted: false,
      };
    }

    return {
      message: 'Invalid input. Do you have the CNPJ?',
      options: ['Yes', 'No'],
      state: CompanyVerificationState.ASK_HAS_CNPJ,
      isCompleted: false,
    };
  }

  private handleEnterCnpj(session: WizardSession, input: string): WizardResponse {
    const cleanCnpj = input.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return {
        message: 'Invalid CNPJ format. Please enter a valid 14-digit CNPJ number:',
        state: CompanyVerificationState.ENTER_CNPJ,
        isCompleted: false,
      };
    }

    session.data.cnpj = cleanCnpj;
    session.state = CompanyVerificationState.COMPLETED;
    this.sessionStore.saveSession(session);

    return {
      message: `CNPJ ${cleanCnpj} recorded. Company verification completed successfully!`,
      state: CompanyVerificationState.COMPLETED,
      isCompleted: true,
    };
  }

  private handleEnterCompanyName(session: WizardSession, input: string): WizardResponse {
    if (input.length < 2) {
      return {
        message: 'Please enter a valid company name (at least 2 characters):',
        state: CompanyVerificationState.ENTER_COMPANY_NAME,
        isCompleted: false,
      };
    }

    session.data.companyName = input;
    session.state = CompanyVerificationState.COMPLETED;
    this.sessionStore.saveSession(session);

    return {
      message: `Company name "${input}" recorded. Company verification completed successfully!`,
      state: CompanyVerificationState.COMPLETED,
      isCompleted: true,
    };
  }
}
