import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigrmDialog } from './configrm-dialog';

describe('ConfigrmDialog', () => {
  let component: ConfigrmDialog;
  let fixture: ComponentFixture<ConfigrmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigrmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigrmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
