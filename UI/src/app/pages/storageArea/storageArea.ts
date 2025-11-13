import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { StorageAreaService } from '../../services/storageArea.service';
import { DocksService } from '../../services/docks.service';
import { StorageAreaModel, StorageAreaType, StorageAreaDockModel } from '../../models/storageArea.model';
import { DocksModel } from '../../models/docks.model';

@Component({
  selector: 'app-storage-area',
  imports: [CommonModule, FormsModule],
  templateUrl: './storageArea.html',
  styleUrl: './storageArea.css',
})
export class StorageArea implements OnInit, OnDestroy {
  storageAreas: StorageAreaModel[] = [];
  filteredStorageAreas: StorageAreaModel[] = [];
  selectedStorageArea: StorageAreaModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  // Controls the hide animation when clearing the status message
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newStorageArea: StorageAreaModel = {
    code: '',
    location: '',
    storageAreaType: StorageAreaType.Yard,
    maxCapacity: 1,
    currentCapacity: 0,
    storageAreaDocks: []
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Available docks for selection (should be loaded from service)
  availableDocks: DocksModel[] = [];
  newDockAssociation = { dockName: '', distance: 0 };
  isLoadingDocks: boolean = false;

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editStorageArea: StorageAreaModel = {
    code: '',
    location: '',
    storageAreaType: StorageAreaType.Yard,
    maxCapacity: 0,
    currentCapacity: 0,
    storageAreaDocks: []
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditStorageArea: StorageAreaModel | null = null;

  // Edit dock association
  editDockAssociation = { dockName: '', distance: 0 };

  // Enum reference for template
  StorageAreaType = StorageAreaType;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();


  // Helper methods for validation
  onMaxCapacityChange() {
    // Ensure current capacity doesn't exceed max capacity
    if (this.newStorageArea.maxCapacity !== undefined &&
        this.newStorageArea.currentCapacity !== undefined &&
        this.newStorageArea.currentCapacity > this.newStorageArea.maxCapacity) {
      this.newStorageArea.currentCapacity = this.newStorageArea.maxCapacity;
    }
  }

  onEditMaxCapacityChange() {
    // Ensure current capacity doesn't exceed max capacity in edit mode
    if (this.editStorageArea.maxCapacity !== undefined &&
        this.editStorageArea.currentCapacity !== undefined &&
        this.editStorageArea.currentCapacity > this.editStorageArea.maxCapacity) {
      this.editStorageArea.currentCapacity = this.editStorageArea.maxCapacity;
    }
  }

  constructor(
    private storageAreaService: StorageAreaService,
    private docksService: DocksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadStorageAreas();
    this.setupSearch();
    this.loadAvailableDocks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableDocks() {
    this.isLoadingDocks = true;
    this.docksService.getAllDocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docks) => {
          this.availableDocks = docks;
          this.isLoadingDocks = false;
        },
        error: (error) => {
          console.error('Error loading docks:', error);
          this.isLoadingDocks = false;
        }
      });
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

  loadStorageAreas() {
    this.isLoading = true;
    this.storageAreaService.getAllStorageAreas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (storageAreas) => {
          this.storageAreas = storageAreas;
          this.filteredStorageAreas = [...this.storageAreas];
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error loading storage areas. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading storage areas:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredStorageAreas = [...this.storageAreas];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }

    const localResults = this.storageAreas.filter(s =>
      s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.storageAreaType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.maxCapacity?.toString().includes(searchTerm) ||
      s.currentCapacity?.toString().includes(searchTerm)
    );

    if (localResults.length > 0) {
      this.filteredStorageAreas = localResults;
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
    } else {
      this.searchByLocation(searchTerm);
    }
  }

  searchByLocation(location: string) {
    this.isLoading = true;
    this.storageAreaService.getStorageAreaByLocation(location)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (storageArea) => {
          if (storageArea) {
            this.filteredStorageAreas = [storageArea];
            if (this.statusMessage && this.statusMessageType === 'error') {
              this.clearStatusMessage();
            }
          } else {
            this.filteredStorageAreas = [];
            this.statusHiding = false;
            this.statusMessage = `No results found for "${location}"`;
            this.statusMessageType = 'error';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching for storage areas. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching storage areas:', error);
          this.filteredStorageAreas = [];
          this.isLoading = false;
        }
      });
  }

  clearStatusMessage() {
    // Play hide animation before removing the node from DOM so the exit animation can be seen.
    if (!this.statusMessage) return;
    this.statusHiding = true;
    // Give the CSS exit animation time to run (match to CSS animation duration: 200ms)
    setTimeout(() => {
      this.statusMessage = '';
      this.statusMessageType = '';
      this.statusHiding = false;
    }, 220);
  }

  clearSearch() { this.clearSearchAndNotify(); }

  // When clearing programmatically (e.g. clicking the clear button) ensure the
  // search pipeline and error-hide behavior run as if the user emptied the input.
  clearSearchAndNotify() { this.searchTerm = ''; this.filteredStorageAreas = [...this.storageAreas]; this.searchSubject$.next(this.searchTerm); }

  selectStorageArea(storageArea: StorageAreaModel) {
    if (this.selectedStorageArea?.id === storageArea.id) {
      this.selectedStorageArea = null;
    } else {
      this.selectedStorageArea = storageArea;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewStorageArea();
    console.log('Opening create storage area modal');
  }

  onUpdate() {
    if (this.selectedStorageArea) {
      this.showEditModal = true;
      this.resetEditStorageArea();
      this.editStorageArea = {
        ...this.selectedStorageArea,
        storageAreaDocks: this.selectedStorageArea.storageAreaDocks?.map(dock => ({ ...dock })) || []
      };

      this.originalEditStorageArea = {
        ...this.editStorageArea,
        storageAreaDocks: this.editStorageArea.storageAreaDocks?.map(dock => ({ ...dock })) || []
      };
      console.log('Opening edit storage area modal for:', this.selectedStorageArea);
    } else {
      alert('Please select a storage area to update.');
    }
  }

  refreshList() {
    this.loadStorageAreas();
    this.selectedStorageArea = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewStorageArea() {
    this.newStorageArea = {
      code: '',
      location: '',
      storageAreaType: StorageAreaType.Yard,
      maxCapacity: 1,
      currentCapacity: 0,
      storageAreaDocks: []
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
    this.newDockAssociation = { dockName: '', distance: 0 };
  }

  // Dock association methods
  addDockAssociation() {
    if (this.newDockAssociation.dockName && this.newDockAssociation.distance >= 0) {
      // Check if dock exists in available docks
      const selectedDock = this.availableDocks.find(dock => dock.name === this.newDockAssociation.dockName);
      if (!selectedDock) {
        alert('Selected dock does not exist. Please choose from the dropdown.');
        return;
      }

      // Check if dock is already associated
      const exists = this.newStorageArea.storageAreaDocks?.some(dock =>
        dock.dockName === this.newDockAssociation.dockName);

      if (exists) {
        alert('This dock is already associated with this storage area.');
        return;
      }

      this.newStorageArea.storageAreaDocks?.push({
        dockName: this.newDockAssociation.dockName,
        distance: this.newDockAssociation.distance
      });
      this.newDockAssociation = { dockName: '', distance: 0 };
    }
  }

  removeDockAssociation(index: number) {
    this.newStorageArea.storageAreaDocks?.splice(index, 1);
  }

  // Helper method to get available dock names that aren't already associated
  getAvailableDockNames(): string[] {
    const associatedDockNames = this.newStorageArea.storageAreaDocks?.map(dock => dock.dockName) || [];
    return this.availableDocks
      .filter(dock => dock.name && !associatedDockNames.includes(dock.name))
      .map(dock => dock.name!)
      .sort();
  }

  // Edit modal dock methods
  getAvailableDockNamesForEdit(): string[] {
    const associatedDockNames = this.editStorageArea.storageAreaDocks?.map(dock => dock.dockName) || [];
    return this.availableDocks
      .filter(dock => dock.name && !associatedDockNames.includes(dock.name))
      .map(dock => dock.name!)
      .sort();
  }

  addDockAssociationToEdit() {
    if (this.editDockAssociation.dockName && this.editDockAssociation.distance >= 0) {
      // Check if dock exists in available docks
      const selectedDock = this.availableDocks.find(dock => dock.name === this.editDockAssociation.dockName);
      if (!selectedDock) {
        alert('Selected dock does not exist. Please choose from the dropdown.');
        return;
      }

      // Check if dock is already associated
      const exists = this.editStorageArea.storageAreaDocks?.some(dock =>
        dock.dockName === this.editDockAssociation.dockName);

      if (exists) {
        alert('This dock is already associated with this storage area.');
        return;
      }

      if (!this.editStorageArea.storageAreaDocks) {
        this.editStorageArea.storageAreaDocks = [];
      }

      this.editStorageArea.storageAreaDocks.push({
        dockName: this.editDockAssociation.dockName,
        distance: this.editDockAssociation.distance
      });
      this.editDockAssociation = { dockName: '', distance: 0 };
    }
  }

  removeDockAssociationFromEdit(index: number) {
    this.editStorageArea.storageAreaDocks?.splice(index, 1);
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewStorageArea();
    this.isCreating = false;
  }

  onSaveNewStorageArea() {

    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidStorageArea()) {
      if (Object.keys(this.fieldErrors).length === 0) {
        this.modalErrorMessage = 'Please fill in all required fields (code, location, max capacity).';
      }
      return;
    }

    this.isCreating = true;
    this.storageAreaService.createStorageArea(this.newStorageArea)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdStorageArea) => {
          console.log('Storage area created successfully:', createdStorageArea);
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Storage area with code "${createdStorageArea.code}" created successfully!`;
          this.statusMessageType = 'success';
          console.debug('Status message set (create):', this.statusMessage);
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadStorageAreas();
        },
        error: (error) => {
          console.error('Error creating storage area:', error);
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
      errorMessage = 'Error creating storage area. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidStorageArea(): boolean {
    // Reset field errors
    this.fieldErrors = {};

    let isValid = true;

    // Validate code
    if (!this.newStorageArea.code?.trim()) {
      this.fieldErrors['code'] = 'Storage area code cannot be empty.';
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(this.newStorageArea.code.trim())) {
      this.fieldErrors['code'] = 'Storage area code must be alphanumeric (letters and digits only).';
      isValid = false;
    }

    // Validate location
    if (!this.newStorageArea.location?.trim()) {
      this.fieldErrors['location'] = 'Storage area location cannot be empty.';
      isValid = false;
    }

    // Validate max capacity
    if (this.newStorageArea.maxCapacity === undefined || this.newStorageArea.maxCapacity <= 0) {
      this.fieldErrors['maxcapacity'] = 'Max capacity must be greater than zero.';
      isValid = false;
    }

    // Validate current capacity
    if (this.newStorageArea.currentCapacity === undefined || this.newStorageArea.currentCapacity < 0) {
      this.fieldErrors['currentcapacity'] = 'Current capacity cannot be negative.';
      isValid = false;
    } else if (this.newStorageArea.maxCapacity !== undefined &&
               this.newStorageArea.currentCapacity > this.newStorageArea.maxCapacity) {
      this.fieldErrors['currentcapacity'] = 'Current capacity cannot exceed max capacity.';
      isValid = false;
    }

    return isValid;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditStorageArea() {
    this.editStorageArea = {
      code: '',
      location: '',
      storageAreaType: StorageAreaType.Yard,
      maxCapacity: 1,
      currentCapacity: 0,
      storageAreaDocks: []
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditStorageArea = null;
    this.editDockAssociation = { dockName: '', distance: 0 };
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditStorageArea();
    this.isEditing = false;
  }

  onSaveEditStorageArea() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditStorageArea()) {
      if (Object.keys(this.editFieldErrors).length === 0) {
        this.editModalErrorMessage = 'Please fill in all required fields (location, max capacity).';
      }
      return;
    }

    if (!this.selectedStorageArea?.id) {
      this.editModalErrorMessage = 'No storage area selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.storageAreaService.updateStorageArea(this.selectedStorageArea.id, this.editStorageArea)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedStorageArea) => {
          console.log('Storage area updated successfully:', updatedStorageArea);
          this.closeEditModal();
          this.loadStorageAreas();
          this.statusHiding = false;
          this.statusMessage = `Storage area with code "${this.selectedStorageArea?.code}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating storage area:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditStorageArea) return false;
    const orig = this.originalEditStorageArea;
    const curr = this.editStorageArea;
    const locationChanged = (orig.location || '').trim() !== (curr.location || '').trim();
    const maxCapacityChanged = (orig.maxCapacity || 0) !== (curr.maxCapacity || 0);
    const currentCapacityChanged = (orig.currentCapacity || 0) !== (curr.currentCapacity || 0);

    // Check if dock associations changed
    const origDocks = orig.storageAreaDocks || [];
    const currDocks = curr.storageAreaDocks || [];
    const docksChanged = JSON.stringify(origDocks) !== JSON.stringify(currDocks);

    return locationChanged || maxCapacityChanged || currentCapacityChanged || docksChanged;
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
      errorMessage = 'Error updating storage area. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditStorageArea(): boolean {
    // Reset field errors
    this.editFieldErrors = {};

    let isValid = true;

    // Validate location
    if (!this.editStorageArea.location?.trim()) {
      this.editFieldErrors['location'] = 'Storage area location cannot be empty.';
      isValid = false;
    }

    // Validate max capacity
    if (this.editStorageArea.maxCapacity === undefined || this.editStorageArea.maxCapacity <= 0) {
      this.editFieldErrors['maxcapacity'] = 'Max capacity must be greater than zero.';
      isValid = false;
    }

    // Validate current capacity
    if (this.editStorageArea.currentCapacity === undefined || this.editStorageArea.currentCapacity < 0) {
      this.editFieldErrors['currentcapacity'] = 'Current capacity cannot be negative.';
      isValid = false;
    } else if (this.editStorageArea.maxCapacity !== undefined &&
               this.editStorageArea.currentCapacity > this.editStorageArea.maxCapacity) {
      this.editFieldErrors['currentcapacity'] = 'Current capacity cannot exceed max capacity.';
      isValid = false;
    }

    return isValid;
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
