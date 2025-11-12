import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import {
  VesselVisitNotificationModel,
  CargoType,
  VisitStatus,
  CrewRank,
  ManifestType,
  CrewMemberModel,
  CargoManifestModel,
  CargoManifestEntryModel
} from '../../models/vesselVisitNotification.model';

@Component({
  selector: 'app-vessel-visit-notification',
  imports: [CommonModule, FormsModule],
  templateUrl: './vesselVisitNotification.html',
  styleUrl: './vesselVisitNotification.css',
})
export class VesselVisitNotification implements OnInit, OnDestroy {
  vesselVisitNotifications: VesselVisitNotificationModel[] = [];
  filteredNotifications: VesselVisitNotificationModel[] = [];
  selectedNotification: VesselVisitNotificationModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  // Enum references for templates
  CargoType = CargoType;
  VisitStatus = VisitStatus;
  CrewRank = CrewRank;
  ManifestType = ManifestType;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newNotification: VesselVisitNotificationModel = {
    vesselIMO: '',
    representativeCitizenID: '',
    eta: new Date(),
    etd: new Date(),
    cargoType: CargoType.Container,
    volume: 0,
    numberOfCrewMembers: 0,
    visitStatus: VisitStatus.InProgress,
    crewMembers: [],
    cargoManifests: []
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editNotification: VesselVisitNotificationModel = {
    vesselIMO: '',
    representativeCitizenID: '',
    eta: new Date(),
    etd: new Date(),
    cargoType: CargoType.Container,
    volume: 0,
    numberOfCrewMembers: 0,
    visitStatus: VisitStatus.InProgress,
    crewMembers: [],
    cargoManifests: []
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditNotification: VesselVisitNotificationModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private vesselVisitNotificationService: VesselVisitNotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVesselVisitNotifications();
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

  loadVesselVisitNotifications() {
    this.isLoading = true;
    this.vesselVisitNotificationService.getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.vesselVisitNotifications = notifications;
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

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredNotifications = [...this.vesselVisitNotifications];
      return;
    }

    this.filteredNotifications = this.vesselVisitNotifications.filter(notification =>
      notification.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.vesselIMO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.representativeCitizenID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.cargoType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.visitStatus?.toLowerCase().includes(searchTerm.toLowerCase())
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
    this.filteredNotifications = [...this.vesselVisitNotifications];
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredNotifications = [...this.vesselVisitNotifications];
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

  selectNotification(notification: VesselVisitNotificationModel) {
    if (this.selectedNotification?.id === notification.id) {
      this.selectedNotification = null;
    } else {
      this.selectedNotification = notification;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewNotification();
  }

  onUpdate() {
    if (this.selectedNotification) {
      this.showEditModal = true;
      this.resetEditNotification();
      this.editNotification = { ...this.selectedNotification };
      // Deep copy arrays
      this.editNotification.crewMembers = this.selectedNotification.crewMembers ?
        [...this.selectedNotification.crewMembers.map(cm => ({...cm}))] : [];
      this.editNotification.cargoManifests = this.selectedNotification.cargoManifests ?
        [...this.selectedNotification.cargoManifests.map(cm => ({
          ...cm,
          entries: cm.entries ? [...cm.entries.map(e => ({...e}))] : []
        }))] : [];

      this.originalEditNotification = { ...this.editNotification };
    } else {
      alert('Please select a vessel visit notification to update.');
    }
  }

  refreshList() {
    this.loadVesselVisitNotifications();
    this.selectedNotification = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewNotification() {
    this.newNotification = {
      vesselIMO: '',
      representativeCitizenID: '',
      eta: new Date(),
      etd: new Date(),
      cargoType: CargoType.Container,
      volume: 0,
      numberOfCrewMembers: 0,
      visitStatus: VisitStatus.InProgress,
      crewMembers: [],
      cargoManifests: []
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewNotification();
    this.isCreating = false;
  }

  onSaveNewNotification() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidNotification()) {
      this.modalErrorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isCreating = true;
    this.vesselVisitNotificationService.createVesselVisitNotification(this.newNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdNotification) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Vessel Visit Notification "${createdNotification.code}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadVesselVisitNotifications();
        },
        error: (error) => {
          console.error('Error creating vessel visit notification:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = 'Error creating vessel visit notification. Please try again.';
    if (error.message) {
      errorMessage = error.message;
    }
    this.modalErrorMessage = errorMessage;
  }

  private isValidNotification(): boolean {
    return !!(this.newNotification.vesselIMO?.trim() &&
              this.newNotification.representativeCitizenID?.trim() &&
              this.newNotification.eta &&
              this.newNotification.etd &&
              this.newNotification.cargoType &&
              this.newNotification.volume !== undefined &&
              this.newNotification.numberOfCrewMembers !== undefined);
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditNotification() {
    this.editNotification = {
      vesselIMO: '',
      representativeCitizenID: '',
      eta: new Date(),
      etd: new Date(),
      cargoType: CargoType.Container,
      volume: 0,
      numberOfCrewMembers: 0,
      visitStatus: VisitStatus.InProgress,
      crewMembers: [],
      cargoManifests: []
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditNotification = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditNotification();
    this.isEditing = false;
  }

  onSaveEditNotification() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditNotification()) {
      this.editModalErrorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.selectedNotification?.code) {
      this.editModalErrorMessage = 'No notification selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.vesselVisitNotificationService.updateVesselVisitNotification(this.selectedNotification.code, this.editNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadVesselVisitNotifications();
          this.statusHiding = false;
          this.statusMessage = `Vessel Visit Notification "${this.selectedNotification?.code}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating vessel visit notification:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditNotification) return false;
    // Simple comparison - in real implementation you might want deeper comparison
    return JSON.stringify(this.originalEditNotification) !== JSON.stringify(this.editNotification);
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};
    let errorMessage = 'Error updating vessel visit notification. Please try again.';
    if (error.message) {
      errorMessage = error.message;
    }
    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditNotification(): boolean {
    return !!(this.editNotification.vesselIMO?.trim() &&
              this.editNotification.representativeCitizenID?.trim() &&
              this.editNotification.eta &&
              this.editNotification.etd &&
              this.editNotification.cargoType &&
              this.editNotification.volume !== undefined &&
              this.editNotification.numberOfCrewMembers !== undefined);
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }

  // Utility methods for enum conversion
  getCargoTypes(): string[] {
    return Object.values(CargoType);
  }

  getVisitStatuses(): string[] {
    return Object.values(VisitStatus);
  }

  getCrewRanks(): string[] {
    return Object.values(CrewRank);
  }

  getManifestTypes(): string[] {
    return Object.values(ManifestType);
  }

  // Helper methods for date formatting
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16); // Format for datetime-local input
  }

  formatDateForDisplay(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Date update helper methods
  updateNewNotificationEta(event: any) {
    this.newNotification.eta = new Date(event.target.value);
  }

  updateNewNotificationEtd(event: any) {
    this.newNotification.etd = new Date(event.target.value);
  }

  updateEditNotificationEta(event: any) {
    this.editNotification.eta = new Date(event.target.value);
  }

  updateEditNotificationEtd(event: any) {
    this.editNotification.etd = new Date(event.target.value);
  }
}
