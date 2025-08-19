import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundDetail } from './refund-detail';

describe('RefundDetail', () => {
  let component: RefundDetail;
  let fixture: ComponentFixture<RefundDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
