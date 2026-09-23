import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';
import { eventDetailResolver } from './event-detail-resolver';

describe('eventDetailResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => eventDetailResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
