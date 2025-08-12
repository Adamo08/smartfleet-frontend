import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundRequest } from './refund-request';

describe('RefundRequest', () => {
  let component: RefundRequest;
  let fixture: ComponentFixture<RefundRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
