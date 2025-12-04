import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import {
  VesselVisitNotificationModel,
  CargoType,
  VisitStatus,
  CrewRank,
  ManifestType,
} from '../../models/vesselVisitNotification.model';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleModel, ScheduleEntryModel } from '../../models/schedule.model';


@Component({
  selector: 'app-rebalancing',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './rebalancing.html',
  styleUrl: './rebalancing.css',
})
export class Rebalancing implements OnInit, OnDestroy {
  isLoading: boolean = false;
  // reuse some schedule fields for filtering and display
  CargoType = CargoType;
  VisitStatus = VisitStatus;
  CrewRank = CrewRank;
  ManifestType = ManifestType;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  vesselVisitNotifications: VesselVisitNotificationModel[] = [];
  filteredNotifications: VesselVisitNotificationModel[] = [];

  searchTerm: string = '';
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private statusTimeout: any = null;

  // Rebalancing UI state (reuse logic from schedule)
  showRebalanceModal: boolean = false;
  rebalancingTargetDayLocal: string = '';
  rebalancingEndDayLocal: string = '';
  rebalancingResult: any = null;
  rebalancingLoading: boolean = false;
  rebalancingError: string = '';
  rebalancingShowResults: boolean = false;

  constructor(
    private vesselVisitNotificationService: VesselVisitNotificationService,
    private http: HttpClient,
    private router: Router,
    private scheduleService: ScheduleService,
    private apiService: ApiService
  ) {}

  openRebalancing() {
    this.rebalancingTargetDayLocal = '';
    this.rebalancingEndDayLocal = '';
    this.rebalancingResult = null;
    this.rebalancingError = '';
    this.rebalancingShowResults = false;
    this.showRebalanceModal = true;
  }

  closeRebalancing() {
    this.showRebalanceModal = false;
    this.rebalancingResult = null;
    this.rebalancingLoading = false;
    this.rebalancingError = '';
    this.rebalancingShowResults = false;
  }

  submitRebalancing() {
    if (!this.rebalancingTargetDayLocal) {
      this.rebalancingError = 'Please select a target day.';
      return;
    }
    if (!this.rebalancingEndDayLocal) {
      this.rebalancingError = 'Please select an end day.';
      return;
    }
    let targetIso: string;
    let endIso: string;
    try {
      targetIso = new Date(this.rebalancingTargetDayLocal).toISOString();
      endIso = new Date(this.rebalancingEndDayLocal).toISOString();
    } catch (e) {
      this.rebalancingError = 'Invalid date format.';
      return;
    }
    this.rebalancingLoading = true;
    this.rebalancingError = '';
    const backendBase = this.apiService.getBaseUrl();
    const url = `${backendBase}/Scheduling/RebalancingAlgorithm?targetDay=${encodeURIComponent(targetIso)}&endDay=${encodeURIComponent(endIso)}`;
    this.http.get(url).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.rebalancingLoading = false;
        this.rebalancingResult = res || null;
        this.rebalancingShowResults = true;
      },
      error: (err: any) => {
        this.rebalancingLoading = false;
        let serverMsg = 'Unknown error';
        try {
          if (err && err.error) {
            if (typeof err.error === 'string') serverMsg = err.error;
            else if (err.error.message) serverMsg = err.error.message;
            else serverMsg = JSON.stringify(err.error);
          } else if (err && err.message) {
            serverMsg = err.message;
          } else if (err && err.status) {
            serverMsg = `${err.status} ${err.statusText || ''}`.trim();
          }
        } catch (e) {
          serverMsg = 'Failed to parse error response';
        }
        this.rebalancingError = `Error generating rebalancing: ${serverMsg}`;
        console.error('Rebalancing error', err);
      }
    });
  }

  acceptRebalancing() {
    this.showRebalanceModal = false;
    this.rebalancingShowResults = false;
    this.rebalancingLoading = false;
    this.rebalancingError = '';
    this.rebalancingResult = null;
  }

  rejectRebalancing() {
    this.rebalancingShowResults = false;
    this.rebalancingError = '';
  }

  ngOnInit() {
    this.loadVesselVisitNotifications();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVesselVisitNotifications() {
    this.isLoading = true;
    this.vesselVisitNotificationService.getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.vesselVisitNotifications = (notifications || []).filter(n => n.visitStatus === VisitStatus.Approved);
          this.filteredNotifications = [...this.vesselVisitNotifications];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading vessel visit notifications. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading vessel visit notifications:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.applyFilter(term));
  }

  applyFilter(term: string) {
    if (!term) {
      this.filteredNotifications = [...this.vesselVisitNotifications];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }
    const t = term.toLowerCase();
    this.filteredNotifications = this.vesselVisitNotifications.filter(n =>
      (n.code || '').toLowerCase().includes(t) || (n.vesselIMO || '').toLowerCase().includes(t)
    );
    if ((!this.filteredNotifications || this.filteredNotifications.length === 0)) {
      this.statusMessageType = 'error';
      this.statusMessage = `No results found for "${term}"`;
      this.statusHiding = false;
      if (this.statusTimeout) { clearTimeout(this.statusTimeout); }
      this.statusTimeout = setTimeout(() => this.clearStatusMessage(), 3000);
    } else {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
    }
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.applyFilter('');
  }

  formatDateForDisplay(d?: Date | string | null) {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toLocaleString();
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    if (this.statusTimeout) { clearTimeout(this.statusTimeout); this.statusTimeout = null; }
    this.statusHiding = true;
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  private getTimelineBounds(): { start: number; end: number } {
    if (!this.rebalancingResult || !this.rebalancingResult.initialEntries || this.rebalancingResult.initialEntries.length === 0) {
      const now = Date.now();
      return { start: now, end: now + 3600 * 1000 };
    }
    let min = Number.POSITIVE_INFINITY;
    let max = 0;
    for (const dock of this.rebalancingResult.initialEntries) {
      for (const e of dock.vesselTimes || []) {
        const s = e.arrival ? new Date(e.arrival).getTime() : Number.POSITIVE_INFINITY;
        const t = e.departure ? new Date(e.departure).getTime() : 0;
        if (s < min) min = s;
        if (t > max) max = t;
      }
    }
    if (!isFinite(min) || max === 0) {
      const now = Date.now();
      return { start: now, end: now + 3600 * 1000 };
    }
    const padding = Math.max(5 * 60 * 1000, Math.round((max - min) * 0.03));
    return { start: min - padding, end: max + padding };
  }

  getDockBarStyle(entry: any) {
    const bounds = this.getTimelineBounds();
    const start = entry.arrival ? new Date(entry.arrival).getTime() : bounds.start;
    const end = entry.departure ? new Date(entry.departure).getTime() : bounds.end;
    const total = Math.max(1, bounds.end - bounds.start);
    const left = ((start - bounds.start) / total) * 100;
    const widthRaw = ((end - start) / total) * 100;
    const minWidth = 0.2; // small fallback so very short intervals remain visible
    const width = Math.max(minWidth, widthRaw);
    // Do not shorten or recentre bars: show exact temporal coverage so adjacent intervals touch
    const leftAdj = Math.max(0, Math.min(100 - width, left));
    return {
      left: `${leftAdj.toFixed(4)}%`,
      width: `${width.toFixed(4)}%`
    } as any;
  }

  formatTimeForDisplay(d?: Date | string | null) {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toLocaleString();
  }

  joinAssignedCranes(entry: ScheduleEntryModel): string {
    if (!entry || !entry.assignedCrane || entry.assignedCrane.length === 0) return '';
    return (entry.assignedCrane as any[])
      .map(c => {
        if (!c) return '';
        if (typeof c === 'string') return c;
        if (typeof c === 'object') return (c.craneName ?? c.name ?? '').toString();
        return '';
      })
      .filter((n: string) => !!n)
      .join(', ');
  }

  joinAssignedStaff(entry: ScheduleEntryModel): string {
    if (!entry || !entry.assignedStaff || entry.assignedStaff.length === 0) return '';
    return (entry.assignedStaff as any[])
      .map(s => {
        if (!s) return '';
        if (typeof s === 'string') return s;
        if (typeof s === 'object') return (s.staffName ?? s.name ?? '').toString();
        return '';
      })
      .filter((n: string) => !!n)
      .join(', ');
  }

  getDuration(entry: ScheduleEntryModel): string {
    if (!entry.arrivalTime || !entry.departureTime) return '';
    const start = entry.arrivalTime ? new Date(entry.arrivalTime).getTime() : 0;
    const end = entry.departureTime ? new Date(entry.departureTime).getTime() : 0;
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

}