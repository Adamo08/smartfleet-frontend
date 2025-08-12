import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleUtilization } from './vehicle-utilization';

describe('VehicleUtilization', () => {
  let component: VehicleUtilization;
  let fixture: ComponentFixture<VehicleUtilization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleUtilization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleUtilization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
