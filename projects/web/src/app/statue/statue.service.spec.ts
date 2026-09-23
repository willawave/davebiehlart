import { TestBed } from '@angular/core/testing';
import { StatueService } from './statue.service';

describe('StatueService', () => {
  let service: StatueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
