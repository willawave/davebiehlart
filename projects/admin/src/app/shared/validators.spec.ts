import { between, httpUrl, mediaLink, notBlank, positive, uniqueMediaLink } from './validators';

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

  it('httpUrl should accept blank or a full http(s) address', () => {
    const rule = httpUrl('Enter a web address.');
    const failure = { kind: 'url', message: 'Enter a web address.' };
    expect(check(rule, ' ')).toBeNull();
    expect(check(rule, 'https://example.test/tickets')).toBeNull();
    expect(check(rule, ' http://example.test ')).toBeNull();
    expect(check(rule, 'example.test')).toEqual(failure);
    expect(check(rule, 'javascript:alert(1)')).toEqual(failure);
  });

  it('mediaLink should accept a video or an article and explain anything else', () => {
    const rule = mediaLink();
    expect(check(rule, 'https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(check(rule, 'https://example.com/story')).toBeNull();
    expect(check(rule, 'example.com/story')).toEqual({
      kind: 'mediaLink',
      message: 'Enter one full web address, starting with https://.',
    });
    expect(check(rule, 'https://www.youtube.com/@davebiehl')).toEqual({
      kind: 'mediaLink',
      message:
        "That YouTube link isn't a single video. Open the video and copy its address from Share.",
    });
  });

  it('uniqueMediaLink should match links as saved, so any form of a video counts', () => {
    const rule = uniqueMediaLink(
      () => ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://example.com/a'],
      'Taken.',
    );
    const taken = { kind: 'duplicate', message: 'Taken.' };
    expect(check(rule, 'https://youtu.be/dQw4w9WgXcQ?t=5')).toEqual(taken);
    expect(check(rule, ' https://example.com/a ')).toEqual(taken);
    expect(check(rule, 'https://example.com/b')).toBeNull();
    // An invalid link is left to mediaLink().
    expect(check(rule, 'nonsense')).toBeNull();
  });

  it('between should accept the ends of the range and leave empty to required()', () => {
    const rule = between(-90, 90, 'Out of range.');
    expect(check(rule, null)).toBeNull();
    expect(check(rule, -90)).toBeNull();
    expect(check(rule, 90)).toBeNull();
    expect(check(rule, 90.1)).toEqual({ kind: 'range', message: 'Out of range.' });
  });
});
