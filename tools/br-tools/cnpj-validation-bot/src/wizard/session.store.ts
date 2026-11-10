import { WizardSession, CompanyVerificationState } from './types.js';

export interface ISessionStore {
  getSession(userId: string): WizardSession;
  saveSession(session: WizardSession): void;
  clearSession(userId: string): void;
}

export class InMemorySessionStore implements ISessionStore {
  private sessions = new Map<string, WizardSession>();

  getSession(userId: string): WizardSession {
    const session = this.sessions.get(userId);
    if (!session) {
      return {
        userId,
        state: CompanyVerificationState.NOT_STARTED,
        data: {},
        updatedAt: new Date(),
      };
    }
    return session;
  }

  saveSession(session: WizardSession): void {
    this.sessions.set(session.userId, {
      ...session,
      updatedAt: new Date(),
    });
  }

  clearSession(userId: string): void {
    this.sessions.delete(userId);
  }
}
