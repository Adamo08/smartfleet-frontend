import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Broadcast } from './broadcast';

describe('Broadcast', () => {
  let component: Broadcast;
  let fixture: ComponentFixture<Broadcast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Broadcast]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Broadcast);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
