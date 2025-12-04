import { TestBed } from '@angular/core/testing';
import { RebalancingService } from '../../services/rebalancing.service';

describe('Rebalancing page basic', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [RebalancingService]
    }).compileComponents();
  });

  it('service should be created', () => {
    const service: RebalancingService = TestBed.inject(RebalancingService);
    expect(service).toBeTruthy();
  });
});
