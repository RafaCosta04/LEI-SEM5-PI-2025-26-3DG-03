import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, timeout } from 'rxjs';
import { OrganizationService } from '../../services/organization.service';
import { ShippingAgentOrganizationModel, ShippingAgentOrganizationWithRepresentativeModel, RepresentativeModel } from '../../models/organization.model';

@Component({
  selector: 'app-organization',
  imports: [CommonModule, FormsModule],
  templateUrl: './organization.html',
  styleUrl: './organization.css',
})
export class Organization implements OnInit, OnDestroy {
  organizations: ShippingAgentOrganizationWithRepresentativeModel[] = [];
  filteredOrganizations: ShippingAgentOrganizationWithRepresentativeModel[] = [];
  selectedOrganization: ShippingAgentOrganizationWithRepresentativeModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newOrganization: ShippingAgentOrganizationModel = {
    code: '',
    legalName: '',
    alternativeName: '',
    address: '',
    taxNumber: ''
  };
  newRepresentative: RepresentativeModel = {
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  includeRepresentative: boolean = false;
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editOrganization: ShippingAgentOrganizationModel = {
    code: '',
    legalName: '',
    alternativeName: '',
    address: '',
    taxNumber: ''
  };
  editRepresentative: RepresentativeModel = {
    name: '',
    citizenId: '',
    nationality: '',
    email: '',
    phoneNumber: ''
  };
  editIncludeRepresentative: boolean = false;
  hasExistingRepresentative: boolean = false;
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditOrganization: ShippingAgentOrganizationModel | null = null;
  originalEditRepresentative: RepresentativeModel | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private searchClearTimer: any = null;

  constructor(
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrganizations();
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

  loadOrganizations() {
    this.isLoading = true;
    this.organizationService.getAllOrganizations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (organizations) => {
          this.organizations = organizations;
          this.filteredOrganizations = [...this.organizations];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading organizations. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading organizations:', error);
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredOrganizations = [...this.organizations];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }

    const localResults = this.organizations.filter(org =>
      org.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.alternativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.representativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.filteredOrganizations = localResults;

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
    this.filteredOrganizations = [...this.organizations];
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredOrganizations = [...this.organizations];
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

  selectOrganization(organization: ShippingAgentOrganizationWithRepresentativeModel) {
    if (this.selectedOrganization?.id === organization.id) {
      this.selectedOrganization = null;
    } else {
      this.selectedOrganization = organization;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewOrganization();
  }

  onUpdate() {
    if (this.selectedOrganization) {
      this.showEditModal = true;
      this.resetEditOrganization();
      this.editOrganization = { ...this.selectedOrganization };

      // Check if organization has a representative
      this.hasExistingRepresentative = !!(this.selectedOrganization.representativeName);
      this.editIncludeRepresentative = this.hasExistingRepresentative;

      if (this.hasExistingRepresentative) {
        this.editRepresentative = {
          name: this.selectedOrganization.representativeName || '',
          citizenId: this.selectedOrganization.representativeCitizenId || '',
          nationality: this.selectedOrganization.representativeNationality || '',
          email: this.selectedOrganization.representativeEmail || '',
          phoneNumber: this.selectedOrganization.representativePhoneNumber || ''
        };
      }

      this.originalEditOrganization = { ...this.editOrganization };
      this.originalEditRepresentative = this.hasExistingRepresentative ? { ...this.editRepresentative } : null;
    } else {
      alert('Please select an organization to update.');
    }
  }

  refreshList() {
    this.loadOrganizations();
    this.selectedOrganization = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewOrganization() {
    this.newOrganization = {
      code: '',
      legalName: '',
      alternativeName: '',
      address: '',
      taxNumber: ''
    };
    this.newRepresentative = {
      name: '',
      citizenId: '',
      nationality: '',
      email: '',
      phoneNumber: ''
    };
    this.includeRepresentative = false;
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewOrganization();
    this.isCreating = false;
  }

  onSaveNewOrganization() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidOrganization()) {
      this.modalErrorMessage = 'Please fill in all required fields (code, legal name, address, tax number).';
      return;
    }

    if (this.includeRepresentative && !this.isValidRepresentative()) {
      this.modalErrorMessage = 'Please fill in all required representative fields (name, citizen ID, nationality, email, phone).';
      return;
    }

    this.isCreating = true;
    this.organizationService.createOrganization(this.newOrganization)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdOrganization) => {
          if (this.includeRepresentative && createdOrganization.id) {
            // Add representative after organization creation
            this.organizationService.addRepresentativeToOrganization(createdOrganization.id, this.newRepresentative)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.handleCreateSuccess(createdOrganization);
                },
                error: (error) => {
                  // Organization created but representative failed
                  this.handleCreateSuccess(createdOrganization, 'Organization created but failed to add representative.');
                }
              });
          } else {
            this.handleCreateSuccess(createdOrganization);
          }
        },
        error: (error) => {
          console.error('Error creating organization:', error);
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateSuccess(createdOrganization: ShippingAgentOrganizationModel, warningMessage?: string) {
    this.closeCreateModal();
    this.statusHiding = false;
    this.statusMessage = warningMessage || `Organization "${createdOrganization.legalName}" created successfully!`;
    this.statusMessageType = warningMessage ? 'error' : 'success';
    setTimeout(() => this.clearStatusMessage(), 3000);
    this.loadOrganizations();
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};

    let errorMessage = 'Error creating organization. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidOrganization(): boolean {
    return !!(this.newOrganization.code?.trim() &&
              this.newOrganization.legalName?.trim() &&
              this.newOrganization.address?.trim() &&
              this.newOrganization.taxNumber?.trim());
  }

  private isValidRepresentative(): boolean {
    return !!(this.newRepresentative.name?.trim() &&
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
  resetEditOrganization() {
    this.editOrganization = {
      code: '',
      legalName: '',
      alternativeName: '',
      address: '',
      taxNumber: ''
    };
    this.editRepresentative = {
      name: '',
      citizenId: '',
      nationality: '',
      email: '',
      phoneNumber: ''
    };
    this.editIncludeRepresentative = false;
    this.hasExistingRepresentative = false;
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditOrganization = null;
    this.originalEditRepresentative = null;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditOrganization();
    this.isEditing = false;
  }

  onSaveEditOrganization() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditOrganization()) {
      this.editModalErrorMessage = 'Please fill in all required fields (legal name, address, tax number).';
      return;
    }

    if (this.editIncludeRepresentative && !this.isValidEditRepresentative()) {
      this.editModalErrorMessage = 'Please fill in all required representative fields (name, citizen ID, nationality, email, phone).';
      return;
    }

    if (!this.selectedOrganization?.id) {
      this.editModalErrorMessage = 'No organization selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.organizationService.updateOrganization(this.selectedOrganization.id, this.editOrganization)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleRepresentativeChanges();
        },
        error: (error) => {
          console.error('Error updating organization:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  private handleRepresentativeChanges() {
    if (!this.selectedOrganization?.id) return;

    const orgId = this.selectedOrganization.id;

    if (this.hasExistingRepresentative && !this.editIncludeRepresentative) {
      // Remove existing representative
      this.organizationService.removeRepresentativeFromOrganization(orgId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.handleEditSuccess(),
          error: () => this.handleEditSuccess('Organization updated but failed to remove representative.')
        });
    } else if (!this.hasExistingRepresentative && this.editIncludeRepresentative) {
      // Add new representative
      this.organizationService.addRepresentativeToOrganization(orgId, this.editRepresentative)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.handleEditSuccess(),
          error: () => this.handleEditSuccess('Organization updated but failed to add representative.')
        });
    } else if (this.hasExistingRepresentative && this.editIncludeRepresentative) {
      // Update existing representative
      this.organizationService.updateRepresentative(orgId, this.editRepresentative)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.handleEditSuccess(),
          error: () => this.handleEditSuccess('Organization updated but failed to update representative.')
        });
    } else {
      // No representative changes
      this.handleEditSuccess();
    }
  }

  private handleEditSuccess(warningMessage?: string) {
    this.closeEditModal();
    this.loadOrganizations();
    this.statusHiding = false;
    this.statusMessage = warningMessage || `Organization "${this.selectedOrganization?.legalName}" updated successfully!`;
    this.statusMessageType = warningMessage ? 'error' : 'success';
    setTimeout(() => this.clearStatusMessage(), 3000);
  }

  isEditDirty(): boolean {
    if (!this.originalEditOrganization) return false;

    const orgChanged = this.isOrganizationChanged();
    const repChanged = this.isRepresentativeChanged();

    return orgChanged || repChanged;
  }

  private isOrganizationChanged(): boolean {
    if (!this.originalEditOrganization) return false;

    const orig = this.originalEditOrganization;
    const curr = this.editOrganization;

    return (orig.legalName || '').trim() !== (curr.legalName || '').trim() ||
           (orig.alternativeName || '').trim() !== (curr.alternativeName || '').trim() ||
           (orig.address || '').trim() !== (curr.address || '').trim() ||
           (orig.taxNumber || '').trim() !== (curr.taxNumber || '').trim();
  }

  private isRepresentativeChanged(): boolean {
    // Check if representative inclusion status changed
    if (this.hasExistingRepresentative !== this.editIncludeRepresentative) {
      return true;
    }

    // If including representative, check if data changed
    if (this.editIncludeRepresentative && this.originalEditRepresentative) {
      const orig = this.originalEditRepresentative;
      const curr = this.editRepresentative;

      return (orig.name || '').trim() !== (curr.name || '').trim() ||
             (orig.citizenId || '').trim() !== (curr.citizenId || '').trim() ||
             (orig.nationality || '').trim() !== (curr.nationality || '').trim() ||
             (orig.email || '').trim() !== (curr.email || '').trim() ||
             (orig.phoneNumber || '').trim() !== (curr.phoneNumber || '').trim();
    }

    return false;
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};

    let errorMessage = 'Error updating organization. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    }

    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditOrganization(): boolean {
    return !!(this.editOrganization.legalName?.trim() &&
              this.editOrganization.address?.trim() &&
              this.editOrganization.taxNumber?.trim());
  }

  private isValidEditRepresentative(): boolean {
    return !!(this.editRepresentative.name?.trim() &&
              this.editRepresentative.citizenId?.trim() &&
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
