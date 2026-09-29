import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaFormValue } from '../media.service';
import { MediaForm } from './media-form';

const VIDEO = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const VALID: MediaFormValue = {
  date: new Date('2026-09-12T05:00:00Z'),
  description: 'A studio visit.',
  link: 'https://example.test/story',
  title: 'In the Studio',
  visible: true,
};

describe('MediaForm', () => {
  let fixture: ComponentFixture<MediaForm>;
  let element: HTMLElement;
  const saved = vi.fn();

  async function create(initial?: MediaFormValue, otherLinks: string[] = []) {
    fixture = TestBed.createComponent(MediaForm);
    fixture.componentRef.setInput('initial', initial);
    fixture.componentRef.setInput('otherLinks', otherLinks);
    fixture.componentInstance.saved.subscribe(saved);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  const link = () => {
    const found = element.querySelector<HTMLInputElement>('input[type="url"]');
    if (!found) throw new Error('no link input');
    return found;
  };
  const preview = () => element.querySelector('.preview');

  async function type(target: HTMLInputElement, value: string) {
    target.value = value;
    target.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit() {
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('should refuse to save an empty item and say what is missing', async () => {
    await create();
    await submit();

    expect(saved).not.toHaveBeenCalled();
    const text = element.textContent ?? '';
    expect(text).toContain('Enter the link.');
    expect(text).toContain('Enter a title.');
    expect(text).toContain('Enter a description.');
  });

  it.each([
    ['news-site.com/story', 'Enter one full web address, starting with https://.'],
    ['javascript:alert(1)', 'Enter a web address starting with https://.'],
    ['http://localhost:4200/media', 'Enter a public web address'],
    ['https://www.youtube.com/@davebiehl', "That YouTube link isn't a single video."],
  ])('should refuse %s', async (value, message) => {
    await create(VALID);
    await type(link(), value);
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain(message);
    expect(preview()?.textContent?.trim()).toBe('');
  });

  it('should refuse a link another item already has, in any form', async () => {
    await create(VALID, [VIDEO]);
    await type(link(), 'https://youtu.be/dQw4w9WgXcQ?t=42');
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('This link is already on the Media page.');
  });

  it('should preview a video as it will be saved', async () => {
    await create(VALID);
    await type(link(), 'https://youtu.be/dQw4w9WgXcQ?t=42');

    expect(preview()?.textContent).toContain('YouTube video.');
    expect(preview()?.textContent).toContain(VIDEO);
    expect(preview()?.querySelector('img')?.getAttribute('src')).toContain(
      'i.ytimg.com/vi/dQw4w9WgXcQ/',
    );
    const open = preview()?.querySelector('a');
    expect(open?.getAttribute('href')).toBe(VIDEO);
    expect(open?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should preview an article with its site', async () => {
    await create(VALID);
    await type(link(), 'https://www.startribune.com/story/1');
    expect(preview()?.textContent).toContain('Article on startribune.com.');
    expect(preview()?.querySelector('a')?.getAttribute('href')).toBe(
      'https://www.startribune.com/story/1',
    );
  });

  it('should save a complete item as typed; the service makes the link canonical', async () => {
    await create(VALID);
    await submit();
    expect(saved).toHaveBeenLastCalledWith(VALID);

    await type(link(), 'https://youtu.be/dQw4w9WgXcQ');
    await submit();
    expect(saved).toHaveBeenLastCalledWith({ ...VALID, link: 'https://youtu.be/dQw4w9WgXcQ' });
  });

  it('should lock every field while a save is running', async () => {
    await create(VALID);
    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();

    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input[matInput]'));
    expect(inputs.length).toBe(3);
    expect(inputs.every((field) => field.disabled)).toBe(true);
    expect(element.querySelector('textarea')?.disabled).toBe(true);
    expect(
      Array.from(element.querySelectorAll<HTMLButtonElement>('button')).every((b) => b.disabled),
    ).toBe(true);
  });

  it('should mark the required fields', async () => {
    await create();
    // Link, title, description, date.
    expect(element.querySelectorAll('.mat-mdc-form-field-required-marker').length).toBe(4);
  });
});
