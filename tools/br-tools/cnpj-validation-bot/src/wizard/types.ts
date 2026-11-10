export enum CompanyVerificationState {
  NOT_STARTED = 'NOT_STARTED',
  ASK_HAS_CNPJ = 'ASK_HAS_CNPJ',
  ENTER_CNPJ = 'ENTER_CNPJ',
  ENTER_COMPANY_NAME = 'ENTER_COMPANY_NAME',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface WizardSession {
  userId: string;
  state: CompanyVerificationState;
  data: {
    hasCnpj?: boolean;
    cnpj?: string;
    companyName?: string;
  };
  updatedAt: Date;
}

export interface WizardResponse {
  message: string;
  options?: string[];
  state: CompanyVerificationState;
  isCompleted: boolean;
}
