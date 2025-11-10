import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { PhysicalResourcesService } from '../../services/physicalResources.service';
import { QualificationService } from '../../services/qualification.service';
import { StorageAreaService } from '../../services/storageArea.service';
import { DocksService } from '../../services/docks.service';
import {
  PhysicalResourceModel,
  PhysicalResourceKind,
  ResourceStatus,
  PHYSICAL_RESOURCE_KINDS,
  RESOURCE_STATUSES,
  DAYS_OF_WEEK,
  OperationalWindowModel
} from '../../models/physicalResources.model';
import { QualificationModel } from '../../models/qualification.model';
import { StorageAreaModel } from '../../models/storageArea.model';
import { DocksModel } from '../../models/docks.model';

@Component({
  selector: 'app-physical-resources',
  imports: [CommonModule, FormsModule],
  templateUrl: './physicalResources.html',
  styleUrl: './physicalResources.css',
})
export class PhysicalResources implements OnInit, OnDestroy {
  physicalResources: PhysicalResourceModel[] = [];
  filteredPhysicalResources: PhysicalResourceModel[] = [];
  selectedPhysicalResource: PhysicalResourceModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newPhysicalResource: PhysicalResourceModel = this.getEmptyResource();
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editPhysicalResource: PhysicalResourceModel = this.getEmptyResource();
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditPhysicalResource: PhysicalResourceModel | null = null;

  // Available options
  availableQualifications: QualificationModel[] = [];
  availableDocks: DocksModel[] = [];
  availableStorageAreas: StorageAreaModel[] = [];

  // Enums for template
  PhysicalResourceKind = PhysicalResourceKind;
  ResourceStatus = ResourceStatus;
  PHYSICAL_RESOURCE_KINDS = PHYSICAL_RESOURCE_KINDS;
  RESOURCE_STATUSES = RESOURCE_STATUSES;
  DAYS_OF_WEEK = DAYS_OF_WEEK;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private physicalResourcesService: PhysicalResourcesService,
    private qualificationService: QualificationService,
    private storageAreaService: StorageAreaService,
    private docksService: DocksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPhysicalResources();
    this.loadAvailableOptions();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getEmptyResource(): PhysicalResourceModel {
    return {
      code: '',
      name: '',
      description: '',
      kind: PhysicalResourceKind.Other,
      setupTimeMinutes: 0,
      operationalCapacity: 1,
      assignedArea: '',
      qualificationCode: '',
      operationalWindow: {
        startDay: 1,
        endDay: 5,
        startTime: '08:00',
        endTime: '17:00'
      },
      status: ResourceStatus.Available
    };
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

  loadPhysicalResources() {
    this.isLoading = true;
    this.physicalResourcesService.getAllPhysicalResources()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resources) => {
          this.physicalResources = resources;
          this.filteredPhysicalResources = [...this.physicalResources];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading physical resources. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading physical resources:', error);
          this.isLoading = false;
        }
      });
  }

  loadAvailableOptions() {
    forkJoin({
      qualifications: this.qualificationService.getAllQualifications(),
      docks: this.docksService.getAllDocks(),
      storageAreas: this.storageAreaService.getAllStorageAreas()
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        this.availableQualifications = result.qualifications;
        this.availableDocks = result.docks;
        this.availableStorageAreas = result.storageAreas;
      },
      error: (error) => {
        console.error('Error loading available options:', error);


        this.loadQualificationsIndividually();
        this.loadDocksIndividually();
        this.loadStorageAreasIndividually();
      }
    });
  }

  private loadQualificationsIndividually() {
    this.qualificationService.getAllQualifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualifications) => {
          this.availableQualifications = qualifications;
        },
        error: (error) => {
          console.error('Error loading qualifications individually:', error);
        }
      });
  }

  private loadDocksIndividually() {
    this.docksService.getAllDocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docks) => {
          this.availableDocks = docks;
        },
        error: (error) => {
          console.error('Error loading docks individually:', error);
        }
      });
  }

  private loadStorageAreasIndividually() {
    this.storageAreaService.getAllStorageAreas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (storageAreas) => {
          this.availableStorageAreas = storageAreas;
        },
        error: (error) => {
          console.error('Error loading storage areas individually:', error);
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredPhysicalResources = [...this.physicalResources];
      return;
    }

    const localResults = this.physicalResources.filter(r =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.assignedArea?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.qualificationCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredPhysicalResources = localResults;
    } else {
      this.searchByDescription(searchTerm);
    }
  }

  searchByDescription(description: string) {
    this.isLoading = true;
    this.physicalResourcesService.getPhysicalResourcesByDescription(description)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resources) => {
          this.filteredPhysicalResources = resources;
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching for physical resources. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching physical resources:', error);
          this.filteredPhysicalResources = [];
          this.isLoading = false;
        }
      });
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
    this.filteredPhysicalResources = [...this.physicalResources];
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredPhysicalResources = [...this.physicalResources];
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

  selectPhysicalResource(resource: PhysicalResourceModel) {
    if (this.selectedPhysicalResource?.id === resource.id) {
      this.selectedPhysicalResource = null;
    } else {
      this.selectedPhysicalResource = resource;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewPhysicalResource();
  }

  onUpdate() {
    if (this.selectedPhysicalResource) {
      this.showEditModal = true;
      this.resetEditPhysicalResource();
      this.editPhysicalResource = { ...this.selectedPhysicalResource };
      this.originalEditPhysicalResource = { ...this.editPhysicalResource };
    } else {
      alert('Please select a physical resource to update.');
    }
  }

  refreshList() {
    this.loadPhysicalResources();
    this.selectedPhysicalResource = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewPhysicalResource() {
    this.newPhysicalResource = this.getEmptyResource();
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewPhysicalResource();
    this.isCreating = false;
  }

  onSaveNewPhysicalResource() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidPhysicalResource(this.newPhysicalResource)) {
      if (!this.newPhysicalResource.qualificationCode?.trim()) {
        this.modalErrorMessage = 'Please select a qualification. This field is required.';
      } else if (this.isAreaRequired() && !this.newPhysicalResource.assignedArea?.trim()) {
        this.modalErrorMessage = `Please select an assigned area. ${this.newPhysicalResource.kind} requires an area assignment.`;
      } else {
        this.modalErrorMessage = 'Please fill in all required fields.';
      }
      return;
    }

    this.isCreating = true;
    this.physicalResourcesService.createPhysicalResource(this.newPhysicalResource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdResource) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Physical resource "${createdResource.code}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadPhysicalResources();
        },
        error: (error) => {
          console.error('Error creating physical resource:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    console.error('Full error in component:', error);

    let errorMessage = '';

    if (error.originalError && error.originalError.error) {
      const backendError = error.originalError.error;
      console.error('Backend error object:', backendError);

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

      if (backendError.message) {
        errorMessage = backendError.message;
      } else if (backendError.title) {
        errorMessage = backendError.title;
      } else if (backendError.detail) {
        errorMessage = backendError.detail;
      } else if (typeof backendError === 'string') {
        errorMessage = backendError;
      }
    }

    if (!errorMessage && error.message) {
      errorMessage = error.message;
    }

    if (!errorMessage) {
      errorMessage = 'Error creating physical resource. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidPhysicalResource(resource: PhysicalResourceModel): boolean {
    const basicValidation = !!(resource.code?.trim() &&
              resource.name?.trim() &&
              resource.description?.trim() &&
              resource.kind &&
              resource.operationalCapacity &&
              resource.operationalCapacity > 0 &&
              resource.qualificationCode?.trim() &&
              resource.operationalWindow?.startDay !== undefined &&
              resource.operationalWindow?.endDay !== undefined &&
              resource.operationalWindow?.startTime?.trim() &&
              resource.operationalWindow?.endTime?.trim());

    // Check if assigned area is required and provided
    if (resource.kind === PhysicalResourceKind.STSCrane || resource.kind === PhysicalResourceKind.Truck) {
      return basicValidation && !!resource.assignedArea?.trim();
    }

    return basicValidation;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditPhysicalResource() {
    this.editPhysicalResource = this.getEmptyResource();
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditPhysicalResource = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditPhysicalResource();
    this.isEditing = false;
  }

  onSaveEditPhysicalResource() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidPhysicalResource(this.editPhysicalResource)) {
      if (!this.editPhysicalResource.qualificationCode?.trim()) {
        this.editModalErrorMessage = 'Please select a qualification. This field is required.';
      } else if (this.isAreaRequired() && !this.editPhysicalResource.assignedArea?.trim()) {
        this.editModalErrorMessage = `Please select an assigned area. ${this.editPhysicalResource.kind} requires an area assignment.`;
      } else {
        this.editModalErrorMessage = 'Please fill in all required fields.';
      }
      return;
    }

    if (!this.selectedPhysicalResource?.id) {
      this.editModalErrorMessage = 'No physical resource selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.physicalResourcesService.updatePhysicalResource(this.selectedPhysicalResource.id, this.editPhysicalResource)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedResource) => {
          this.closeEditModal();
          this.loadPhysicalResources();
          this.statusHiding = false;
          this.statusMessage = `Physical resource "${this.selectedPhysicalResource?.code}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating physical resource:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditPhysicalResource) return false;
    const orig = this.originalEditPhysicalResource;
    const curr = this.editPhysicalResource;

    return (
      (orig.name || '').trim() !== (curr.name || '').trim() ||
      (orig.description || '').trim() !== (curr.description || '').trim() ||
      orig.setupTimeMinutes !== curr.setupTimeMinutes ||
      orig.operationalCapacity !== curr.operationalCapacity ||
      (orig.assignedArea || '').trim() !== (curr.assignedArea || '').trim() ||
      (orig.qualificationCode || '').trim() !== (curr.qualificationCode || '').trim() ||
      orig.status !== curr.status ||
      orig.operationalWindow?.startDay !== curr.operationalWindow?.startDay ||
      orig.operationalWindow?.endDay !== curr.operationalWindow?.endDay ||
      (orig.operationalWindow?.startTime || '').trim() !== (curr.operationalWindow?.startTime || '').trim() ||
      (orig.operationalWindow?.endTime || '').trim() !== (curr.operationalWindow?.endTime || '').trim()
    );
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};
    console.error('Full error in component:', error);

    let errorMessage = '';

    if (error.originalError && error.originalError.error) {
      const backendError = error.originalError.error;
      console.error('Backend error object:', backendError);

      if (Array.isArray(backendError)) {
        errorMessage = backendError.join('; ');
        this.editModalErrorMessage = errorMessage;
        return;
      }

      if (backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const fieldName = field.toLowerCase();
          this.editFieldErrors[fieldName] = Array.isArray(backendError.errors[field])
            ? backendError.errors[field].join('; ')
            : backendError.errors[field];
        }
        this.editModalErrorMessage = 'Please correct the validation errors below.';
        return;
      }

      if (backendError.message) {
        errorMessage = backendError.message;
      } else if (backendError.title) {
        errorMessage = backendError.title;
      } else if (backendError.detail) {
        errorMessage = backendError.detail;
      } else if (typeof backendError === 'string') {
        errorMessage = backendError;
      }
    }

    if (!errorMessage && error.message) {
      errorMessage = error.message;
    }

    if (!errorMessage) {
      errorMessage = 'Error updating physical resource. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }

  // Helper methods for UI
  getKindLabel(kind: PhysicalResourceKind): string {
    return PHYSICAL_RESOURCE_KINDS.find(k => k.value === kind)?.label || kind;
  }

  getStatusLabel(status: ResourceStatus): string {
    return RESOURCE_STATUSES.find(s => s.value === status)?.label || status;
  }

  getDayLabel(dayNumber: number): string {
    return DAYS_OF_WEEK.find(d => d.value === dayNumber)?.label || dayNumber.toString();
  }

  getAvailableAreas(): string[] {
    const kind = this.showCreateModal ? this.newPhysicalResource.kind : this.editPhysicalResource.kind;

    if (kind === PhysicalResourceKind.STSCrane) {
      return this.availableDocks.map(dock => dock.name || '');
    } else if (kind === PhysicalResourceKind.Truck) {
      return this.availableStorageAreas.map(area => area.code || '');
    } else if (kind === PhysicalResourceKind.MobileCrane) {
      const dockNames = this.availableDocks.map(dock => dock.name || '');
      const areaCodes = this.availableStorageAreas.map(area => area.code || '');
      return [...dockNames, ...areaCodes];
    }
    return [];
  }


  shouldShowAreaDropdown(): boolean {
    const kind = this.showCreateModal ? this.newPhysicalResource.kind : this.editPhysicalResource.kind;
    return !!(kind && (kind === PhysicalResourceKind.STSCrane || kind === PhysicalResourceKind.Truck || kind === PhysicalResourceKind.MobileCrane));
  }


  onKindChange(): void {
    this.newPhysicalResource.assignedArea = '';
  }

  onEditKindChange(): void {
    this.editPhysicalResource.assignedArea = '';
  }

  // Method to get the placeholder text for the dropdown
  getAreaPlaceholder(): string {
    const kind = this.showCreateModal ? this.newPhysicalResource.kind : this.editPhysicalResource.kind;
    if (kind === PhysicalResourceKind.STSCrane) {
      return 'Select a dock';
    } else if (kind === PhysicalResourceKind.Truck) {
      return 'Select a storage area';
    } else if (kind === PhysicalResourceKind.MobileCrane) {
      return 'Select an area (optional)';
    }
    return 'Select area';
  }

  isAreaRequired(): boolean {
    const kind = this.showCreateModal ? this.newPhysicalResource.kind : this.editPhysicalResource.kind;
    return kind === PhysicalResourceKind.STSCrane || kind === PhysicalResourceKind.Truck;
  }

  getAreaLabel(): string {
    const kind = this.showCreateModal ? this.newPhysicalResource.kind : this.editPhysicalResource.kind;
    if (kind === PhysicalResourceKind.STSCrane) {
      return 'Assigned Dock *';
    } else if (kind === PhysicalResourceKind.Truck) {
      return 'Assigned Storage Area *';
    } else if (kind === PhysicalResourceKind.MobileCrane) {
      return 'Assigned Area (Optional)';
    }
    return 'Assigned Area';
  }
}
