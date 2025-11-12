import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VesselVisitNotification } from './vesselVisitNotification';

describe('VesselVisitNotification', () => {
  let component: VesselVisitNotification;
  let fixture: ComponentFixture<VesselVisitNotification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VesselVisitNotification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VesselVisitNotification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
