import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleSearch } from './vehicle-search';

describe('VehicleSearch', () => {
  let component: VehicleSearch;
  let fixture: ComponentFixture<VehicleSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
