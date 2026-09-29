import { TestBed } from '@angular/core/testing';
import { ScheduleDocument, ScheduleFormModel } from 'core';
import { ScheduleService, toScheduleDocument } from './schedule.service';
import { ScheduleStore } from './schedule.store';

const value = new ScheduleFormModel().scheduleForm();
const saved: ScheduleDocument = { ...toScheduleDocument(value), id: 'prod-id' };

describe('ScheduleStore', () => {
  let store: InstanceType<typeof ScheduleStore>;
  const service = {
    get: vi.fn((): Promise<ScheduleDocument | null> => Promise.resolve(saved)),
    save: vi.fn((id: string | null) => Promise.resolve(id ?? 'weekly')),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: ScheduleService, useValue: service }],
    });
    store = TestBed.inject(ScheduleStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.schedule()).toBeNull();
    expect(store.formValue()).toBeUndefined();
    expect(store.loaded()).toBe(false);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load the schedule and expose it as a form value', async () => {
    const loading = store.load();
    expect(store.loading()).toBe(true);
    await expect(loading).resolves.toBe(true);
    expect(store.schedule()?.id).toBe('prod-id');
    expect(store.formValue()).toEqual(value);
    expect(store.loaded()).toBe(true);
  });

  it('should report a failed load', async () => {
    service.get.mockRejectedValueOnce(new Error('offline'));
    await expect(store.load()).resolves.toBe(false);
    expect(store.loaded()).toBe(false);
    expect(store.error()).toMatch(/could not be loaded/);
  });

  it('should update the loaded schedule by its ID', async () => {
    await store.load();
    const edited = { ...value, specialMessage: 'Closed today' };
    await expect(store.save(edited)).resolves.toBe(true);
    expect(service.save).toHaveBeenCalledWith('prod-id', edited);
    expect(store.schedule()?.specialMessage).toBe('Closed today');
  });

  it('should write the first schedule when none exists, then update it', async () => {
    service.get.mockResolvedValueOnce(null);
    await store.load();
    expect(store.loaded()).toBe(true);
    await store.save(value);
    expect(service.save).toHaveBeenLastCalledWith(null, value);
    expect(store.schedule()?.id).toBe('weekly');
    await store.save(value);
    expect(service.save).toHaveBeenLastCalledWith('weekly', value);
  });

  it('should report a failed save and keep the saved schedule', async () => {
    await store.load();
    service.save.mockRejectedValueOnce(new Error('denied'));
    await expect(store.save({ ...value, specialMessage: 'x' })).resolves.toBe(false);
    expect(store.error()).toMatch(/could not be saved/);
    expect(store.schedule()?.specialMessage).toBeNull();
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
