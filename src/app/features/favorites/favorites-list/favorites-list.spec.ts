import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesList } from './favorites-list';

describe('FavoritesList', () => {
  let component: FavoritesList;
  let fixture: ComponentFixture<FavoritesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
