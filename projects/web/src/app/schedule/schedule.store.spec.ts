import { PendingTasks } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScheduleDocument } from 'core';
import { ScheduleService } from './schedule.service';
import { ScheduleStore } from './schedule.store';
import { studioSchedule } from './schedule.testing';

type Result = ScheduleDocument | null | Promise<ScheduleDocument | null>;

describe('ScheduleStore', () => {
  let store: InstanceType<typeof ScheduleStore>;
  const service = { getSchedule: vi.fn<() => Result>() };
  const done = vi.fn();
  const pendingTasks = { add: vi.fn(() => done) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ScheduleService, useValue: service },
        { provide: PendingTasks, useValue: pendingTasks },
      ],
    });
    store = TestBed.inject(ScheduleStore);
  });

  it('should start empty, idle, and without an error', () => {
    expect(store.schedule()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should apply a transfer-state hit synchronously, without a pending task', () => {
    const schedule = studioSchedule();
    service.getSchedule.mockReturnValue(schedule);

    void store.loadSchedule();

    expect(store.schedule()).toBe(schedule);
    expect(pendingTasks.add).not.toHaveBeenCalled();
  });

  it('should load from Firestore under a pending task', async () => {
    const schedule = studioSchedule();
    service.getSchedule.mockReturnValue(Promise.resolve(schedule));

    const loading = store.loadSchedule();
    expect(store.loading()).toBe(true);
    await loading;

    expect(store.schedule()).toBe(schedule);
    expect(store.loading()).toBe(false);
    expect(done).toHaveBeenCalledOnce();
  });

  it('should report a failed load', async () => {
    service.getSchedule.mockReturnValue(Promise.reject(new Error('offline')));

    await store.loadSchedule();

    expect(store.schedule()).toBeNull();
    expect(store.error()).toMatch(/could not be loaded/);
    expect(done).toHaveBeenCalledOnce();
  });

  it('should ignore a load that a newer one replaced', async () => {
    let resolveOld!: (value: ScheduleDocument) => void;
    service.getSchedule.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)));
    const old = store.loadSchedule();
    const fresh = studioSchedule({ specialMessage: 'fresh' });
    service.getSchedule.mockReturnValueOnce(Promise.resolve(fresh));
    await store.loadSchedule();

    resolveOld(studioSchedule({ specialMessage: 'stale' }));
    await old;

    expect(store.schedule()).toBe(fresh);
  });
});
