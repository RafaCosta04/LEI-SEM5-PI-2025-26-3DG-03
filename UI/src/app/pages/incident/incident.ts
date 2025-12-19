import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { IncidentService } from '../../services-oem/incident.service';
import { IncidentModel } from '../../models/incident.model';
import { IncidentTypeService } from '../../services-oem/incidentType.service';
import { IncidentTypeModel } from '../../models/incidentType.model';
import { VesselVisitExecutionService } from '../../services-oem/vesselVisitExecution.service';
import { VesselVisitExecutionModel } from '../../models/vesselVisitExecution.model';

@Component({
  selector: 'app-incident',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './incident.html',
  styleUrl: './incident.css',
})
export class Incident implements OnInit, OnDestroy {
  items: IncidentModel[] = [];
  filteredItems: IncidentModel[] = [];
  selected: IncidentModel | null = null;

  // Filters
  filterFrom = '';
  filterTo = '';
  filterSeverity = '';
  filterStatus = '';

  // Edit modal
  showEditModal = false;
  isEditing = false;
  editItem: any = {};
  editModalErrorMessage = '';
  editFieldErrors: { [key: string]: string } = {};
  selectedEditVVEIds: number[] = [];

  incidentTypes: IncidentTypeModel[] = [];
  vesselVisitExecutions: VesselVisitExecutionModel[] = [];
  selectedVVEIds: number[] = [];

  searchTerm = '';
  isLoading = false;

  statusMessage = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding = false;

  // Create modal
  showCreateModal = false;
  isCreating = false;
  newItem: IncidentModel = {};
  modalErrorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  // Date picker popover
  showDatePicker = false;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  constructor(
    private incidentService: IncidentService,
    private incidentTypeService: IncidentTypeService,
    private vesselVisitExecutionService: VesselVisitExecutionService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.setupSearch();
    this.loadIncidentTypes();
    this.loadVesselVisitExecutions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => this.performSearch(term));
  }

  loadItems() {
    this.isLoading = true;
    const hasFilters = this.filterFrom || this.filterTo || this.filterSeverity || this.filterStatus;

    const source$ = this.incidentService.getAllIncidents();

    source$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          console.log('Incidents received:', items);
          // Normalize incidentTypeCode from incidentTypeByCode if needed
          const normalizedItems: IncidentModel[] = (items || []).map((it: any) => ({
            ...it,
            incidentTypeCode: it?.incidentTypeCode ?? it?.incidentTypeByCode
          }));
          this.items = normalizedItems;
          this.applyFilters();
          this.isLoading = false;

          if (!this.items || this.items.length === 0) {
            this.statusHiding = false;
            this.statusMessage = 'No incidents found.';
            this.statusMessageType = 'error';
          } else if (this.statusMessage && this.statusMessageType === 'error') {
            this.clearStatusMessage();
          }
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading incidents. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading incidents:', error);
          this.isLoading = false;
        },
      });
  }

  onFilterChange() {
    this.applyFilters();
  }

  private applyFilters() {
    this.filteredItems = this.items.filter(item => {
      const matchSeverity = !this.filterSeverity || item.severity === this.filterSeverity;
      const matchStatus = !this.filterStatus || item.status === this.filterStatus;

      let matchDate = true;
      if (this.filterFrom || this.filterTo) {
        const from = this.filterFrom ? new Date(this.filterFrom).getTime() : 0;
        const to = this.filterTo ? new Date(this.filterTo).getTime() : Date.now();
        const itemStart = item.startDate ? new Date(item.startDate).getTime() : 0;

        matchDate = itemStart >= from && itemStart <= to;
      }

      return matchSeverity && matchStatus && matchDate;
    });
  }

  clearFilters() {
    this.filterFrom = '';
    this.filterTo = '';
    this.filterSeverity = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  toggleDatePicker() {
    this.showDatePicker = !this.showDatePicker;
  }

  closeDatePicker() {
    this.showDatePicker = false;
  }

  applyDateRange() {
    this.showDatePicker = false;
    this.applyFilters();
  }

  clearDateRange() {
    this.filterFrom = '';
    this.filterTo = '';
    this.showDatePicker = false;
    this.applyFilters();
  }

  private performSearch(searchTerm: string) {
    const term = (searchTerm || '').trim();
    if (!term) {
      this.filteredItems = [...this.items];
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
      return;
    }

    const localResults = this.items.filter(
      (i) =>
        i.description?.toLowerCase().includes(term.toLowerCase()) ||
        i.severity?.toLowerCase().includes(term.toLowerCase()) ||
        i.status?.toLowerCase().includes(term.toLowerCase())
    );

    if (localResults.length > 0) {
      this.filteredItems = localResults;
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
    } else {
      this.filteredItems = [];
      this.statusHiding = false;
      this.statusMessage = `No results for "${term.trim()}"`;
      this.statusMessageType = 'error';
    }
  }

  clearSearch() {
    this.clearSearchAndNotify();
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredItems = [...this.items];
    this.searchSubject$.next(this.searchTerm);
  }

  getNoResultsMessage(): string {
    if (this.searchTerm && this.searchTerm.trim()) return `No results for "${this.searchTerm.trim()}"`;
    if (this.filterStatus) return `No results for status "${this.filterStatus}"`;
    if (this.filterSeverity) return `No results for severity "${this.filterSeverity}"`;
    if (this.filterFrom || this.filterTo) return 'No results for the selected date range.';
    return 'No results.';
  }

  select(item: IncidentModel) {
    if (this.selected?.id === item.id) {
      this.selected = null;
      return;
    }
    const anyItem: any = item as any;
    const normalized: IncidentModel = {
      ...item,
      incidentTypeCode: item.incidentTypeCode ?? anyItem.incidentTypeByCode
    };
    this.selected = normalized;
  }

  getSelectedIncidentTypeCode(): string {
    const anySel: any = this.selected as any;
    return (this.selected?.incidentTypeCode ?? anySel?.incidentTypeByCode ?? '');
  }

  getSelectedSeverity(): string {
    const typeCode = this.getSelectedIncidentTypeCode();
    if (!typeCode) return '';
    const incidentType = this.incidentTypes.find(it => it.code === typeCode);
    return incidentType?.classification || '';
  }

  loadVesselVisitExecutions() {
    this.vesselVisitExecutionService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vves) => {
          this.vesselVisitExecutions = vves || [];
        },
        error: (error) => {
          console.error('Error loading vessel visit executions:', error);
          this.vesselVisitExecutions = [];
        }
      });
  }

  onToggleVVESelection(vveId: number, checked: boolean) {
    if (checked) {
      if (!this.selectedVVEIds.includes(vveId)) {
        this.selectedVVEIds.push(vveId);
      }
    } else {
      this.selectedVVEIds = this.selectedVVEIds.filter(id => id !== vveId);
    }
  }

  onEditEndDateChange() {
    if (this.editItem.endDate) {
      this.editItem.status = 'Resolved';
    } else {
      this.editItem.status = 'Active';
    }
  }

  onToggleEditVVESelection(vveId: number, checked: boolean) {
    if (checked) {
      if (!this.selectedEditVVEIds.includes(vveId)) {
        this.selectedEditVVEIds.push(vveId);
      }
    } else {
      this.selectedEditVVEIds = this.selectedEditVVEIds.filter(id => id !== vveId);
    }
  }

  getFilteredVVEs(): VesselVisitExecutionModel[] {
    if (!this.newItem.startDate) {
      return [];
    }

    const incidentStart = new Date(this.newItem.startDate).getTime();
    const incidentEnd = this.newItem.endDate ? new Date(this.newItem.endDate).getTime() : Date.now();

    return this.vesselVisitExecutions.filter(vve => {
      if (!vve.arrivalDate) return false;

      const vveStart = new Date(vve.arrivalDate).getTime();
      const vveEnd = vve.departureDate ? new Date(vve.departureDate).getTime() : Date.now();

      // Check if intervals intersect: start1 <= end2 && end1 >= start2
      return incidentStart <= vveEnd && incidentEnd >= vveStart;
    });
  }

  getFilteredEditVVEs(): VesselVisitExecutionModel[] {
    if (!this.editItem.startDate) {
      return [];
    }

    const incidentStart = new Date(this.editItem.startDate).getTime();
    const incidentEnd = this.editItem.endDate ? new Date(this.editItem.endDate).getTime() : Date.now();

    return this.vesselVisitExecutions.filter(vve => {
      if (!vve.arrivalDate) return false;

      const vveStart = new Date(vve.arrivalDate).getTime();
      const vveEnd = vve.departureDate ? new Date(vve.departureDate).getTime() : Date.now();

      // Check if intervals intersect: start1 <= end2 && end1 >= start2
      return incidentStart <= vveEnd && incidentEnd >= vveStart;
    });
  }

  // Create modal handling
  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewItem();
    this.loadIncidentTypes();
  }

  onUpdate() {
    if (this.selected) {
      this.showEditModal = true;
      this.resetEditItem();
      
      // Pré-selecionar as VVEs que já pertencem ao incidente
      if (this.selected.vesselVisitExecutionsCodes && this.selected.vesselVisitExecutionsCodes.length > 0) {
        this.selectedEditVVEIds = this.selected.vesselVisitExecutionsCodes.map(code => {
          const vve = this.vesselVisitExecutions.find(v => v.code === code);
          return vve?.id || 0;
        }).filter(id => id !== 0);
      } else {
        this.selectedEditVVEIds = [];
      }
      
      this.editItem = {
        description: this.selected.description,
        startDate: this.selected.startDate,
        endDate: this.selected.endDate,
        severity: this.selected.severity,
        status: this.selected.status,
        incidentTypeCode: this.selected.incidentTypeCode,
      };
    } else {
      alert('Please select an incident to update.');
    }
  }

  resetEditItem() {
    this.editItem = {};
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    // NÃO limpar selectedEditVVEIds aqui para manter as seleções do incidente
  }

  closeEditModal() {
    this.showEditModal = false;
    this.isEditing = false;
    this.editItem = {};
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.selectedEditVVEIds = [];
  }

  onSaveEdit() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.editItem.status || !this.editItem.status.toString().trim()) {
      this.editModalErrorMessage = 'Status is required.';
      return;
    }

    if (!this.selected) {
      this.editModalErrorMessage = 'No incident selected.';
      return;
    }

    this.isEditing = true;
    const vveCodes = this.selectedEditVVEIds.map(id => {
      const vve = this.vesselVisitExecutions.find(v => v.id === id);
      return vve?.code || '';
    }).filter(code => code);

    const payload = {
      status: this.editItem.status,
      description: this.editItem.description,
      endDate: this.editItem.endDate || null,
      vesselVisitExecutionsCodes: vveCodes.length > 0 ? vveCodes : [],
    };

    this.incidentService
      .updateIncident(this.selected.id || '', payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedIncident) => {
          this.isEditing = false;
          this.closeEditModal();
          this.statusMessage = 'Incident updated successfully!';
          this.statusMessageType = 'success';
          this.statusHiding = false;
          
          // Update selected incident with new data to reflect changes immediately
          if (updatedIncident && this.selected) {
            this.selected = {
              ...this.selected,
              ...updatedIncident,
              vesselVisitExecutionsCodes: vveCodes
            };
          }
          
          this.loadItems();
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (err) => {
          this.isEditing = false;
          this.handleEditError(err);
        },
      });
  }

  resetNewItem() {
    this.newItem = { status: 'Active' };
    this.modalErrorMessage = '';
    this.fieldErrors = {};
    this.selectedVVEIds = [];
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewItem();
    this.isCreating = false;
  }

  onSaveNew() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};

    if (!this.isValidNew()) {
      this.modalErrorMessage = 'Please fill in all required fields (Description, Start Date, Incident Type).';
      return;
    }

    // Add selected VVE codes to the payload
    const vveCodes = this.selectedVVEIds.map(id => {
      const vve = this.vesselVisitExecutions.find(v => v.id === id);
      return vve?.code || '';
    }).filter(code => code);

    const incidentToCreate = {
      ...this.newItem,
      vesselVisitExecutionsCodes: vveCodes.length > 0 ? vveCodes : []
    };

    this.isCreating = true;
    this.incidentService
      .createIncident(incidentToCreate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.isCreating = false;
          this.closeCreateModal();
          this.statusMessage = 'Incident created successfully!';
          this.statusMessageType = 'success';
          this.statusHiding = false;
          this.loadItems();
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          this.isCreating = false;
          this.handleCreateError(error);
        },
      });
  }

  private isValidNew(): boolean {
    return !!(
      this.newItem.description?.trim() &&
      this.newItem.startDate &&
      this.newItem.incidentTypeCode?.trim()
    );
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = '';

    // Prefer normalized message from OemService
    if (error?.message) {
      errorMessage = error.message;
    }

    // Fallback: extract nested server error string
    if (!errorMessage && error?.originalError?.error) {
      const backend = error.originalError.error;
      if (typeof backend === 'string') {
        errorMessage = backend;
      } else if (typeof backend === 'object') {
        if (typeof backend.error === 'string') {
          errorMessage = backend.error;
        } else if (typeof backend.message === 'string') {
          errorMessage = backend.message;
        }
      }
    }

    if (!errorMessage) errorMessage = 'Error creating incident.';
    this.modalErrorMessage = errorMessage;
  }

  private handleEditError(error: any) {
    this.editModalErrorMessage = '';
    let errorMessage = '';

    if (error?.originalError?.error) {
      const backendError = error.originalError.error;
      if (typeof backendError === 'string') {
        errorMessage = backendError;
      } else if (backendError.message) {
        errorMessage = backendError.message;
      }
    }

    if (!errorMessage && error?.message) errorMessage = error.message;
    if (!errorMessage) errorMessage = 'Error updating incident. Please try again.';
    this.editModalErrorMessage = errorMessage;
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

  onEndDateChanged() {
    if (this.newItem.endDate) {
      this.newItem.status = 'Resolved';
    } else {
      this.newItem.status = 'Active';
    }
  }

  private loadIncidentTypes() {
    this.incidentTypeService
      .getAllIncidentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.incidentTypes = list || [];
        },
        error: (err) => {
          console.error('Error loading incident types:', err);
          this.incidentTypes = [];
        },
      });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    const lowerStatus = (status || '').toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('resolved')) return 'status-completed';
    if (lowerStatus.includes('active') || lowerStatus.includes('open') || lowerStatus.includes('ongoing')) return 'status-inprogress';
    if (lowerStatus.includes('closed')) return 'status-completed';
    return '';
  }

  getSeverityClass(severity: string | undefined): string {
    if (!severity) return '';
    const lowerSeverity = (severity || '').toLowerCase();
    if (lowerSeverity.includes('critical')) return 'classification-critical';
    if (lowerSeverity.includes('major')) return 'classification-major';
    if (lowerSeverity.includes('minor')) return 'classification-minor';
    return '';
  }

  getIncidentTypeClassification(incidentTypeCode: string | undefined): string {
    if (!incidentTypeCode) return '';
    
    const incidentType = this.incidentTypes.find(it => it.code === incidentTypeCode);
    return incidentType?.classification || '';
  }



  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }
}
