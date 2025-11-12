import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { StaffService } from '../../services/staff.service';
import { StaffModel } from '../../models/staff.model';
import { QualificationService } from '../../services/qualification.service';
import { QualificationModel } from '../../models/qualification.model';

@Component({
  selector: 'app-staff',
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.html',
  styleUrl: './staff.css'
})
export class Staff implements OnInit, OnDestroy {
  staffs: StaffModel[] = [];
  filteredStaffs: StaffModel[] = [];
  qualifications: QualificationModel[] = [];
  selectedStaff: StaffModel | null = null;
  searchTerm: string = '';
  isLoading: boolean = false;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Create modal
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newStaff: StaffModel = { name: '', qualificationCodes: [], email: '', phone: '', operationalWindow: null, status: 0 };
  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};
  showQualificationsForNew: boolean = false;

  // Edit modal
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editStaff: StaffModel = { name: '', qualificationCodes: [], email: '', phone: '', operationalWindow: null, status: 0 };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditStaff: StaffModel | null = null;
  showQualificationsForEdit: boolean = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  

  constructor(private staffService: StaffService, private qualificationService: QualificationService) {}

  ngOnInit() {
    this.loadStaffs();
    this.loadQualifications();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => { this.performSearch(term); });
  }

  loadStaffs() {
    this.isLoading = true;
    this.staffService.getAllStaff().pipe(takeUntil(this.destroy$)).subscribe({
      next: (staffs) => {
        this.staffs = staffs || [];
        this.filteredStaffs = [...this.staffs];
        this.isLoading = false;
      },
      error: (error) => {
        this.statusHiding = false;
        this.statusMessage = 'Error loading staff. Please check your connection.';
        this.statusMessageType = 'error';
        console.error('Error loading staff:', error);
        this.isLoading = false;
      }
    });
  }

  loadQualifications() {
    this.qualificationService.getAllQualifications().pipe(takeUntil(this.destroy$)).subscribe({
      next: (qs) => { this.qualifications = qs || []; },
      error: (err) => { console.error('Error loading qualifications:', err); }
    });
  }

  onSearch() { this.searchSubject$.next(this.searchTerm); }


  private performSearch(term: string) {
    if (!term.trim()) {
      this.filteredStaffs = [...this.staffs];
      if (this.statusMessage && this.statusMessageType === 'error') {
        this.clearStatusMessage();
      }
      return;
    }
    const local = this.staffs.filter(s =>
      s.name?.toLowerCase().includes(term.toLowerCase()) ||
      s.email?.toLowerCase().includes(term.toLowerCase()) ||
      s.phone?.toLowerCase().includes(term.toLowerCase())
    );
    if (local.length) {
      this.filteredStaffs = local;
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
    } else {
      this.searchByName(term);
    }
  }

  searchByName(name: string) {
    this.isLoading = true;
    this.staffService.getStaffByName(name).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.filteredStaffs = res || [];
        if (res && res.length > 0) {
          if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
        } else {
          this.statusHiding = false;
          this.statusMessage = `No results found for "${name}"`;
          this.statusMessageType = 'error';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.statusHiding = false;
        this.statusMessage = 'Error searching staff.';
        this.statusMessageType = 'error';
        console.error(err);
        this.filteredStaffs = [];
        this.isLoading = false;
      }
    });
  }

  clearStatusMessage() {
    if (!this.statusMessage) return;
    this.statusHiding = true;
    setTimeout(() => { this.statusMessage = ''; this.statusMessageType = ''; this.statusHiding = false; }, 220);
  }

  clearSearch() { this.clearSearchAndNotify(); }

  // When clearing programmatically (e.g. clicking the clear button) ensure the
  // search pipeline and error-hide behavior run as if the user emptied the input.
  clearSearchAndNotify() { this.searchTerm = ''; this.filteredStaffs = [...this.staffs]; this.searchSubject$.next(this.searchTerm); }

  selectStaff(s: StaffModel) {
    // Toggle: if already selected, deselect
    if (this.selectedStaff?.id === s.id) {
      this.selectedStaff = null;
      return;
    }
    // Otherwise fetch latest details from server to avoid stale data
    if (s.id != null) {
      this.staffService.getStaffById(s.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (full) => { this.selectedStaff = full || s; },
        error: (err) => { console.error('Error fetching staff details:', err); this.selectedStaff = s; }
      });
    } else {
      this.selectedStaff = s;
    }
  }

  // Create
  onCreateNew() { this.showCreateModal = true; this.resetNewStaff(); }

  resetNewStaff() { this.newStaff = { name: '', qualificationCodes: [], email: '', phone: '', operationalWindow: { startDay: 1, endDay: 5, startTime: '09:00', endTime: '17:00' }, status: 0 }; this.modalErrorMessage = ''; this.fieldErrors = {}; this.showQualificationsForNew = false; }
  closeCreateModal() { this.showCreateModal = false; this.resetNewStaff(); this.isCreating = false; }

  onSaveNewStaff() {
    this.modalErrorMessage = ''; this.fieldErrors = {};
    if (!this.newStaff.name?.trim() || !this.newStaff.email?.trim() || !this.newStaff.phone?.trim()) {
      this.modalErrorMessage = 'Please fill required fields: name, email and phone.'; return;
    }
    // Require at least one qualification on create
    if (!(this.newStaff.qualificationCodes && this.newStaff.qualificationCodes.length)) {
      this.modalErrorMessage = 'Please select at least one qualification.'; return;
    }
    this.isCreating = true;
    this.staffService.createStaff(this.newStaff).pipe(takeUntil(this.destroy$)).subscribe({
      next: (created) => {
        console.log('Staff created:', created);
        this.closeCreateModal();
        this.statusHiding = false;
        this.statusMessage = `Staff "${created.name}" created successfully!`;
        this.statusMessageType = 'success';
        setTimeout(() => this.clearStatusMessage(), 3000);
        this.loadStaffs();
      },
      error: (err) => { console.error('Error creating staff:', err); this.modalErrorMessage = this.extractErrorMessage(err) || 'Error creating staff.'; this.isCreating = false; }
    });
  }

  // Edit
  onUpdate() {
    if (!this.selectedStaff) { alert('Please select a staff to edit.'); return; }
    this.showEditModal = true; this.resetEditStaff(); this.editStaff = { ...(this.selectedStaff as StaffModel) }; this.originalEditStaff = { ...(this.editStaff) }; this.showQualificationsForEdit = false;
  }

  resetEditStaff() { this.editStaff = { name: '', qualificationCodes: [], email: '', phone: '', operationalWindow: { startDay: 1, endDay: 5, startTime: '09:00', endTime: '17:00' }, status: 0 }; this.editModalErrorMessage = ''; this.editFieldErrors = {}; this.originalEditStaff = null; }
  closeEditModal() { this.showEditModal = false; this.resetEditStaff(); this.isEditing = false; this.showQualificationsForEdit = false; }

  isEditDirty(): boolean {
    if (!this.originalEditStaff) return false;
    const o = this.originalEditStaff; const c = this.editStaff;
    const nameChanged = (o.name||'').trim() !== (c.name||'').trim();
    const emailChanged = (o.email||'').trim() !== (c.email||'').trim();
    const phoneChanged = (o.phone||'').trim() !== (c.phone||'').trim();
    const qualsChanged = JSON.stringify(o.qualificationCodes || []) !== JSON.stringify(c.qualificationCodes || []);
    // operational window comparison
    const owO = o.operationalWindow || { startDay: null, endDay: null, startTime: null, endTime: null };
    const owC = c.operationalWindow || { startDay: null, endDay: null, startTime: null, endTime: null };
    const owChanged = (owO.startDay !== owC.startDay) || (owO.endDay !== owC.endDay) || (String(owO.startTime) !== String(owC.startTime)) || (String(owO.endTime) !== String(owC.endTime));
    // status comparison
    const statusChanged = (o.status || 0) !== (c.status || 0);

    return nameChanged || emailChanged || phoneChanged || qualsChanged || owChanged || statusChanged;
  }

  onSaveEditStaff() {
    this.editModalErrorMessage = ''; this.editFieldErrors = {};
    if (!this.editStaff.name?.trim() || !this.editStaff.email?.trim() || !this.editStaff.phone?.trim()) { this.editModalErrorMessage = 'Please fill in required fields.'; return; }
    if (!this.selectedStaff?.id) { this.editModalErrorMessage = 'No staff selected.'; return; }
    if (!this.isEditDirty()) { this.editModalErrorMessage = 'No changes to save.'; return; }
    this.isEditing = true;
    const staffId = this.selectedStaff.id as number;
    this.staffService.updateStaff(staffId, this.editStaff).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        console.log('Staff updated:', updated);
        // Use returned updated staff if available to refresh selection
        if (updated) {
          this.selectedStaff = (updated as StaffModel);
        }
        this.closeEditModal();
        // Refresh list and ensure selected staff is up-to-date
        this.loadStaffs();
        // If server didn't return the updated entity, fetch it explicitly
        if (!updated) {
          this.staffService.getStaffById(staffId).pipe(takeUntil(this.destroy$)).subscribe({ next: (fresh) => { this.selectedStaff = fresh || this.selectedStaff; }, error: () => {} });
        }
        this.statusHiding = false; this.statusMessage = `Staff "${this.selectedStaff?.name}" updated successfully!`; this.statusMessageType = 'success';
        setTimeout(() => this.clearStatusMessage(), 3000);
      },
      error: (err) => {
        console.error('Error updating staff:', err);
        this.editModalErrorMessage = this.extractErrorMessage(err) || 'Error updating staff.';
        this.isEditing = false;
      }
    });
  }

  // Qualification helpers for template checkboxes
  isQualificationSelectedForNew(code: string) {
    return (this.newStaff.qualificationCodes || []).includes(code);
  }

  toggleQualificationForNew(code: string) {
    const arr = this.newStaff.qualificationCodes || [];
    if (arr.includes(code)) this.newStaff.qualificationCodes = arr.filter(c => c !== code);
    else this.newStaff.qualificationCodes = [...arr, code];
  }

  isQualificationSelectedForEdit(code: string) {
    return (this.editStaff.qualificationCodes || []).includes(code);
  }

  toggleQualificationForEdit(code: string) {
    const arr = this.editStaff.qualificationCodes || [];
    if (arr.includes(code)) this.editStaff.qualificationCodes = arr.filter(c => c !== code);
    else this.editStaff.qualificationCodes = [...arr, code];
  }

  // Toggle qualification panels
  toggleQualificationsPanelForNew() { this.showQualificationsForNew = !this.showQualificationsForNew; }
  toggleQualificationsPanelForEdit() { this.showQualificationsForEdit = !this.showQualificationsForEdit; }

  // Template helper: parse a comma-separated string into trimmed, non-empty codes
  parseQualificationCodes(value: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map(s => (s || '').trim())
      .filter(s => !!s);
  }

  // Extract a friendly error message from server errors and strip internal prefixes
  extractErrorMessage(err: any): string {
    const raw = err?.error?.message || err?.message || err?.error || (typeof err === 'string' ? err : null);
    if (!raw) return '';
    // Clean a few known prefixes that leak from backend (case-insensitive)
    let msg = String(raw);
    // remove 'Error updating Staff properties:' prefix
    msg = msg.replace(/error updating staff properties:\s*/i, '');
    // remove 'invalid time:' prefix which can appear in create errors
    msg = msg.replace(/invalid time:\s*/i, '');
    return msg.trim();
  }

  // Map numeric status to human-readable label
  getStatusLabel(status?: number | null): string {
    switch (status) {
      case 1:
        return 'Unavailable';
      case 0:
      default:
        return 'Available';
    }
  }

  // Format the operational window for display
  formatOperationalWindow(ow: any): string {
    if (!ow) return '—';
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const sd = (typeof ow.startDay === 'number') ? days[ow.startDay] : ow.startDay;
    const ed = (typeof ow.endDay === 'number') ? days[ow.endDay] : ow.endDay;
    const st = ow.startTime || '—';
    const et = ow.endTime || '—';
    return `${sd} ${st} — ${ed} ${et}`;
  }

  // Helpers
  hasFieldError(field: string) { return !!this.fieldErrors[field.toLowerCase()]; }
  getFieldError(field: string) { return this.fieldErrors[field.toLowerCase()] || ''; }
  hasEditFieldError(field: string) { return !!this.editFieldErrors[field.toLowerCase()]; }
  getEditFieldError(field: string) { return this.editFieldErrors[field.toLowerCase()] || ''; }
}
