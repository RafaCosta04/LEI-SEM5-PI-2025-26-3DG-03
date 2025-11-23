import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SystemUserService } from '../../services/systemUser.service';

@Component({
  selector: 'app-system-user',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './systemUser.html',
  styleUrl: './systemUser.css'
})
export class SystemUser implements OnInit, OnDestroy {
  users: any[] = [];
  filteredUsers: any[] = [];
  selectedUser: any | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  // Page status messages
  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;
  // Search-specific error shown under the search field
  searchError: string = '';
  // Controls the hiding animation for the search error (reuses global status animations)
  searchErrorHiding: boolean = false;

  // Create modal
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  // Default role set to one of the server-side `SystemRole` enum values
  newUser: any = { code: '', username: '', email: '', role: 'Admin', status: 'Deactivated', isActive: false };
  modalErrorMessage: string = '';
  modalSuccessMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit modal
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editUser: any = { code: '', username: '', email: '', role: '', status: 'Deactivated', isActive: false };
  // Snapshot of the edit state to detect changes
  originalEditUser: any | null = null;
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(private systemUserService: SystemUserService) {}

  ngOnInit() {
    this.loadUsers();
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

  onSearch() { this.searchSubject$.next(this.searchTerm); }

  // When user types: if input is cleared, hide the persistent search error immediately
  onSearchInput() {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      this.hideSearchErrorImmediate();
    }
    this.searchSubject$.next(this.searchTerm);
  }

  applyFilter(term: string) {
    if (!term || !term.trim()) {
      this.filteredUsers = [...this.users];
      this.hideSearchErrorImmediate();
      return;
    }
    const t = term.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      (u.code || '').toLowerCase().includes(t) ||
      (u.username || '').toLowerCase().includes(t) ||
      (u.email || '').toLowerCase().includes(t)
    );

    // If we have local results, clear any previous search error and stop.
    if (this.filteredUsers.length > 0) {
      this.hideSearchErrorImmediate();
      return;
    }

    // No local results -> try server-side lookup (username then email).
    // Do not clear existing searchError here; it will be set when server responds.
    this.systemUserService.getSystemUserByUsername(term).subscribe({
        next: (user) => {
          if (user) {
            this.filteredUsers = [this.normalizeUser(user)];
            this.hideSearchErrorImmediate();
          } else {
            // try email
            this.systemUserService.getSystemUserByEmail(term).subscribe({
              next: (byEmail) => {
                if (byEmail) {
                  this.filteredUsers = [this.normalizeUser(byEmail)];
                  this.hideSearchErrorImmediate();
                } else {
                  this.showNoResults(term);
                }
              },
              error: (err2) => {
                const msg = this.extractErrorMessage(err2) || `No results found for "${term}".`;
                this.showSearchError(msg);
              }
            });
          }
        },
        error: (err) => {
          // try by email when username lookup fails
          this.systemUserService.getSystemUserByEmail(term).subscribe({
            next: (byEmail) => {
              if (byEmail) {
                this.filteredUsers = [this.normalizeUser(byEmail)];
                this.hideSearchErrorImmediate();
              } else {
                this.showNoResults(term);
              }
            },
            error: (err2) => {
              const msg = this.extractErrorMessage(err2) || `No results found for "${term}".`;
              this.showSearchError(msg);
            }
          });
        }
      });
  }

  loadUsers() {
    this.isLoading = true;
    this.systemUserService.getAllSystemUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const arr = res || [];
          this.users = (arr as any[]).map(u => this.normalizeUser(u));
          this.filteredUsers = [...this.users];
          this.isLoading = false;
        },
        error: (err) => {
          const msg = 'Error loading system users. Please check your connection.';
          this.showSearchError(msg);
          console.error('Error loading users', err);
          this.isLoading = false;
        }
      });
  }

  // Normalize user object coming from backend (case/shape differences)
  private normalizeUser(u: any): any {
    if (!u) return u;
    const n: any = { ...u };
    // common casing differences
    n.code = n.code ?? n.Code ?? n.code;
    n.username = n.username ?? n.Username ?? n.username;
    n.email = n.email ?? n.Email ?? n.email;
    n.role = n.role ?? n.Role ?? n.role;
    n.status = n.status ?? n.Status ?? n.status;
    // IsFirstTime can be present as boolean, string or PascalCase. Normalize to boolean.
    const rawFirst = (typeof n.isFirstTime !== 'undefined') ? n.isFirstTime : (typeof n.IsFirstTime !== 'undefined' ? n.IsFirstTime : false);
    if (typeof rawFirst === 'string') {
      n.isFirstTime = rawFirst.toLowerCase() === 'true';
    } else {
      n.isFirstTime = !!rawFirst;
    }
    // Provide legacy isActive for compatibility: true when status === 'Active' or IsActive present
    if (typeof n.isActive === 'undefined') {
      if (typeof n.IsActive !== 'undefined') n.isActive = n.IsActive;
      else if (typeof n.status !== 'undefined') n.isActive = String(n.status).toLowerCase() === 'active';
      else n.isActive = false;
    }
    return n;
  }

  private showNoResults(term: string) {
    this.showSearchError(`No results found for "${term}".`);
  }

  // Show a search-specific error using the same animated box as qualifications
  // This error will persist until the user clears/changes input to an empty/invalid value.
  showSearchError(message: string) {
    this.searchError = message;
    this.searchErrorHiding = false;
  }

  // Immediately begin hide animation then clear the message after animation finishes
  hideSearchErrorImmediate() {
    if (!this.searchError) return;
    this.searchErrorHiding = true;
    setTimeout(() => {
      this.searchError = '';
      this.searchErrorHiding = false;
    }, 220);
  }

  selectUser(u: any) {
    if (this.selectedUser?.code === u.code) {
      this.selectedUser = null;
      return;
    }
    this.selectedUser = u;
  }

  // Create
  onCreateNew() { this.showCreateModal = true; this.resetNewUser(); }

  resetNewUser() { this.newUser = { code: '', username: '', email: '', role: 'Admin', status: 'Deactivated', isActive: false }; this.modalErrorMessage = ''; this.fieldErrors = {}; }
  closeCreateModal() { this.showCreateModal = false; this.resetNewUser(); this.isCreating = false; }

  onSaveNewUser() {
    this.modalErrorMessage = '';
    this.modalSuccessMessage = '';
    this.fieldErrors = {};
    if (!this.newUser.code?.trim() || !this.newUser.username?.trim() || !this.newUser.email?.trim()) {
      this.modalErrorMessage = 'Please fill required fields.';
      return;
    }
    this.newUser.status = 'Deactivated';
    this.newUser.isActive = false;

    this.isCreating = true;
    this.systemUserService.addSystemUser(this.newUser).subscribe({
      next: (created) => {
        this.isCreating = false;
        this.showCreateModal = false;
        this.loadUsers();
        this.statusMessage = `System user "${created?.code || this.newUser.code}" created successfully.`;
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
    if (!this.selectedUser) return;
    this.editUser = { ...this.selectedUser };
    this.originalEditUser = { ...this.editUser };
    this.showEditModal = true;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.resetEditUser();
    this.isEditing = false;
  }

  // Reset edit modal state for system users
  resetEditUser() {
    this.editUser = { code: '', username: '', email: '', role: '', status: 'Deactivated', isActive: false };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditUser = null;
  }

  isEditDirty(): boolean {
    if (!this.originalEditUser) return false;
    const orig = this.originalEditUser;
    const curr = this.editUser || {};

    const usernameChanged = (orig.username || '').trim() !== (curr.username || '').trim();
    const emailChanged = (orig.email || '').trim() !== (curr.email || '').trim();
    const roleChanged = (orig.role || '').trim() !== (curr.role || '').trim();
    const statusChanged = (orig.status || '') !== (curr.status || '');

    return usernameChanged || emailChanged || roleChanged || statusChanged;
  }

  onSaveEditUser() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    // Basic validation for edit: username and email must be present
    if (!this.editUser.username?.trim() || !this.editUser.email?.trim()) {
      this.editModalErrorMessage = 'Please fill required fields.';
      return;
    }

    if (!this.selectedUser) {
      this.editModalErrorMessage = 'No user selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    // Keep legacy isActive in sync with status before sending
    this.editUser.isActive = String(this.editUser.status).toLowerCase() === 'active';

    this.isEditing = true;
    this.systemUserService.updateSystemUser(this.editUser.code, this.editUser).subscribe({
      next: (updated) => {
        this.isEditing = false;
        this.showEditModal = false;
        // Apply change locally so UI updates immediately without a full reload
        const code = this.editUser.code;
        const returned = updated && typeof updated === 'object' ? updated : this.editUser;

        // Normalize into a single object used in the UI
        let normalized: any = { ...this.editUser, ...returned };
        // Run through normalizeUser to ensure consistent shape
        normalized = this.normalizeUser(normalized);

        // Normalize status -> isActive
        const statusVal = (normalized.status ?? normalized.Status) as any;
        const isActiveVal = (normalized.isActive ?? normalized.IsActive);
        if (typeof isActiveVal !== 'undefined') {
          normalized.isActive = isActiveVal;
        } else if (typeof statusVal !== 'undefined') {
          if (typeof statusVal === 'string') {
            normalized.isActive = statusVal.toLowerCase() === 'active';
          } else if (typeof statusVal === 'number') {
            // Unknown ordinal mapping; assume 0 = Active (common) otherwise treat non-zero as Deactivated
            normalized.isActive = statusVal === 0;
          }
        }

        // Update users array
        const uIdx = this.users.findIndex(x => x.code === code);
        if (uIdx !== -1) {
          this.users[uIdx] = { ...this.users[uIdx], ...normalized };
        }
        // Update filteredUsers array
        const fIdx = this.filteredUsers.findIndex(x => x.code === code);
        if (fIdx !== -1) {
          this.filteredUsers[fIdx] = { ...this.filteredUsers[fIdx], ...normalized };
        }
        // Update selected user if it's the same
        if (this.selectedUser && this.selectedUser.code === code) {
          this.selectedUser = { ...this.selectedUser, ...normalized };
        }

        // Ensure the displayed list is recomputed (this also triggers change detection)
        try {
          this.applyFilter(this.searchTerm || '');
        } catch (e) {
          // fallback: shallow copy of users to force re-render
          this.filteredUsers = [...this.filteredUsers];
        }

        this.resetEditUser();
        this.statusHiding = false;
        this.statusMessage = `System user "${code}" updated successfully.`;
        this.statusMessageType = 'success';
        setTimeout(() => this.clearStatusMessage(), 3000);
      },
      error: (err) => {
        this.isEditing = false;
        console.error('Error updating user', err);
        this.handleEditError(err);
      }
    });
  }

  extractErrorMessage(err: any): string {
    try {
      if (!err) return '';
      if (err.error && typeof err.error === 'string') return err.error;
      if (err.error && Array.isArray(err.error)) return err.error.join('; ');
      if (err.error && typeof err.error === 'object') {
        // Try common shapes: { errors: { field: [..] } } or { message: '...' }
        if (err.error.message) return err.error.message;
        if (err.error.errors) {
          try {
            const arr = [] as string[];
            for (const k in err.error.errors) {
              const v = err.error.errors[k];
              if (Array.isArray(v)) arr.push(...v.map((x: any) => String(x)));
              else arr.push(String(v));
            }
            if (arr.length) return arr.join('; ');
          } catch (e) { /* ignore */ }
        }
      }
      if (err.message) return err.message;
      return JSON.stringify(err);
    } catch (e) { return 'Unknown error'; }
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

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredUsers = [...this.users];
    // clear any local search error when clearing
    this.hideSearchErrorImmediate();
    this.searchSubject$.next(this.searchTerm);
  }


  private handleCreateError(error: any) {
    this.fieldErrors = {};
    this.modalErrorMessage = '';
    try {
      const backendError = error?.error ?? error?.originalError?.error ?? null;

      // No backend payload -> fallback to generic
      if (!backendError) {
        this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating user.';
        return;
      }

      // If backend returned an array of strings
      if (Array.isArray(backendError)) {
        this.modalErrorMessage = backendError.join('; ');
        return;
      }

      // If backend returned validation object with `errors: { field: [...] }`
      if (backendError && typeof backendError === 'object' && backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const v = backendError.errors[field];
          this.fieldErrors[field.toLowerCase()] = Array.isArray(v) ? v.join('; ') : String(v);
        }
        // If the backend provided a top-level message, prefer it; otherwise show generic prompt
        this.modalErrorMessage = backendError.message ?? backendError.title ?? 'Please correct the validation errors below.';
        return;
      }

      // If backend provided a single message or title
      if (backendError && typeof backendError === 'object' && (backendError.message || backendError.title)) {
        this.modalErrorMessage = backendError.message ?? backendError.title;
        return;
      }

      // If backend returned a plain string
      if (typeof backendError === 'string') {
        this.modalErrorMessage = backendError;
        return;
      }

      // Fallback
      this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating user.';
    } catch (e) {
      this.modalErrorMessage = this.extractErrorMessage(error) || 'Error creating user.';
    }
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};
    this.editModalErrorMessage = '';
    try {
      const backendError = error?.error ?? error?.originalError?.error ?? null;

      if (!backendError) {
        this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating user.';
        return;
      }

      if (Array.isArray(backendError)) {
        this.editModalErrorMessage = backendError.join('; ');
        return;
      }

      if (backendError && typeof backendError === 'object' && backendError.errors && typeof backendError.errors === 'object') {
        for (const field in backendError.errors) {
          const v = backendError.errors[field];
          this.editFieldErrors[field.toLowerCase()] = Array.isArray(v) ? v.join('; ') : String(v);
        }
        this.editModalErrorMessage = backendError.message ?? backendError.title ?? 'Please correct the validation errors below.';
        return;
      }

      if (backendError && typeof backendError === 'object' && (backendError.message || backendError.title)) {
        this.editModalErrorMessage = backendError.message ?? backendError.title;
        return;
      }

      if (typeof backendError === 'string') {
        this.editModalErrorMessage = backendError;
        return;
      }

      this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating user.';
    } catch (e) {
      this.editModalErrorMessage = this.extractErrorMessage(error) || 'Error updating user.';
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
