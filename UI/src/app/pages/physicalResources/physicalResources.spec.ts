import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhysicalResources } from './physicalResources';

describe('PhysicalResources', () => {
  let component: PhysicalResources;
  let fixture: ComponentFixture<PhysicalResources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhysicalResources]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhysicalResources);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
