import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ComplementaryTaskService } from '../../services-oem/complementaryTask.service';
import { ComplementaryTaskModel, ComplementaryTaskStatus } from '../../models/complementaryTask.model';
import { VesselVisitExecutionService } from '../../services-oem/vesselVisitExecution.service';
import { VesselVisitExecutionModel } from '../../models/vesselVisitExecution.model';
import { ComplementaryTaskCategoryService } from '../../services-oem/complementaryTaskCategory.service';
import { ComplementaryTaskCategoryModel } from '../../models/complementaryTaskCategory.model';

@Component({
  selector: 'app-complementary-task',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './complementaryTask.html',
  styleUrl: './complementaryTask.css',
})
export class ComplementaryTask implements OnInit, OnDestroy {
  items: ComplementaryTaskModel[] = [];
  filteredItems: ComplementaryTaskModel[] = [];
  selected: ComplementaryTaskModel | null = null;

  // Filters
  filterVVECode = '';
  filterStatus = '';
  filterStartDate = '';
  filterEndDate = '';
  filterImpactingOnly = false;

  // Edit modal
  showEditModal = false;
  isEditing = false;
  editItem: any = {};
  originalEditItem: any = {};
  editModalErrorMessage = '';
  editFieldErrors: { [key: string]: string } = {};

  // Reference data
  vesselVisitExecutions: VesselVisitExecutionModel[] = [];
  taskCategories: ComplementaryTaskCategoryModel[] = [];

  searchTerm = '';
  isLoading = false;

  statusMessage = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding = false;
  modalErrorHiding = false;
  editModalErrorHiding = false;

  // Create modal
  showCreateModal = false;
  isCreating = false;
  newItem: Partial<ComplementaryTaskModel> = {};
  modalErrorMessage = '';
  fieldErrors: { [key: string]: string } = {};

  // Error message timeouts
  private modalErrorTimeout: any = null;
  private editModalErrorTimeout: any = null;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Enums for dropdowns
  statuses = [
    ComplementaryTaskStatus.Ongoing,
    ComplementaryTaskStatus.Completed,
    ComplementaryTaskStatus.Cancelled
  ];

  constructor(
    private complementaryTaskService: ComplementaryTaskService,
    private vesselVisitExecutionService: VesselVisitExecutionService,
    private complementaryTaskCategoryService: ComplementaryTaskCategoryService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.setupSearch();
    this.loadVesselVisitExecutions();
    this.loadTaskCategories();
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

    // Apply filters
    if (this.filterImpactingOnly) {
      this.complementaryTaskService.getImpactingOperations()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.items = data;
            this.filteredItems = data;
            this.isLoading = false;
          },
          error: (err) => {
            this.showError('Failed to load impacting tasks');
            this.isLoading = false;
          }
        });
    } else if (this.filterVVECode) {
      this.complementaryTaskService.getByVesselVisitExecution(this.filterVVECode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.items = data;
            this.filteredItems = data;
            this.isLoading = false;
          },
          error: (err) => {
            this.showError('Failed to load tasks');
            this.isLoading = false;
          }
        });
    } else if (this.filterStatus) {
      this.complementaryTaskService.getByStatus(this.filterStatus as ComplementaryTaskStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.items = data;
            this.filteredItems = data;
            this.isLoading = false;
          },
          error: (err) => {
            this.showError('Failed to load tasks');
            this.isLoading = false;
          }
        });
    } else if (this.filterStartDate && this.filterEndDate) {
      this.complementaryTaskService.getByDateRange(
        new Date(this.filterStartDate),
        new Date(this.filterEndDate)
      )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.items = data;
            this.filteredItems = data;
            this.isLoading = false;
          },
          error: (err) => {
            this.showError('Failed to load tasks');
            this.isLoading = false;
          }
        });
    } else {
      this.complementaryTaskService.getAll()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.items = data;
            this.filteredItems = data;
            this.isLoading = false;
          },
          error: (err) => {
            this.showError('Failed to load tasks');
            this.isLoading = false;
          }
        });
    }
  }

  private loadVesselVisitExecutions() {
    this.vesselVisitExecutionService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.vesselVisitExecutions = data;
        },
        error: (err) => {
          console.error('Failed to load vessel visit executions', err);
        }
      });
  }

  private loadTaskCategories() {
    this.complementaryTaskCategoryService.getAllComplementaryTaskCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.taskCategories = data;
        },
        error: (err) => {
          console.error('Failed to load task categories', err);
        }
      });
  }

  applyFilters() {
    this.loadItems();
  }

  clearFilters() {
    this.filterVVECode = '';
    this.filterStatus = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterImpactingOnly = false;
    this.loadItems();
  }

  onSearch(term: string) {
    this.searchSubject$.next(term);
  }

  private performSearch(term: string) {
    if (!term.trim()) {
      this.filteredItems = this.items;
      return;
    }

    const lowerTerm = term.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.responsibleTeam?.toLowerCase().includes(lowerTerm) ||
      item.category?.toLowerCase().includes(lowerTerm) ||
      item.vesselVisitExecutionCode?.toLowerCase().includes(lowerTerm) ||
      item.description?.toLowerCase().includes(lowerTerm)
    );
  }

  selectItem(item: ComplementaryTaskModel) {
    if (this.selected?.id === item.id) {
      this.selected = null;
    } else {
      this.selected = item;
    }
  }

  openCreateModal() {
    this.newItem = {
      category: this.taskCategories.length > 0 ? this.taskCategories[0].code as any : '' as any,
      responsibleTeam: '',
      startTime: new Date().toISOString().slice(0, 16),
      status: ComplementaryTaskStatus.Ongoing,
      suspendsOperations: false,
      vesselVisitExecutionCode: '',
      description: ''
    };
    this.fieldErrors = {};
    this.modalErrorMessage = '';
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newItem = {};
    this.fieldErrors = {};
    this.modalErrorMessage = '';
  }

  createItem() {
    this.fieldErrors = {};
    this.modalErrorMessage = '';

    // Validation
    if (!this.newItem.category) {
      this.fieldErrors['category'] = 'Category is required';
    }
    if (!this.newItem.responsibleTeam || !this.newItem.responsibleTeam.trim()) {
      this.fieldErrors['responsibleTeam'] = 'Responsible team is required';
    }
    if (!this.newItem.startTime) {
      this.fieldErrors['startTime'] = 'Start time is required';
    }
    if (!this.newItem.vesselVisitExecutionCode) {
      this.fieldErrors['vesselVisitExecutionCode'] = 'Vessel visit execution is required';
    }

    if (Object.keys(this.fieldErrors).length > 0) {
      this.showModalError('Please fill in all required fields');
      return;
    }

    console.log('Creating task with payload:', this.newItem);
    this.isCreating = true;
    this.complementaryTaskService.create(this.newItem as Omit<ComplementaryTaskModel, 'id'>)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.isCreating = false;
          this.closeCreateModal();
          this.showSuccess('Task created successfully');
          this.loadItems();
        },
        error: (err) => {
          this.isCreating = false;
          console.error('Full error:', err);
          console.error('Error response:', err.error);
          this.showModalError(err.message || 'Failed to create task');
        }
      });
  }

  openEditModal(item: ComplementaryTaskModel) {
    if (item.status !== ComplementaryTaskStatus.Ongoing) {
      this.showError('Only tasks with Ongoing status can be edited');
      return;
    }
    this.editItem = {
      ...item,
      startTime: this.formatDateForInput(item.startTime),
      endTime: item.endTime ? this.formatDateForInput(item.endTime) : ''
    };
    this.originalEditItem = { ...this.editItem };
    this.editFieldErrors = {};
    this.editModalErrorMessage = '';
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editItem = {};
    this.editFieldErrors = {};
    this.editModalErrorMessage = '';
  }

  saveEdit() {
    this.editFieldErrors = {};
    this.editModalErrorMessage = '';

    // Build update payload (only changed fields)
    const updates: Partial<ComplementaryTaskModel> = {};

    if (this.editItem.category !== this.originalEditItem.category) {
      updates.category = this.editItem.category;
    }
    if (this.editItem.responsibleTeam !== this.originalEditItem.responsibleTeam) {
      updates.responsibleTeam = this.editItem.responsibleTeam;
    }
    if (this.editItem.endTime !== this.originalEditItem.endTime) {
      updates.endTime = this.editItem.endTime;
    }
    if (this.editItem.status !== this.originalEditItem.status) {
      updates.status = this.editItem.status;
    }
    if (this.editItem.suspendsOperations !== this.originalEditItem.suspendsOperations) {
      updates.suspendsOperations = this.editItem.suspendsOperations;
    }
    if (this.editItem.description !== this.originalEditItem.description) {
      updates.description = this.editItem.description;
    }

    if (Object.keys(updates).length === 0) {
      this.closeEditModal();
      return;
    }

    this.isEditing = true;
    this.complementaryTaskService.update(this.editItem.id!, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isEditing = false;
          this.closeEditModal();
          this.showSuccess('Task updated successfully');
          this.loadItems();
        },
        error: (err) => {
          this.isEditing = false;
          this.showEditModalError(err.message || 'Failed to update task');
        }
      });
  }

  deleteItem(item: ComplementaryTaskModel) {
    if (!confirm(`Are you sure you want to delete this task?`)) {
      return;
    }

    this.complementaryTaskService.delete(item.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Task deleted successfully');
          this.loadItems();
          if (this.selected?.id === item.id) {
            this.selected = null;
          }
        },
        error: (err) => {
          this.showError(err.message || 'Failed to delete task');
        }
      });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatDateForInput(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  }

  getCategoryDisplayName(category: string): string {
    const categoryObj = this.taskCategories.find(c => c.code === category);
    return categoryObj?.name || category;
  }

  isImpactingOperations(item: ComplementaryTaskModel): boolean {
    return item.suspendsOperations && item.status === ComplementaryTaskStatus.Ongoing;
  }

  private showSuccess(message: string) {
    this.statusMessage = message;
    this.statusMessageType = 'success';
    this.statusHiding = false;
    setTimeout(() => {
      this.statusHiding = true;
      setTimeout(() => {
        this.statusMessage = '';
        this.statusMessageType = '';
        this.statusHiding = false;
      }, 500);
    }, 3000);
  }

  private showError(message: string) {
    this.statusMessage = message;
    this.statusMessageType = 'error';
    this.statusHiding = false;
    setTimeout(() => {
      this.statusHiding = true;
      setTimeout(() => {
        this.statusMessage = '';
        this.statusMessageType = '';
        this.statusHiding = false;
      }, 500);
    }, 5000);
  }

  private showModalError(message: string) {
    this.modalErrorMessage = message;
    this.modalErrorHiding = false;
    if (this.modalErrorTimeout) {
      clearTimeout(this.modalErrorTimeout);
    }
    this.modalErrorTimeout = setTimeout(() => {
      this.modalErrorHiding = true;
      setTimeout(() => {
        this.modalErrorMessage = '';
        this.modalErrorHiding = false;
      }, 500);
    }, 5000);
  }

  private showEditModalError(message: string) {
    this.editModalErrorMessage = message;
    this.editModalErrorHiding = false;
    if (this.editModalErrorTimeout) {
      clearTimeout(this.editModalErrorTimeout);
    }
    this.editModalErrorTimeout = setTimeout(() => {
      this.editModalErrorHiding = true;
      setTimeout(() => {
        this.editModalErrorMessage = '';
        this.editModalErrorHiding = false;
      }, 500);
    }, 5000);
  }
}
