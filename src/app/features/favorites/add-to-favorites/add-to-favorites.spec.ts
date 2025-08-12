import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToFavorites } from './add-to-favorites';

describe('AddToFavorites', () => {
  let component: AddToFavorites;
  let fixture: ComponentFixture<AddToFavorites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToFavorites]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddToFavorites);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
