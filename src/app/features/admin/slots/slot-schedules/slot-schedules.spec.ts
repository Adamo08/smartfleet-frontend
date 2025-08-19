import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotSchedules } from './slot-schedules';

describe('SlotSchedules', () => {
  let component: SlotSchedules;
  let fixture: ComponentFixture<SlotSchedules>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotSchedules]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotSchedules);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
