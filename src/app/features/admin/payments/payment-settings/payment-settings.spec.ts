import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentSettings } from './payment-settings';

describe('PaymentSettings', () => {
  let component: PaymentSettings;
  let fixture: ComponentFixture<PaymentSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
