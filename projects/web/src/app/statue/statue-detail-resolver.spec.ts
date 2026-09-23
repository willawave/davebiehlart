import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';
import { statueDetailResolver } from './statue-detail-resolver';

describe('statueDetailResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => statueDetailResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
