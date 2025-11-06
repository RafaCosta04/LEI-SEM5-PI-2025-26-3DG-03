import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { QualificationService } from '../../services/qualification.service';
import { QualificationModel } from '../../models/qualification.model';

@Component({
  selector: 'app-qualification',
  imports: [CommonModule, FormsModule],
  templateUrl: './qualification.html',
  styleUrl: './qualification.css',
})
export class Qualification implements OnInit, OnDestroy {
  qualifications: QualificationModel[] = [];
  filteredQualifications: QualificationModel[] = [];
  selectedQualification: QualificationModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;
  
  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  // Controls the hide animation when clearing the status message
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newQualification: QualificationModel = {
    code: '',
    name: '',
    description: ''
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editQualification: QualificationModel = {
    code: '',
    name: '',
    description: ''
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditQualification: QualificationModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private qualificationService: QualificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadQualifications();
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

  loadQualifications() {
    this.isLoading = true;
    this.qualificationService.getAllQualifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualifications) => {
          this.qualifications = qualifications;
          this.filteredQualifications = [...this.qualifications];
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error loading qualifications. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading qualifications:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredQualifications = [...this.qualifications];
      return;
    }

    const localResults = this.qualifications.filter(q =>
      q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredQualifications = localResults;
    } else {
      this.searchByName(searchTerm);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.qualificationService.getQualificationsByName(name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (qualifications) => {
          this.filteredQualifications = qualifications;
          this.isLoading = false;
        },
        error: (error) => {
            this.statusHiding = false;
            this.statusMessage = 'Error searching for qualifications. Please try again.';
          this.statusMessageType = 'error';
          console.error('Error searching qualifications:', error);
          this.filteredQualifications = [];
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

  clearSearch() {
    this.searchTerm = '';
    this.filteredQualifications = [...this.qualifications];
  }

  selectQualification(qualification: QualificationModel) {
    if (this.selectedQualification?.id === qualification.id) {
      this.selectedQualification = null;
    } else {
      this.selectedQualification = qualification;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewQualification();
    console.log('Opening create qualification modal');
  }

  onUpdate() {
    if (this.selectedQualification) {
      this.showEditModal = true;
      this.resetEditQualification();
      this.editQualification = { ...this.selectedQualification };

      this.originalEditQualification = { ...this.editQualification };
      console.log('Opening edit qualification modal for:', this.selectedQualification);
    } else {
      alert('Please select a qualification to update.');
    }
  }

  refreshList() {
    this.loadQualifications();
    this.selectedQualification = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewQualification() {
    this.newQualification = {
      code: '',
      name: '',
      description: ''
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewQualification();
    this.isCreating = false;
  }

  onSaveNewQualification() {

    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidQualification()) {
      this.modalErrorMessage = 'Please fill in all required fields (code, name, description).';
      return;
    }

    this.isCreating = true;
    this.qualificationService.createQualification(this.newQualification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdQualification) => {
          console.log('Qualification created successfully:', createdQualification);
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Qualification with code "${createdQualification.code}" created successfully!`;
          this.statusMessageType = 'success';
          console.debug('Status message set (create):', this.statusMessage);
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadQualifications();
        },
        error: (error) => {
          console.error('Error creating qualification:', error);
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
      errorMessage = 'Error creating qualification. Please try again.';
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidQualification(): boolean {
    return !!(this.newQualification.code?.trim() &&
              this.newQualification.name?.trim() &&
              this.newQualification.description?.trim());
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditQualification() {
    this.editQualification = {
      code: '',
      name: '',
      description: ''
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditQualification = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditQualification();
    this.isEditing = false;
  }

  onSaveEditQualification() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditQualification()) {
      this.editModalErrorMessage = 'Please fill in all required fields (name, description).';
      return;
    }

    if (!this.selectedQualification?.id) {
      this.editModalErrorMessage = 'No qualification selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.qualificationService.updateQualification(this.selectedQualification.id, this.editQualification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedQualification) => {
          console.log('Qualification updated successfully:', updatedQualification);
          this.closeEditModal();
          this.loadQualifications();
          this.statusHiding = false;
          this.statusMessage = `Qualification with code "${this.selectedQualification?.code}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating qualification:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditQualification) return false;
    const orig = this.originalEditQualification;
    const curr = this.editQualification;
    const nameChanged = (orig.name || '').trim() !== (curr.name || '').trim();
    const descChanged = (orig.description || '').trim() !== (curr.description || '').trim();
    return nameChanged || descChanged;
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
      errorMessage = 'Error updating qualification. Please try again.';
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditQualification(): boolean {
    return !!(this.editQualification.name?.trim() &&
              this.editQualification.description?.trim());
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
