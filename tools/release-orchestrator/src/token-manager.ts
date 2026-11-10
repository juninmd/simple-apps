export interface TokenManagerOptions {
  tokens: string[];
  initialIndex?: number;
}

export class TokenManager {
  private tokens: string[];
  private currentIndex: number;
  private invalidatedIndices: Set<number> = new Set();

  constructor(options: TokenManagerOptions) {
    if (!options.tokens || options.tokens.length === 0) {
      throw new Error('TokenManager requires at least one token.');
    }
    this.tokens = [...options.tokens];
    this.currentIndex = options.initialIndex ?? 0;
  }

  public getActiveToken(): string {
    if (this.invalidatedIndices.size >= this.tokens.length) {
      throw new Error('All provided authentication tokens have been invalidated or exhausted.');
    }

    // If current token is invalidated, find the next valid token
    if (this.invalidatedIndices.has(this.currentIndex)) {
      this.rotateToken('Current token was previously invalidated.');
    }

    return this.tokens[this.currentIndex];
  }

  public rotateToken(reason?: string): string {
    this.invalidatedIndices.add(this.currentIndex);

    if (this.invalidatedIndices.size >= this.tokens.length) {
      throw new Error(`All tokens exhausted after rotation. Reason: ${reason || 'Auth error'}`);
    }

    // Move to next non-invalidated token
    let nextIndex = (this.currentIndex + 1) % this.tokens.length;
    while (this.invalidatedIndices.has(nextIndex)) {
      nextIndex = (nextIndex + 1) % this.tokens.length;
    }

    this.currentIndex = nextIndex;
    return this.tokens[this.currentIndex];
  }

  public getValidTokenCount(): number {
    return this.tokens.length - this.invalidatedIndices.size;
  }

  public getTotalTokenCount(): number {
    return this.tokens.length;
  }

  public static maskToken(token: string): string {
    if (!token) return '';
    if (token.length <= 8) {
      return '****';
    }
    const prefix = token.substring(0, 4);
    const suffix = token.substring(token.length - 4);
    return `${prefix}....${suffix}`;
  }
}
