import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { RepresentativeService } from '../../services/representative.service';
import { RepresentativeModel } from '../../models/representative.model';

@Component({
  selector: 'app-representative',
  imports: [CommonModule, FormsModule],
  templateUrl: './representative.html',
  styleUrl: './representative.css',
})
export class Representative implements OnInit, OnDestroy {
  representatives: RepresentativeModel[] = [];
  filteredRepresentatives: RepresentativeModel[] = [];
  selectedRepresentative: RepresentativeModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newRepresentative: RepresentativeModel = {
    organizationName: '',
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editRepresentative: RepresentativeModel = {
    organizationName: '',
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditRepresentative: RepresentativeModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private representativeService: RepresentativeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRepresentatives();
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

  loadRepresentatives() {
    this.isLoading = true;
    this.representativeService.getAllRepresentatives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (representatives) => {
          this.representatives = representatives;
          this.filteredRepresentatives = [...this.representatives];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading representatives. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading representatives:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredRepresentatives = [...this.representatives];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }

    const localResults = this.representatives.filter(rep =>
      rep.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.citizenId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.filteredRepresentatives = localResults;

    if (localResults.length === 0) {
      this.statusHiding = false;
      this.statusMessage = `No results found for "${searchTerm}"`;
      this.statusMessageType = 'error';
    } else {
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
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
    this.searchTerm = '';
    this.filteredRepresentatives = [...this.representatives];
    this.searchSubject$.next(this.searchTerm);
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredRepresentatives = [...this.representatives];
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

  selectRepresentative(representative: RepresentativeModel) {
    if (this.selectedRepresentative?.id === representative.id) {
      this.selectedRepresentative = null;
    } else {
      this.selectedRepresentative = representative;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewRepresentative();
  }

  onUpdate() {
    if (this.selectedRepresentative) {
      this.showEditModal = true;
      this.resetEditRepresentative();
      this.editRepresentative = { ...this.selectedRepresentative };
      this.originalEditRepresentative = { ...this.editRepresentative };
    } else {
      alert('Please select a representative to update.');
    }
  }

  refreshList() {
    this.loadRepresentatives();
    this.selectedRepresentative = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewRepresentative() {
    this.newRepresentative = {
      organizationName: '',
      name: '',
      citizenId: '',
      nationality: '',
      email: '',
      phoneNumber: ''
    };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewRepresentative();
    this.isCreating = false;
  }

  onSaveNewRepresentative() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidRepresentative()) {
      this.modalErrorMessage = 'Please fill in all required fields (organization name, name, citizen ID, nationality, email, phone number).';
      return;
    }

    this.isCreating = true;
    this.representativeService.createRepresentative(this.newRepresentative)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdRepresentative) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Representative "${createdRepresentative.name}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadRepresentatives();
        },
        error: (error) => {
          console.error('Error creating representative:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};

    let errorMessage = 'Error creating representative. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidRepresentative(): boolean {
    return !!(this.newRepresentative.organizationName?.trim() &&
              this.newRepresentative.name?.trim() &&
              this.newRepresentative.citizenId?.trim() &&
              this.newRepresentative.nationality?.trim() &&
              this.newRepresentative.email?.trim() &&
              this.newRepresentative.phoneNumber?.trim());
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditRepresentative() {
    this.editRepresentative = {
      organizationName: '',
      name: '',
      citizenId: '',
      nationality: '',
      email: '',
      phoneNumber: ''
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditRepresentative = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditRepresentative();
    this.isEditing = false;
  }

  onSaveEditRepresentative() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditRepresentative()) {
      this.editModalErrorMessage = 'Please fill in all required fields (organization name, name, nationality, email, phone number).';
      return;
    }

    if (!this.selectedRepresentative?.id) {
      this.editModalErrorMessage = 'No representative selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.representativeService.updateRepresentative(this.selectedRepresentative.id, this.editRepresentative)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadRepresentatives();
          this.statusHiding = false;
          this.statusMessage = `Representative "${this.selectedRepresentative?.name}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating representative:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
    }
  isEditDirty(): boolean {
    if (!this.originalEditRepresentative) return false;

    const orig = this.originalEditRepresentative;
    const curr = this.editRepresentative;

    return (orig.organizationName || '').trim() !== (curr.organizationName || '').trim() ||
           (orig.name || '').trim() !== (curr.name || '').trim() ||
           (orig.nationality || '').trim() !== (curr.nationality || '').trim() ||
           (orig.email || '').trim() !== (curr.email || '').trim() ||
           (orig.phoneNumber || '').trim() !== (curr.phoneNumber || '').trim();
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};

    let errorMessage = 'Error updating representative. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditRepresentative(): boolean {
    return !!(this.editRepresentative.organizationName?.trim() &&
              this.editRepresentative.name?.trim() &&
              this.editRepresentative.nationality?.trim() &&
              this.editRepresentative.email?.trim() &&
              this.editRepresentative.phoneNumber?.trim());
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
