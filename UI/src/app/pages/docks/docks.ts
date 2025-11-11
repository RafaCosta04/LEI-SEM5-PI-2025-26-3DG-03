import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { DocksService } from '../../services/docks.service';
import { DocksModel } from '../../models/docks.model';

@Component({
  selector: 'app-docks',
  imports: [CommonModule, FormsModule],
  templateUrl: './docks.html',
  styleUrl: './docks.css',
})
export class Docks implements OnInit, OnDestroy {
  docks: DocksModel[] = [];
  filteredDocks: DocksModel[] = [];
  selectedDock: DocksModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;
  
  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;
  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newDock: DocksModel = {
    name: '',
    location: '',
    length: 0,
    depth: 0,
    maxDraft: 0,
    vesselTypes: []
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editDock: DocksModel = {
    name: '',
    location: '',
    length: 0,
    depth: 0,
    maxDraft: 0,
    vesselTypes: []
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditDock: DocksModel | null = null;


  // Vessel types input helpers
  vesselTypesInput: string = '';
  editVesselTypesInput: string = '';

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private docksService: DocksService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDocks();
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

  loadDocks() {
    this.isLoading = true;
    this.docksService.getAllDocks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docks) => {
          this.docks = docks;
          this.filteredDocks = [...this.docks];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading docks. Please check your connection.';
          this.statusMessageType = 'error';  
          console.error('Error loading docks:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredDocks = [...this.docks];
      return;
    }

    const localResults = this.docks.filter(d =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredDocks = localResults;
    } else {
      this.searchByName(searchTerm);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.docksService.getDocksByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docks) => {
          this.filteredDocks = docks;
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching for docks. Please try again.';
          this.statusMessageType = 'error';   
          console.error('Error searching docks:', error);
          this.filteredDocks = [];
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
    this.filteredDocks = [...this.docks];
    this.searchSubject$.next(this.searchTerm);
  }

  private handleSearchTermChange(term: string) {
    if (this.searchClearTimer) { clearTimeout(this.searchClearTimer); this.searchClearTimer = null; }
    if (!term || !term.trim()) {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.searchClearTimer = setTimeout(() => { this.clearStatusMessage(); this.searchClearTimer = null; }, 2000);
      }
    }
  }

  selectDock(dock: DocksModel) {
    if (this.selectedDock?.id === dock.id) {
      this.selectedDock = null;
    } else {
      this.selectedDock = dock;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewDock();
  }

  onUpdate() {
    if (this.selectedDock) {
      this.showEditModal = true;
      this.resetEditDock();
      this.editDock = { ...this.selectedDock };
      // Set vessel types input for editing
      this.editVesselTypesInput = this.selectedDock.vesselTypes?.join(', ') || '';
      console.log('Opening edit dock modal for:', this.selectedDock);
    } else {
      alert('Please select a dock to update.');
    }
  }

  refreshList() {
    this.loadDocks();
    this.selectedDock = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewDock() {
    this.newDock = {
      name: '',
      location: '',
      length: 0,
      depth: 0,
      maxDraft: 0,
      vesselTypes: []
    };
    this.vesselTypesInput = '';
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewDock();
    this.isCreating = false;
  }

  onSaveNewDock() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    // Process vessel types input
    if (this.vesselTypesInput.trim()) {
      this.newDock.vesselTypes = this.vesselTypesInput
        .split(',')
        .map(type => type.trim())
        .filter(type => type.length > 0);
    } else {
      this.newDock.vesselTypes = [];
    }

    if (!this.isValidDock()) {
      this.modalErrorMessage = 'Please fill in all required fields (name, location, length, depth, maxDraft).';
      return;
    }

    this.isCreating = true;
    this.docksService.createDock(this.newDock)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdDock) => {
          console.log('Dock created successfully:', createdDock);
          this.closeCreateModal();
          this.loadDocks();
        },
        error: (error) => {
          console.error('Error creating dock:', error);
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
      errorMessage = 'Error creating dock. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidDock(): boolean {
    return !!(this.newDock.name?.trim() &&
              this.newDock.location?.trim() &&
              this.newDock.length && this.newDock.length > 0 &&
              this.newDock.depth && this.newDock.depth > 0 &&
              this.newDock.maxDraft && this.newDock.maxDraft > 0);
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditDock() {
    this.editDock = {
      name: '',
      location: '',
      length: 0,
      depth: 0,
      maxDraft: 0,
      vesselTypes: []
    };
    this.editVesselTypesInput = '';
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditDock();
    this.isEditing = false;
  }
  onSaveEditDock() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    // Process vessel types input
    if (this.editVesselTypesInput.trim()) {
      this.editDock.vesselTypes = this.editVesselTypesInput
        .split(',')
        .map(type => type.trim())
        .filter(type => type.length > 0);
    } else {
      this.editDock.vesselTypes = [];
    }

    if (!this.isValidEditDock()) {
      this.editModalErrorMessage = 'Please fill in all required fields (name, location, length, depth, maxDraft).';
      return;
    }

    if (!this.selectedDock?.id) {
      this.editModalErrorMessage = 'No dock selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.docksService.updateDock(this.selectedDock.id, this.editDock)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDock) => {
          console.log('Dock updated successfully:', updatedDock);
          this.closeEditModal();
          this.loadDocks();
          this.selectedDock = null;
        },
        error: (error) => {
          console.error('Error updating dock:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
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
      errorMessage = 'Error updating dock. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditDock(): boolean {
    return !!(this.editDock.name?.trim() &&
              this.editDock.location?.trim() &&
              this.editDock.length && this.editDock.length > 0 &&
              this.editDock.depth && this.editDock.depth > 0 &&
              this.editDock.maxDraft && this.editDock.maxDraft > 0);
  }

  isEditDirty(): boolean {
    if (!this.originalEditDock) return false;
    const orig = this.originalEditDock;
    const curr = this.editDock;
    const nameChanged = (orig.name || '').trim() !== (curr.name || '').trim();
    const locationChanged = (orig.location || '').trim() !== (curr.location || '').trim();
    const lengthChanged = (orig.length || 0) !== (curr.length || 0);
    const depthChanged = (orig.depth || 0) !== (curr.depth || 0);
    const maxDraftChanged = (orig.maxDraft || 0) !== (curr.maxDraft || 0);
    const vesselTypesOrig = (orig.vesselTypes || []).slice().sort().join(',');
    const vesselTypesCurr = (curr.vesselTypes || []).slice().sort().join(',');
    const vesselTypesChanged = vesselTypesOrig !== vesselTypesCurr;
    return nameChanged || locationChanged || lengthChanged || depthChanged || maxDraftChanged || vesselTypesChanged;
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
