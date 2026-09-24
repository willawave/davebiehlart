import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  it('should start with no user and loading until the auth state is known', () => {
    expect(store.authorizedUser()).toBeNull();
    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();
  });
});
