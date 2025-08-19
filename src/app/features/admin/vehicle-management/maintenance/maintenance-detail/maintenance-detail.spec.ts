import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceDetail } from './maintenance-detail';

describe('MaintenanceDetail', () => {
  let component: MaintenanceDetail;
  let fixture: ComponentFixture<MaintenanceDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
