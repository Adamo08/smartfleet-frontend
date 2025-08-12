import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBulkUpload } from './vehicle-bulk-upload';

describe('VehicleBulkUpload', () => {
  let component: VehicleBulkUpload;
  let fixture: ComponentFixture<VehicleBulkUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleBulkUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleBulkUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
