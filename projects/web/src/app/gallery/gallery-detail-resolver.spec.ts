import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';
import { galleryDetailResolver } from './gallery-detail-resolver';

describe('galleryDetailResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => galleryDetailResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
