export const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/'
};

export function textToMorse(text: string): string {
  return text.toUpperCase().split('').map(c => MORSE_CODE[c] || '').join(' ').trim();
}

export type MorseEvent = {
  on: boolean;
  duration: number;
};

export function generateMorseEvents(text: string, unit: number = 200): MorseEvent[] {
  const events: MorseEvent[] = [];
  // Remove non-morse characters (except spaces) for safety?
  // Current logic ignores unknown chars inside words, but split handles spaces.
  const words = text.toUpperCase().trim().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const chars = word.split('');

    for (let j = 0; j < chars.length; j++) {
      const char = chars[j];
      const code = MORSE_CODE[char];
      if (!code) continue;

      const symbols = code.split('');
      for (let k = 0; k < symbols.length; k++) {
        const symbol = symbols[k];
        if (symbol === '.') {
          events.push({ on: true, duration: unit });
        } else if (symbol === '-') {
          events.push({ on: true, duration: unit * 3 });
        }

        // Intra-character gap (between dots/dashes)
        if (k < symbols.length - 1) {
           events.push({ on: false, duration: unit });
        }
      }

      // After the last symbol of a character:
      if (j < chars.length - 1) {
         // Inter-character gap: 3 units
         events.push({ on: false, duration: unit * 3 });
      }
    }

    // After the last character of a word:
    if (i < words.length - 1) {
       // Inter-word gap: 7 units.
       events.push({ on: false, duration: unit * 7 });
    } else {
       // End of transmission. Ensure light is off.
       events.push({ on: false, duration: 0 });
    }
  }
  return events;
}
