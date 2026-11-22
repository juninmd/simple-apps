import { textToMorse, generateMorseEvents, transmissionProblem } from '../morse';

describe('Morse Utility', () => {
  it('converts text to morse string', () => {
    expect(textToMorse('SOS')).toBe('... --- ...');
    // textToMorse implementation: split('').map(...).join(' ')
    // 'A B' -> 'A', ' ', 'B'
    // 'A' -> '.-'
    // ' ' -> '/' (from MORSE_CODE map)
    // 'B' -> '-...'
    // Result: '.- / -...'
    expect(textToMorse('A B')).toBe('.- / -...');
  });

  it('handles lower case', () => {
    expect(textToMorse('sos')).toBe('... --- ...');
  });

  it('generates correct timing events for "E" (dot)', () => {
    const events = generateMorseEvents('E', 100);
    // E is '.'
    // ON 100
    // End: OFF 0
    expect(events).toEqual([
      { on: true, duration: 100 },
      { on: false, duration: 0 }
    ]);
  });

  it('generates correct timing events for "T" (dash)', () => {
    const events = generateMorseEvents('T', 100);
    // T is '-'
    // ON 300
    // End: OFF 0
    expect(events).toEqual([
      { on: true, duration: 300 },
      { on: false, duration: 0 }
    ]);
  });

  it('generates correct timing events for "A" (dot dash)', () => {
    const events = generateMorseEvents('A', 100);
    // A is '.-'
    // dot: ON 100
    // intra: OFF 100
    // dash: ON 300
    // End: OFF 0
    expect(events).toEqual([
      { on: true, duration: 100 },
      { on: false, duration: 100 },
      { on: true, duration: 300 },
      { on: false, duration: 0 }
    ]);
  });

  it('generates correct timing events for "EE" (two letters)', () => {
    const events = generateMorseEvents('EE', 100);
    // E: ON 100
    // Inter-char: OFF 300
    // E: ON 100
    // End: OFF 0
    expect(events).toEqual([
      { on: true, duration: 100 },
      { on: false, duration: 300 },
      { on: true, duration: 100 },
      { on: false, duration: 0 }
    ]);
  });

  it('generates correct timing events for "E E" (two words)', () => {
    const events = generateMorseEvents('E E', 100);
    // E: ON 100
    // Inter-word: OFF 700
    // E: ON 100
    // End: OFF 0
    expect(events).toEqual([
      { on: true, duration: 100 },
      { on: false, duration: 700 },
      { on: true, duration: 100 },
      { on: false, duration: 0 }
    ]);
  });
});

describe('transmissionProblem', () => {
  it('refuses text with no transmittable character instead of reporting success', () => {
    // '¿¡' produced only the closing off-event, and the app said "Message sent successfully."
    expect(generateMorseEvents('¿¡').some(e => e.on)).toBe(false);
    expect(transmissionProblem('¿¡')).toMatch(/No transmittable/);
  });

  it('asks for text when the input is blank', () => {
    expect(transmissionProblem('   ')).toMatch(/enter some text/);
  });

  it('accepts text with at least one known character', () => {
    expect(transmissionProblem('¿sos')).toBeNull();
  });
});
