import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationDecisionService } from '../../services/vesselVisitNotificationDecision.service';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import {
  VesselVisitNotificationDecisionModel,
  DecisionStatus
} from '../../models/vesselVisitNotificationDecision.model';
import { VesselVisitNotificationModel } from '../../models/vesselVisitNotification.model';

import { DocksService } from '../../services/docks.service';
import { DocksModel } from '../../models/docks.model';

@Component({
  selector: 'app-vessel-visit-notification-decision',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vesselVisitNotificationDecision.html',
  styleUrl: './vesselVisitNotificationDecision.css',
})
export class VesselVisitNotificationDecision implements OnInit, OnDestroy {
  decisions: VesselVisitNotificationDecisionModel[] = [];
  notifications: VesselVisitNotificationModel[] = [];
  filteredDecisions: VesselVisitNotificationDecisionModel[] = [];
  selectedDecision: VesselVisitNotificationDecisionModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  // Enum references for templates
  DecisionStatus = DecisionStatus;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newDecision: VesselVisitNotificationDecisionModel = {
    status: DecisionStatus.Approved,
    responseMessage: '',
    vesselVisitNotificationCode: '',
    officerId: 1
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();


  docks: DocksModel[] = [];

  constructor(
    private decisionService: VesselVisitNotificationDecisionService,
    private notificationService: VesselVisitNotificationService,
    private docksService: DocksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDecisions();
    this.loadNotifications();
    this.loadDocks();
    this.setupSearch();
  }

  loadDocks() {
    this.docksService.getAllDocks().pipe(takeUntil(this.destroy$)).subscribe({
      next: (docks) => {
        this.docks = docks;
      },
      error: (error) => {
        console.error('Error loading docks:', error);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => { this.performSearch(searchTerm); });
  }

  loadDecisions() {
    this.isLoading = true;
    this.decisionService.getAllDecisions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (decisions) => {
          this.decisions = decisions;
          this.filteredDecisions = [...this.decisions];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading decisions. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading decisions:', error);
          this.isLoading = false;
        }
      });
  }

  loadNotifications() {
    this.notificationService.getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string): void {
    const term = searchTerm ?? this.searchTerm;
    if (!term || typeof term !== 'string' || !term.trim()) {
      this.filteredDecisions = Array.isArray(this.decisions) ? [...this.decisions] : [];
      if (typeof this.statusMessage === 'string' && this.statusMessageType === 'error') this.clearStatusMessage();
      return;
    }

    this.filteredDecisions = Array.isArray(this.decisions) ? this.decisions.filter((decision: VesselVisitNotificationDecisionModel) =>
      (decision.vesselVisitNotificationCode?.toLowerCase().includes(term.toLowerCase()) ?? false) ||
      (decision.status?.toLowerCase().includes(term.toLowerCase()) ?? false) ||
      (decision.responseMessage?.toLowerCase().includes(term.toLowerCase()) ?? false) ||
      (decision.officerId?.toString().includes(term.toLowerCase()) ?? false)
    ) : [];

    if (Array.isArray(this.filteredDecisions) && this.filteredDecisions.length === 0) {
      this.statusHiding = false;
      this.statusMessage = `No results found for "${term}"`;
      this.statusMessageType = 'error';
    } else {
      if (typeof this.statusMessage === 'string' && this.statusMessageType === 'error') this.clearStatusMessage();
    }
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    this.statusHiding = true;
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  clearSearch() {
    this.clearSearchAndNotify();
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredDecisions = [...this.decisions];
    this.searchSubject$.next(this.searchTerm);
  }


  selectDecision(decision: VesselVisitNotificationDecisionModel) {
    if (this.selectedDecision?.id === decision.id) {
      this.selectedDecision = null;
    } else {
      this.selectedDecision = decision;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewDecision();
  }

  refreshList() {
    this.loadDecisions();
    this.selectedDecision = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewDecision() {
    this.newDecision = {
      status: DecisionStatus.Approved,
      responseMessage: '',
      vesselVisitNotificationCode: '',
      officerId: 1
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewDecision();
    this.isCreating = false;
  }

  onSaveNewDecision() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidDecision()) {
      this.modalErrorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isCreating = true;
    this.decisionService.createDecision(this.newDecision)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdDecision) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Decision for notification "${createdDecision.vesselVisitNotificationCode}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadDecisions();
        },
        error: (error) => {
          console.error('Error creating decision:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = 'Error creating decision. Please try again.';
    if (error.message) {
      errorMessage = error.message;
    }
    this.modalErrorMessage = errorMessage;
  }

  private isValidDecision(): boolean {
    return !!(this.newDecision.vesselVisitNotificationCode?.trim() &&
              this.newDecision.responseMessage?.trim() &&
              this.newDecision.status &&
              this.newDecision.officerId);
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Utility methods for enum conversion
  getDecisionStatuses(): string[] {
    return Object.values(DecisionStatus);
  }

  // Helper methods for date formatting
  formatDateForDisplay(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  getAvailableNotifications(): VesselVisitNotificationModel[] {
    return this.notifications.filter(notification =>
      notification.visitStatus === 'Submitted'
    );
  }

  getNotificationDetails(code: string): VesselVisitNotificationModel | undefined {
    return this.notifications.find(n => n.code === code);
  }
}
