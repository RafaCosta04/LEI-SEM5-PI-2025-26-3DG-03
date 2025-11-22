import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SystemUser } from './systemUser';

describe('SystemUser', () => {
  let component: SystemUser;
  let fixture: ComponentFixture<SystemUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SystemUser] }).compileComponents();
    fixture = TestBed.createComponent(SystemUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
