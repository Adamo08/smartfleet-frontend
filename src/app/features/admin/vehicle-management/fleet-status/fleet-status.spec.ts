import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FleetStatus } from './fleet-status';

describe('FleetStatus', () => {
  let component: FleetStatus;
  let fixture: ComponentFixture<FleetStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FleetStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FleetStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
