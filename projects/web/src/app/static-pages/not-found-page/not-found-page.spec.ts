import { RESPONSE_INIT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  let component: NotFoundPage;
  let fixture: ComponentFixture<NotFoundPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set a 404 status when server-rendered', () => {
    const responseInit: ResponseInit = {};
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NotFoundPage],
      providers: [{ provide: RESPONSE_INIT, useValue: responseInit }],
    });
    TestBed.createComponent(NotFoundPage);
    expect(responseInit.status).toBe(404);
  });
});
