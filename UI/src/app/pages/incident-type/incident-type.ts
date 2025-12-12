import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { IncidentTypeService } from '../../services-oem/incidentType.service';
import { IncidentTypeModel } from '../../models/incidentType.model';

@Component({
  selector: 'app-incident-type',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './incident-type.html',
  styleUrl: './incident-type.css',
})
export class IncidentType implements OnInit, OnDestroy {
  incidentTypes: IncidentTypeModel[] = [];
  filteredIncidentTypes: IncidentTypeModel[] = [];
  selectedIncidentType: IncidentTypeModel | null = null;
  searchTerm: string = '';
  filterClassification: string = '';
  filterHasParent: string = '';
  isLoading: boolean = false;

  // Page status messages
  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;
  // Search-specific error
  searchError: string = '';
  searchErrorHiding: boolean = false;

  // Create modal
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newIncidentType: any = { code: '', name: '', description: '', classification: 'Minor', parentIncidentTypeCode: null };
  modalErrorMessage: string = '';
  modalSuccessMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit modal
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editIncidentType: any = { code: '', name: '', description: '', classification: 'Minor', parentIncidentTypeCode: null };
  originalEditIncidentType: any | null = null;
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private incidentTypeService: IncidentTypeService) {}

  ngOnInit() {
    this.loadIncidentTypes();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => this.applyFilter(term));
  }

  onSearchInput() {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.hideSearchErrorImmediate();
    }
    this.searchSubject$.next(this.searchTerm);
  }

  onFilterChange() {
    this.applyAllFilters();
  }

  applyFilter(term: string) {
    this.applyAllFilters();
  }

  applyAllFilters() {
    let results = [...this.incidentTypes];

    // Apply search term filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase();
      results = results.filter(it =>
        (it.code || '').toLowerCase().includes(t) ||
        (it.name || '').toLowerCase().includes(t) ||
        (it.description || '').toLowerCase().includes(t)
      );
    }

    // Apply classification filter
    if (this.filterClassification) {
      results = results.filter(it => it.classification === this.filterClassification);
    }

    // Apply hasParent filter
    if (this.filterHasParent) {
      const hasParent = this.filterHasParent === 'true';
      results = results.filter(it => {
        const has = !!(it.parentIncidentTypeCode && it.parentIncidentTypeCode.trim());
        return has === hasParent;
      });
    }

    this.filteredIncidentTypes = results;

    if (results.length > 0) {
      this.hideSearchErrorImmediate();
    } else if (this.searchTerm || this.filterClassification || this.filterHasParent) {
      // Only try server-side search if we have a search term and no local results
      if (this.searchTerm && this.searchTerm.trim()) {
        this.searchServerSide(this.searchTerm);
      }
    }
  }

  searchServerSide(term: string) {
    // Try to find by code
    this.incidentTypeService.getIncidentTypeByCode(term).subscribe({
      next: (result) => {
        if (result) {
          this.filteredIncidentTypes = [result];
          this.hideSearchErrorImmediate();
        } else {
          // Try by name
          this.incidentTypeService.getIncidentTypeByName(term).subscribe({
            next: (byName) => {
              if (byName) {
                this.filteredIncidentTypes = [byName];
                this.hideSearchErrorImmediate();
              } else {
                this.showSearchError(`No incident types found for "${term}".`);
              }
            },
            error: (err) => {
              this.showSearchError(`No incident types found for "${term}".`);
            }
          });
        }
      },
      error: (err) => {
        // Try by name
        this.incidentTypeService.getIncidentTypeByName(term).subscribe({
          next: (byName) => {
            if (byName) {
              this.filteredIncidentTypes = [byName];
              this.hideSearchErrorImmediate();
            } else {
              this.showSearchError(`No incident types found for "${term}".`);
            }
          },
          error: (err2) => {
            this.showSearchError(`No incident types found for "${term}".`);
          }
        });
      }
    });
  }

  loadIncidentTypes() {
    this.isLoading = true;
    this.incidentTypeService.getAllIncidentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.incidentTypes = res || [];
          this.filteredIncidentTypes = [...this.incidentTypes];
          this.isLoading = false;
        },
        error: (err) => {
          this.showSearchError('Error loading incident types. Please check your connection.');
          console.error('Error loading incident types', err);
          this.isLoading = false;
        }
      });
  }

  showSearchError(message: string) {
    this.searchError = message;
    this.searchErrorHiding = false;
  }

  hideSearchErrorImmediate() {
    if (!this.searchError) return;
    this.searchErrorHiding = true;
    setTimeout(() => {
      this.searchError = '';
      this.searchErrorHiding = false;
    }, 220);
  }

  selectIncidentType(it: IncidentTypeModel) {
    if (this.selectedIncidentType?.code === it.code) {
      this.selectedIncidentType = null;
      return;
    }
    this.selectedIncidentType = it;
  }

  // Create
  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewIncidentType();
  }

  resetNewIncidentType() {
    this.newIncidentType = { code: '', name: '', description: '', classification: 'Minor', parentIncidentTypeCode: null };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewIncidentType();
    this.isCreating = false;
  }

  onSaveNewIncidentType() {
    this.modalErrorMessage = '';
    this.modalSuccessMessage = '';
    this.fieldErrors = {};

    if (!this.newIncidentType.code?.trim() || !this.newIncidentType.name?.trim() || !this.newIncidentType.description?.trim()) {
      this.modalErrorMessage = 'Please fill required fields.';
      return;
    }

    // Check if parent is the same as the code being created
    if (this.newIncidentType.parentIncidentTypeCode &&
        this.newIncidentType.parentIncidentTypeCode.trim() === this.newIncidentType.code.trim()) {
      this.fieldErrors['parentIncidentTypeCode'] = 'An incident type cannot be its own parent.';
      this.modalErrorMessage = 'An incident type cannot be its own parent.';
      return;
    }

    // Clean up empty parent
    if (!this.newIncidentType.parentIncidentTypeCode || !this.newIncidentType.parentIncidentTypeCode.trim()) {
      this.newIncidentType.parentIncidentTypeCode = null;
    }

    this.isCreating = true;
    this.incidentTypeService.createIncidentType(this.newIncidentType).subscribe({
      next: (created) => {
        this.isCreating = false;
        this.showCreateModal = false;
        this.loadIncidentTypes();
        this.statusMessage = `Incident type "${created?.code || this.newIncidentType.code}" created successfully.`;
        this.statusMessageType = 'success';
        this.statusHiding = false;
        setTimeout(() => this.clearStatusMessage(), 3000);
      },
      error: (err) => {
        this.isCreating = false;
        this.handleCreateError(err);
      }
    });
  }

  // Edit
  onUpdate() {
    if (!this.selectedIncidentType) return;
    this.editIncidentType = { ...this.selectedIncidentType };
    this.originalEditIncidentType = { ...this.editIncidentType };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditIncidentType();
    this.isEditing = false;
  }

  resetEditIncidentType() {
    this.editIncidentType = { code: '', name: '', description: '', classification: 'Minor', parentIncidentTypeCode: null };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditIncidentType = null;
  }

  isEditDirty(): boolean {
    if (!this.originalEditIncidentType) return false;
    const orig = this.originalEditIncidentType;
    const curr = this.editIncidentType || {};

    const nameChanged = (orig.name || '').trim() !== (curr.name || '').trim();
    const descChanged = (orig.description || '').trim() !== (curr.description || '').trim();
    const classChanged = (orig.classification || '') !== (curr.classification || '');
    const parentChanged = (orig.parentIncidentTypeCode || '') !== (curr.parentIncidentTypeCode || '');

    return nameChanged || descChanged || classChanged || parentChanged;
  }

  onSaveEditIncidentType() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.editIncidentType.name?.trim() || !this.editIncidentType.description?.trim()) {
      this.editModalErrorMessage = 'Please fill required fields.';
      return;
    }

    if (!this.selectedIncidentType) {
      this.editModalErrorMessage = 'No incident type selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    // Check if parent is the same as the code being edited
    if (this.editIncidentType.parentIncidentTypeCode &&
        this.editIncidentType.parentIncidentTypeCode.trim() === this.editIncidentType.code.trim()) {
      this.editFieldErrors['parentIncidentTypeCode'] = 'An incident type cannot be its own parent.';
      this.editModalErrorMessage = 'An incident type cannot be its own parent.';
      return;
    }

    // Prepare payload - ensure all required fields are present
    const payload: any = {
      code: this.editIncidentType.code,
      name: this.editIncidentType.name.trim(),
      description: this.editIncidentType.description.trim(),
      classification: this.editIncidentType.classification
    };

    // Only include parentIncidentTypeCode if it has a value
    if (this.editIncidentType.parentIncidentTypeCode && this.editIncidentType.parentIncidentTypeCode.trim()) {
      payload.parentIncidentTypeCode = this.editIncidentType.parentIncidentTypeCode.trim();
    }

    this.isEditing = true;
    this.incidentTypeService.updateIncidentType(this.editIncidentType.code, payload).subscribe({
      next: (updated) => {
        this.isEditing = false;
        this.showEditModal = false;

        const code = this.editIncidentType.code;
        const returned = updated && typeof updated === 'object' ? updated : this.editIncidentType;
        const normalized: any = { ...this.editIncidentType, ...returned };

        // Update arrays
        const uIdx = this.incidentTypes.findIndex(x => x.code === code);
        if (uIdx !== -1) {
          this.incidentTypes[uIdx] = { ...this.incidentTypes[uIdx], ...normalized };
        }
        const fIdx = this.filteredIncidentTypes.findIndex(x => x.code === code);
        if (fIdx !== -1) {
          this.filteredIncidentTypes[fIdx] = { ...this.filteredIncidentTypes[fIdx], ...normalized };
        }
        if (this.selectedIncidentType && this.selectedIncidentType.code === code) {
          this.selectedIncidentType = { ...this.selectedIncidentType, ...normalized };
        }

        this.applyAllFilters();
        this.resetEditIncidentType();
        this.statusHiding = false;
        this.statusMessage = `Incident type "${code}" updated successfully.`;
        this.statusMessageType = 'success';
        setTimeout(() => this.clearStatusMessage(), 3000);
      },
      error: (err) => {
        this.isEditing = false;
        console.error('Error updating incident type', err);
        this.handleEditError(err);
      }
    });
  }

  extractErrorMessage(err: any): string {
    try {
      if (!err) return '';
      if (err.error && typeof err.error === 'string') return this.cleanErrorMessage(err.error);
      if (err.error && Array.isArray(err.error)) return err.error.map((e: any) => this.cleanErrorMessage(String(e))).join('; ');
      if (err.error && typeof err.error === 'object') {
        if (err.error.message) return this.cleanErrorMessage(err.error.message);
        if (err.error.errors) {
          try {
            const arr = [] as string[];
            for (const k in err.error.errors) {
              const v = err.error.errors[k];
              if (Array.isArray(v)) arr.push(...v.map((x: any) => this.cleanErrorMessage(String(x))));
              else arr.push(this.cleanErrorMessage(String(v)));
            }
            if (arr.length) return arr.join('; ');
          } catch (e) { /* ignore */ }
        }
      }
      if (err.message) return this.cleanErrorMessage(err.message);
      return JSON.stringify(err);
    } catch (e) { return 'Unknown error'; }
  }

  private cleanErrorMessage(message: string): string {
    // Remove common error prefixes
    const prefixes = [
      'Unexpected error creating IncidentType: ',
      'Unexpected error updating IncidentType: ',
      'Error creating IncidentType: ',
      'Error updating IncidentType: '
    ];
    let cleaned = message;
    for (const prefix of prefixes) {
      if (cleaned.startsWith(prefix)) {
        cleaned = cleaned.substring(prefix.length);
        break;
      }
    }
    return cleaned;
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

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    this.modalErrorMessage = '';
    try {
      const backendError = error?.error ?? error?.originalError?.error ?? null;

      if (!backendError) {
        this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating incident type.';
        return;
      }

      if (Array.isArray(backendError)) {
        this.modalErrorMessage = backendError.map((e: any) => this.cleanErrorMessage(String(e))).join('; ');
        return;
      }

      if (backendError && typeof backendError === 'object' && backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const v = backendError.errors[field];
          const errorMsg = Array.isArray(v) ? v.join('; ') : String(v);
          this.fieldErrors[field.toLowerCase()] = this.cleanErrorMessage(errorMsg);
        }
        const msg = backendError.message ?? backendError.title ?? 'Please correct the validation errors below.';
        this.modalErrorMessage = this.cleanErrorMessage(msg);
        return;
      }

      if (backendError && typeof backendError === 'object' && (backendError.message || backendError.title)) {
        this.modalErrorMessage = this.cleanErrorMessage(backendError.message ?? backendError.title);
        return;
      }

      if (typeof backendError === 'string') {
        this.modalErrorMessage = this.cleanErrorMessage(backendError);
        return;
      }

      this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating incident type.';
    } catch (e) {
      this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating incident type.';
    }
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};
    this.editModalErrorMessage = '';
    try {
      const backendError = error?.error ?? error?.originalError?.error ?? null;

      if (!backendError) {
        this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating incident type.';
        return;
      }

      if (Array.isArray(backendError)) {
        this.editModalErrorMessage = backendError.map((e: any) => this.cleanErrorMessage(String(e))).join('; ');
        return;
      }

      if (backendError && typeof backendError === 'object' && backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const v = backendError.errors[field];
          const errorMsg = Array.isArray(v) ? v.join('; ') : String(v);
          this.editFieldErrors[field.toLowerCase()] = this.cleanErrorMessage(errorMsg);
        }
        const msg = backendError.message ?? backendError.title ?? 'Please correct the validation errors below.';
        this.editModalErrorMessage = this.cleanErrorMessage(msg);
        return;
      }

      if (backendError && typeof backendError === 'object' && (backendError.message || backendError.title)) {
        this.editModalErrorMessage = this.cleanErrorMessage(backendError.message ?? backendError.title);
        return;
      }

      if (typeof backendError === 'string') {
        this.editModalErrorMessage = this.cleanErrorMessage(backendError);
        return;
      }

      this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating incident type.';
    } catch (e) {
      this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating incident type.';
    }
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }
}
