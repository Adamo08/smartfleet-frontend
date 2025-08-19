import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetail } from './transaction-detail';

describe('TransactionDetail', () => {
  let component: TransactionDetail;
  let fixture: ComponentFixture<TransactionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
