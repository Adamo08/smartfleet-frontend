import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationAssign } from './reservation-assign';

describe('ReservationAssign', () => {
  let component: ReservationAssign;
  let fixture: ComponentFixture<ReservationAssign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationAssign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationAssign);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
