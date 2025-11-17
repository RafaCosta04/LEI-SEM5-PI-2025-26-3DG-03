import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { VesselService } from '../../services/vessel.service';
import { VesselTypeService } from '../../services/vesselType.service';
import { VesselRecordModel } from '../../models/vessel.model';
import { VesselTypeModel } from '../../models/vesselType.model';

@Component({
  selector: 'app-vessel',
  imports: [CommonModule, FormsModule],
  templateUrl: './vessel.html',
  styleUrl: './vessel.css',
})
export class Vessel implements OnInit, OnDestroy {
  vesselRecords: VesselRecordModel[] = [];
  filteredVesselRecords: VesselRecordModel[] = [];
  selectedVesselRecord: VesselRecordModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;
  // Vessel Types for dropdown
  vesselTypes: VesselTypeModel[] = [];
  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newVesselRecord: VesselRecordModel = {
    imoNumber: '',
    vesselName: '',
    vesselTypeName: '',
    operator: ''
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editVesselRecord: VesselRecordModel = {
    imoNumber: '',
    vesselName: '',
    vesselTypeName: '',
    operator: ''
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditVesselRecord: VesselRecordModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();


  constructor(
    private vesselService: VesselService,
    private vesselTypeService: VesselTypeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVesselRecords();
    this.loadVesselTypes();
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
        this.performSearch(searchTerm);
      });
  }

  loadVesselRecords() {
    this.isLoading = true;
    this.vesselService.getAllVesselRecords()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vesselRecords) => {
          this.vesselRecords = vesselRecords;
          this.filteredVesselRecords = [...this.vesselRecords];
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error loading vessel records. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading vessel records:', error);
          this.isLoading = false;
        }
      });
  }

  loadVesselTypes() {
    this.vesselTypeService.getAllVesselTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vesselTypes) => {
          this.vesselTypes = vesselTypes;
        },
        error: (error) => {
          console.error('Error loading vessel types:', error);
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredVesselRecords = [...this.vesselRecords];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }

    const localResults = this.vesselRecords.filter(v =>
      v.imoNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vesselName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vesselTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.operator?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredVesselRecords = localResults;
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
    } else {
      this.searchByVesselName(searchTerm);
    }
  }

  searchByVesselName(name: string) {
    this.isLoading = true;
    this.vesselService.getVesselRecordByVesselName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vesselRecord) => {
          if (vesselRecord) {
            this.filteredVesselRecords = [vesselRecord];
            if (this.statusMessage && this.statusMessageType === 'error') {
              this.clearStatusMessage();
            }
          } else {
            this.filteredVesselRecords = [];
            this.statusHiding = false;
            this.statusMessage = `No results found for "${name}"`;
            this.statusMessageType = 'error';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error searching for vessel records. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching vessel records:', error);
          this.filteredVesselRecords = [];
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

  clearSearch() { this.clearSearchAndNotify(); }

  clearSearchAndNotify() { this.searchTerm = ''; this.filteredVesselRecords = [...this.vesselRecords]; this.searchSubject$.next(this.searchTerm); }

  selectVesselRecord(vesselRecord: VesselRecordModel) {
    if (this.selectedVesselRecord?.id === vesselRecord.id) {
      this.selectedVesselRecord = null;
    } else {
      this.selectedVesselRecord = vesselRecord;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewVesselRecord();
  }

  onUpdate() {
    if (this.selectedVesselRecord) {
      this.showEditModal = true;
      this.resetEditVesselRecord();
      this.editVesselRecord = { ...this.selectedVesselRecord };

      this.originalEditVesselRecord = { ...this.editVesselRecord };
    } else {
      alert('Please select a vessel record to update.');
    }
  }

  refreshList() {
    this.loadVesselRecords();
    this.selectedVesselRecord = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewVesselRecord() {
    this.newVesselRecord = {
      imoNumber: '',
      vesselName: '',
      vesselTypeName: '',
      operator: ''
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewVesselRecord();
    this.isCreating = false;
  }

  onSaveNewVesselRecord() {

    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidVesselRecord()) {
      this.modalErrorMessage = 'Please fill in all required fields (IMO Number, vessel name, vessel type, operator).';
      return;
    }

    if (!this.isValidIMONumber(this.newVesselRecord.imoNumber || '')) {
      this.modalErrorMessage = 'IMO Number must have exactly 7 digits.';
      return;
    }

    this.isCreating = true;
    this.vesselService.createVesselRecord(this.newVesselRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdVesselRecord) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Vessel record with IMO "${createdVesselRecord.imoNumber}" created successfully!`;
          this.statusMessageType = 'success';
          console.debug('Status message set (create):', this.statusMessage);
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadVesselRecords();
        },
        error: (error) => {
          console.error('Error creating vessel record:', error);
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
      errorMessage = 'Error creating vessel record. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidVesselRecord(): boolean {
    return !!(this.newVesselRecord.imoNumber?.trim() &&
              this.newVesselRecord.vesselName?.trim() &&
              this.newVesselRecord.vesselTypeName?.trim() &&
              this.newVesselRecord.operator?.trim());
  }

  private isValidIMONumber(imoNumber: string): boolean {
    return imoNumber.length === 7 && /^\d{7}$/.test(imoNumber);
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditVesselRecord() {
    this.editVesselRecord = {
      imoNumber: '',
      vesselName: '',
      vesselTypeName: '',
      operator: ''
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditVesselRecord = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditVesselRecord();
    this.isEditing = false;
  }

  onSaveEditVesselRecord() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditVesselRecord()) {
      this.editModalErrorMessage = 'Please fill in all required fields (vessel name, vessel type, operator).';
      return;
    }

    if (!this.selectedVesselRecord?.imoNumber) {
      this.editModalErrorMessage = 'No vessel record selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.vesselService.updateVesselRecord(this.selectedVesselRecord.imoNumber, this.editVesselRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedVesselRecord) => {
          this.closeEditModal();
          this.loadVesselRecords();
          this.statusHiding = false;
          this.statusMessage = `Vessel record with IMO "${this.selectedVesselRecord?.imoNumber}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating vessel record:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditVesselRecord) return false;
    const orig = this.originalEditVesselRecord;
    const curr = this.editVesselRecord;
    const vesselNameChanged = (orig.vesselName || '').trim() !== (curr.vesselName || '').trim();
    const vesselTypeChanged = (orig.vesselTypeName || '').trim() !== (curr.vesselTypeName || '').trim();
    const operatorChanged = (orig.operator || '').trim() !== (curr.operator || '').trim();
    return vesselNameChanged || vesselTypeChanged || operatorChanged;
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
      errorMessage = 'Error updating vessel record. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditVesselRecord(): boolean {
    return !!(this.editVesselRecord.vesselName?.trim() &&
              this.editVesselRecord.vesselTypeName?.trim() &&
              this.editVesselRecord.operator?.trim());
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
