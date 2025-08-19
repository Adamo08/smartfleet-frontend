import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotDetail } from './slot-detail';

describe('SlotDetail', () => {
  let component: SlotDetail;
  let fixture: ComponentFixture<SlotDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
