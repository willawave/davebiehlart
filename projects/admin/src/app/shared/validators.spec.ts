import { between, notBlank, positive } from './validators';

const check = <T>(validator: (field: { value: () => T }) => unknown, value: T) =>
  validator({ value: () => value });

describe('validators', () => {
  it('positive should accept empty or above zero', () => {
    const rule = positive('Too small.');
    expect(check(rule, null)).toBeNull();
    expect(check(rule, 0.5)).toBeNull();
    expect(check(rule, 0)).toEqual({ kind: 'positive', message: 'Too small.' });
  });

  it('notBlank should reject spaces alone', () => {
    const rule = notBlank('Enter it.');
    expect(check(rule, ' x ')).toBeNull();
    expect(check(rule, ' \n ')).toEqual({ kind: 'required', message: 'Enter it.' });
  });

  it('between should accept the ends of the range and leave empty to required()', () => {
    const rule = between(-90, 90, 'Out of range.');
    expect(check(rule, null)).toBeNull();
    expect(check(rule, -90)).toBeNull();
    expect(check(rule, 90)).toBeNull();
    expect(check(rule, 90.1)).toEqual({ kind: 'range', message: 'Out of range.' });
  });
});
