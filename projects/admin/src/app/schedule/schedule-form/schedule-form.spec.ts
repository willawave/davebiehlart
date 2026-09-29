import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleFormModel } from 'core';
import { ScheduleFormValue, toScheduleDocument } from '../schedule.service';
import { ScheduleForm } from './schedule-form';

describe('ScheduleForm', () => {
  let fixture: ComponentFixture<ScheduleForm>;
  let element: HTMLElement;
  const saved = vi.fn();
  const defaults = () => new ScheduleFormModel().scheduleForm();
  // Signal Forms tags array items with a tracking key; the saved document is what matters.
  const savedDocument = () => {
    expect(saved).toHaveBeenCalledOnce();
    return toScheduleDocument(saved.mock.calls[0][0]);
  };

  async function create(initial?: ScheduleFormValue) {
    fixture = TestBed.createComponent(ScheduleForm);
    fixture.componentRef.setInput('initial', initial);
    fixture.componentInstance.saved.subscribe(saved);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  const input = (label: string) => {
    const found = element.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
    if (!found) throw new Error(`no input ${label}`);
    return found;
  };

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

  it('should list the week Monday first', async () => {
    await create();
    const days = [...element.querySelectorAll('tbody th')].map((th) => th.textContent?.trim());
    expect(days).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
  });

  it('should save the default hours for a first schedule', async () => {
    await create();
    await submit();
    expect(savedDocument()).toEqual(toScheduleDocument(defaults()));
  });

  it('should save edited hours and message', async () => {
    await create(defaults());
    await type(input('Sunday opens'), '12:00');
    await type(input('Sunday closes'), '16:00');
    await type(element.querySelector<HTMLInputElement>('input:not([type])')!, 'Closed Monday');
    await submit();

    const value = saved.mock.calls[0][0] as ScheduleFormValue;
    expect(value.days[6]).toMatchObject({ open: '12:00', close: '16:00', isClosed: false });
    expect(value.specialMessage).toBe('Closed Monday');
  });

  it('should refuse a closing time before the opening time', async () => {
    await create(defaults());
    await type(input('Friday closes'), '05:00');
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Closing time must be after opening time.');
  });

  it('should refuse an open day without times', async () => {
    await create(defaults());
    await type(input('Monday opens'), '');
    await submit();

    expect(saved).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter the opening time.');
  });

  it('should lock and skip the times of a closed day', async () => {
    const initial = defaults();
    initial.days[6] = { open: '', close: '', isClosed: true };
    await create(initial);

    expect(input('Sunday opens').disabled).toBe(true);
    expect(input('Sunday closes').disabled).toBe(true);
    expect(input('Monday opens').disabled).toBe(false);
    await submit();
    expect(savedDocument()).toEqual(toScheduleDocument(initial));
  });

  it('should lock every field while saving', async () => {
    await create(defaults());
    fixture.componentRef.setInput('saving', true);
    await fixture.whenStable();

    expect(input('Monday opens').disabled).toBe(true);
    expect(element.querySelector('button[type="submit"]')?.textContent).toContain('Saving…');
  });
});
