export type UnitType = 'Length' | 'Weight' | 'Temp' | 'Speed';

/**
 * Converts a value based on the unit type.
 * Currently supports:
 * - Length: Meters to Feet
 * - Weight: Kilograms to Pounds
 * - Temp: Celsius to Fahrenheit
 * - Speed: km/h to mph
 *
 * @param value The numeric value to convert.
 * @param type The category of unit to convert.
 * @returns The converted numeric value.
 */
export const convertValue = (value: number, type: UnitType): number => {
  switch (type) {
    case 'Length':
      return value * 3.28084; // m to ft
    case 'Weight':
      return value * 2.20462; // kg to lbs
    case 'Temp':
      return (value * 9 / 5) + 32; // C to F
    case 'Speed':
      return value * 0.621371; // km/h to mph
    default:
      throw new Error(`Unknown unit type: ${type}`);
  }
};

/**
 * Returns the label for the unit.
 * @param type The unit category.
 * @param isSource If true, returns the source unit label (e.g., 'm'), else the destination label (e.g., 'ft').
 * @returns The string label.
 */
export const getUnitLabel = (type: UnitType, isSource: boolean): string => {
  switch (type) {
    case 'Length': return isSource ? 'm' : 'ft';
    case 'Weight': return isSource ? 'kg' : 'lbs';
    case 'Temp': return isSource ? '°C' : '°F';
    case 'Speed': return isSource ? 'km/h' : 'mph';
    default: return '';
  }
};

/**
 * Formats the conversion result into a string.
 * Format: "value srcUnit = convertedValue destUnit"
 * @param value The input value.
 * @param type The unit category.
 * @returns The formatted string.
 */
export const formatConversion = (value: number, type: UnitType): string => {
  const converted = convertValue(value, type);
  const fixed = converted.toFixed(2);
  const srcLabel = getUnitLabel(type, true);
  const destLabel = getUnitLabel(type, false);

  return `${value} ${srcLabel} = ${fixed} ${destLabel}`;
};
