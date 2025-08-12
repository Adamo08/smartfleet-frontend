import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotSelector } from './slot-selector';

describe('SlotSelector', () => {
  let component: SlotSelector;
  let fixture: ComponentFixture<SlotSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlotSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
