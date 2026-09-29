// Signal Forms validators shared by the admin forms. Each returns null when the value is fine.

export function positive(message: string) {
  return ({ value }: { value: () => number | null }) => {
    const current = value();
    return current === null || current > 0 ? null : { kind: 'positive', message };
  };
}

// Values are saved trimmed, so spaces alone count as missing.
export function notBlank(message: string) {
  return ({ value }: { value: () => string }) =>
    value().trim() ? null : { kind: 'required', message };
}

// A number from min to max inclusive. A cleared input (null) is left to required().
export function between(min: number, max: number, message: string) {
  return ({ value }: { value: () => number | null }) => {
    const current = value();
    return current === null || (current >= min && current <= max)
      ? null
      : { kind: 'range', message };
  };
}
