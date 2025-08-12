import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleGallery } from './vehicle-gallery';

describe('VehicleGallery', () => {
  let component: VehicleGallery;
  let fixture: ComponentFixture<VehicleGallery>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleGallery]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleGallery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
