import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageArea } from './storageArea';

describe('StorageArea', () => {
  let component: StorageArea;
  let fixture: ComponentFixture<StorageArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageArea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageArea);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
