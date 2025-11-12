import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationDecisionService } from '../../services/vesselVisitNotificationDecision.service';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import {
  VesselVisitNotificationDecisionModel,
  DecisionStatus
} from '../../models/vesselVisitNotificationDecision.model';
import { VesselVisitNotificationModel } from '../../models/vesselVisitNotification.model';

@Component({
  selector: 'app-vessel-visit-notification-decision',
  imports: [CommonModule, FormsModule],
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
  private searchClearTimer: any = null;

  constructor(
    private decisionService: VesselVisitNotificationDecisionService,
    private notificationService: VesselVisitNotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDecisions();
    this.loadNotifications();
    this.setupSearch();
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
      .subscribe(searchTerm => {
        this.handleSearchTermChange(searchTerm);
        this.performSearch(searchTerm);
      });
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

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredDecisions = [...this.decisions];
      return;
    }

    this.filteredDecisions = this.decisions.filter(decision =>
      decision.vesselVisitNotificationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.responseMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.officerId?.toString().includes(searchTerm.toLowerCase())
    );
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
    this.searchTerm = '';
    this.filteredDecisions = [...this.decisions];
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredDecisions = [...this.decisions];
    this.searchSubject$.next(this.searchTerm);
  }

  private handleSearchTermChange(term: string) {
    if (this.searchClearTimer) {
      clearTimeout(this.searchClearTimer);
      this.searchClearTimer = null;
    }
    if (!term || !term.trim()) {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.searchClearTimer = setTimeout(() => {
          this.clearStatusMessage();
          this.searchClearTimer = null;
        }, 2000);
      }
    }
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
    // Filter notifications that don't have decisions yet or are in 'Submitted' status
    return this.notifications.filter(notification =>
      notification.visitStatus === 'Submitted' || notification.visitStatus === 'InProgress'
    );
  }

  getNotificationDetails(code: string): VesselVisitNotificationModel | undefined {
    return this.notifications.find(n => n.code === code);
  }
}
