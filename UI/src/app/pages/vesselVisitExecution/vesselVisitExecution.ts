import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { VesselVisitExecutionService } from '../../services/vesselVisitExecution.service';
import { VesselVisitExecutionModel } from '../../models/vesselVisitExecution.model';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { VesselVisitNotificationModel, VisitStatus } from '../../models/vesselVisitNotification.model';

@Component({
  selector: 'app-vessel-visit-execution',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vesselVisitExecution.html',
  styleUrl: './vesselVisitExecution.css',
})
export class VesselVisitExecution implements OnInit, OnDestroy {
  items: VesselVisitExecutionModel[] = [];
  filteredItems: VesselVisitExecutionModel[] = [];
  selected: VesselVisitExecutionModel | null = null;

  approvedNotifications: VesselVisitNotificationModel[] = [];

  searchTerm = '';
  isLoading = false;

  statusMessage = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding = false;

  // Create modal
  showCreateModal = false;
  isCreating = false;
  newItem: VesselVisitExecutionModel = { vesselVisitNotificationCode: '', arrivalDate: '' };
  modalErrorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private vveService: VesselVisitExecutionService,
    private vvnService: VesselVisitNotificationService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => this.performSearch(term));
  }

  loadItems() {
    this.isLoading = true;
    this.vveService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.filteredItems = [...this.items];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading VVE list. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading VVE:', error);
          this.isLoading = false;
        },
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredItems = [...this.items];
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
      return;
    }

    const localResults = this.items.filter(
      (i) =>
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredItems = localResults;
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
    } else {
      this.searchByName(searchTerm);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.vveService
      .getByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.filteredItems = items;
          if (items && items.length > 0) {
            if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
          } else {
            this.statusHiding = false;
            this.statusMessage = `No results found for "${name}"`;
            this.statusMessageType = 'error';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching VVE. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching VVE:', error);
          this.filteredItems = [];
          this.isLoading = false;
        },
      });
  }

  clearSearch() { this.clearSearchAndNotify(); }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredItems = [...this.items];
    this.searchSubject$.next(this.searchTerm);
  }

  select(item: VesselVisitExecutionModel) {
    this.selected = this.selected?.id === item.id ? null : item;
  }

  // Create modal handling (no edit per requirements)
  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewItem();
    this.loadApprovedNotifications();
  }

  resetNewItem() {
    this.newItem = { vesselVisitNotificationCode: '', arrivalDate: '' };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewItem();
    this.isCreating = false;
  }

  onSaveNew() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidNew()) {
      this.modalErrorMessage = 'Please fill in both fields (Vessel Visit Notification and Arrival Date).';
      return;
    }

    this.isCreating = true;
    this.vveService
      .create(this.newItem)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.closeCreateModal();
          this.statusHiding = false;
          const createdCode = (created as any)?.vesselVisitNotificationCode ?? created.code ?? '';
          this.statusMessage = `Execution with code "${createdCode}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadItems();
        },
        error: (error) => {
          console.error('Error creating VVE:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        },
      });
  }

  private isValidNew(): boolean {
    return !!(
      this.newItem.vesselVisitNotificationCode?.trim() &&
      this.newItem.arrivalDate?.trim()
    );
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = '';

    if (error?.originalError?.error) {
      const backendError = error.originalError.error;
      if (Array.isArray(backendError)) {
        errorMessage = backendError.join('; ');
        this.modalErrorMessage = errorMessage;
        return;
      }
      if (backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const fieldName = field.toLowerCase();
          this.fieldErrors[fieldName] = Array.isArray(backendError.errors[field])
            ? backendError.errors[field].join('; ')
            : backendError.errors[field];
        }
        this.modalErrorMessage = 'Please correct the validation errors below.';
        return;
      }
      if (backendError.message) errorMessage = backendError.message;
      else if (backendError.title) errorMessage = backendError.title;
      else if (backendError.detail) errorMessage = backendError.detail;
      else if (typeof backendError === 'string') errorMessage = backendError;
    }

    if (!errorMessage && error?.message) errorMessage = error.message;
    if (!errorMessage) errorMessage = 'Error creating VVE. Please try again.';
    this.modalErrorMessage = errorMessage;
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

  private loadApprovedNotifications() {
    this.vvnService
      .getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.approvedNotifications = (list || []).filter(n => n.visitStatus === VisitStatus.Approved);
        },
        error: (err) => {
          console.error('Failed loading notifications:', err);
          this.approvedNotifications = [];
        }
      });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('completed')) return 'status-approved';
    if (lowerStatus.includes('rejected') || lowerStatus.includes('unavailable')) return 'status-rejected';
    if (lowerStatus.includes('submitted')) return 'status-submitted';
    if (lowerStatus.includes('inprogress') || lowerStatus.includes('in-progress')) return 'status-inprogress';
    if (lowerStatus.includes('inmaintenance') || lowerStatus.includes('in-maintenance')) return 'status-inmaintenance';
    return '';
  }
}
