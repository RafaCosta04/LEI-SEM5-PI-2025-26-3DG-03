import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { VesselVisitNotificationService } from '../../services/vesselVisitNotification.service';
import { VesselService } from '../../services/vessel.service';
import { RepresentativeService } from '../../services/representative.service';
import { VesselRecordModel } from '../../models/vessel.model';
import { RepresentativeModel } from '../../models/representative.model';
import {
  VesselVisitNotificationModel,
  CargoType,
  VisitStatus,
  CrewRank,
  ManifestType,
  CrewMemberModel,
  CargoManifestModel,
  CargoManifestEntryModel
} from '../../models/vesselVisitNotification.model';

@Component({
  selector: 'app-vessel-visit-notification',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './vesselVisitNotification.html',
  styleUrl: './vesselVisitNotification.css',
})
export class VesselVisitNotification implements OnInit, OnDestroy {
  vesselVisitNotifications: VesselVisitNotificationModel[] = [];
  filteredNotifications: VesselVisitNotificationModel[] = [];
  selectedNotification: VesselVisitNotificationModel | null = null;
  vessels: VesselRecordModel[] = [];
  representatives: RepresentativeModel[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  // Enum references for templates
  CargoType = CargoType;
  VisitStatus = VisitStatus;
  CrewRank = CrewRank;
  ManifestType = ManifestType;

  statusMessage: string = '';
  statusMessageType: 'success' | 'error' | '' = '';
  statusHiding: boolean = false;

  // Modal properties
  showCreateModal: boolean = false;
  isCreating: boolean = false;
  newNotification: VesselVisitNotificationModel = {
    vesselIMO: '',
    representativeCitizenID: '',
    eta: new Date(),
    etd: new Date(),
    cargoType: CargoType.Container,
    volume: 0,
    numberOfCrewMembers: 0,
    visitStatus: VisitStatus.InProgress,
    crewMembers: [],
    cargoManifests: []
  };
  // Additional crew members
  additionalCrewMembers: CrewMemberModel[] = [];
  newCrewMember: CrewMemberModel = {
    name: '',
    citizenID: '',
    rank: CrewRank.Officer,
    nationality: ''
  };

  // Cargo manifests
  cargoManifests: CargoManifestModel[] = [];
  newManifestEntry: CargoManifestEntryModel = {
    containerNumber: '',
    row: 0,
    tier: 0,
    bay: 0,
    storageAreaCode: ''
  };
  currentManifestType: ManifestType = ManifestType.Loading;

  modalErrorMessage: string = '';
  fieldErrors: { [key: string]: string } = {};

  // Edit Modal properties
  showEditModal: boolean = false;
  isEditing: boolean = false;
  editNotification: VesselVisitNotificationModel = {
    vesselIMO: '',
    representativeCitizenID: '',
    eta: new Date(),
    etd: new Date(),
    cargoType: CargoType.Container,
    volume: 0,
    numberOfCrewMembers: 0,
    visitStatus: VisitStatus.InProgress,
    crewMembers: [],
    cargoManifests: []
  };
  editModalErrorMessage: string = '';
  editFieldErrors: { [key: string]: string } = {};
  originalEditNotification: VesselVisitNotificationModel | null = null;

  // Edit crew members
  editAdditionalCrewMembers: CrewMemberModel[] = [];
  editNewCrewMember: CrewMemberModel = {
    name: '',
    citizenID: '',
    rank: CrewRank.Officer,
    nationality: ''
  };

  // Edit cargo manifests
  editCargoManifests: CargoManifestModel[] = [];
  editNewManifestEntry: CargoManifestEntryModel = {
    containerNumber: '',
    row: 0,
    tier: 0,
    bay: 0,
    storageAreaCode: ''
  };
  editCurrentManifestType: ManifestType = ManifestType.Loading;

  countries = [
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AL', name: 'Albania' },
    { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AO', name: 'Angola' },
    { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' },
    { code: 'AM', name: 'Armenia' },
    { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' },
    { code: 'AZ', name: 'Azerbaijan' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' },
    { code: 'BE', name: 'Belgium' },
    { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Cabo Verde' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' },
    { code: 'CA', name: 'Canada' },
    { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' },
    { code: 'CL', name: 'Chile' },
    { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' },
    { code: 'KM', name: 'Comoros' },
    { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'HR', name: 'Croatia' },
    { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'CD', name: 'Democratic Republic of the Congo' },
    { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'EG', name: 'Egypt' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Ethiopia' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GE', name: 'Georgia' },
    { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GR', name: 'Greece' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' },
    { code: 'IS', name: 'Iceland' },
    { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' },
    { code: 'IL', name: 'Israel' },
    { code: 'IT', name: 'Italy' },
    { code: 'CI', name: 'Ivory Coast' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' },
    { code: 'KE', name: 'Kenya' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MG', name: 'Madagascar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldives' },
    { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' },
    { code: 'MH', name: 'Marshall Islands' },
    { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MX', name: 'Mexico' },
    { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' },
    { code: 'MC', name: 'Monaco' },
    { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'MA', name: 'Morocco' },
    { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'KP', name: 'North Korea' },
    { code: 'MK', name: 'North Macedonia' },
    { code: 'NO', name: 'Norway' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PW', name: 'Palau' },
    { code: 'PA', name: 'Panama' },
    { code: 'PG', name: 'Papua New Guinea' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'QA', name: 'Qatar' },
    { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SM', name: 'San Marino' },
    { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' },
    { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KR', name: 'South Korea' },
    { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' },
    { code: 'SE', name: 'Sweden' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' },
    { code: 'TR', name: 'Turkey' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'UG', name: 'Uganda' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' },
    { code: 'VE', name: 'Venezuela' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' }
  ];

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();


  constructor(
    private vesselVisitNotificationService: VesselVisitNotificationService,
    private vesselService: VesselService,
    private representativeService: RepresentativeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadVesselVisitNotifications();
    this.loadVessels();
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
      .subscribe(searchTerm => { this.performSearch(searchTerm); });
  }

  loadVesselVisitNotifications() {
    this.isLoading = true;
    this.vesselVisitNotificationService.getAllVesselVisitNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          this.vesselVisitNotifications = notifications;
          this.filteredNotifications = [...this.vesselVisitNotifications];
          this.isLoading = false;
        },
        error: (error) => {
          this.statusHiding = false;
          this.statusMessage = 'Error loading vessel visit notifications. Please check your connection.';
          this.statusMessageType = 'error';
          console.error('Error loading vessel visit notifications:', error);
          this.isLoading = false;
        }
      });
  }

  loadVessels() {
    this.vesselService.getAllVesselRecords()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vessels) => {
          this.vessels = vessels;
        },
        error: (error) => {
          console.error('Error loading vessels:', error);
        }
      });
  }

  loadRepresentatives() {
    this.representativeService.getAllRepresentatives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (representatives) => {
          this.representatives = representatives;
        },
        error: (error) => {
          console.error('Error loading representatives:', error);
        }
      });
  }

  onSearch() {
    this.searchSubject$.next(this.searchTerm);
  }

  private performSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      this.filteredNotifications = [...this.vesselVisitNotifications];
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
      return;
    }

    this.filteredNotifications = this.vesselVisitNotifications.filter(notification =>
      notification.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.vesselIMO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.representativeCitizenID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.cargoType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.visitStatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (this.filteredNotifications.length === 0) {
      this.statusHiding = false;
      this.statusMessage = `No results found for "${searchTerm}"`;
      this.statusMessageType = 'error';
    } else {
      if (this.statusMessage && this.statusMessageType === 'error') this.clearStatusMessage();
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
    this.clearSearchAndNotify();
  }

  clearSearchAndNotify() {
    this.searchTerm = '';
    this.filteredNotifications = [...this.vesselVisitNotifications];
    this.searchSubject$.next(this.searchTerm);
  }


  selectNotification(notification: VesselVisitNotificationModel) {
    if (this.selectedNotification?.id === notification.id) {
      this.selectedNotification = null;
    } else {
      this.selectedNotification = notification;
    }
  }

  onCreateNew() {
    this.showCreateModal = true;
    this.resetNewNotification();
  }

  onUpdate() {
    if (this.selectedNotification) {
      this.showEditModal = true;
      this.resetEditNotification();
      this.editNotification = { ...this.selectedNotification };
      this.editNotification.crewMembers = this.selectedNotification.crewMembers ?
        [...this.selectedNotification.crewMembers.map(cm => ({...cm}))] : [];
      this.editNotification.cargoManifests = this.selectedNotification.cargoManifests ?
        [...this.selectedNotification.cargoManifests.map(cm => ({
          ...cm,
          entries: cm.entries ? [...cm.entries.map(e => ({...e}))] : []
        }))] : [];
      this.editAdditionalCrewMembers = this.editNotification.crewMembers ?
        [...this.editNotification.crewMembers.map(cm => ({...cm}))] : [];
      this.editCargoManifests = this.editNotification.cargoManifests ?
        [...this.editNotification.cargoManifests.map(cm => ({
          ...cm,
          entries: cm.entries ? [...cm.entries.map(e => ({...e}))] : []
        }))] : [];

      this.originalEditNotification = { ...this.editNotification };
    } else {
      alert('Please select a vessel visit notification to update.');
    }
  }

  refreshList() {
    this.loadVesselVisitNotifications();
    this.selectedNotification = null;
    this.searchTerm = '';
  }

  // Modal methods
  resetNewNotification() {
    this.newNotification = {
      vesselIMO: '',
      representativeCitizenID: '',
      eta: new Date(),
      etd: new Date(),
      cargoType: CargoType.Container,
      volume: 0,
      numberOfCrewMembers: 0,
      visitStatus: VisitStatus.InProgress,
      crewMembers: [],
      cargoManifests: []
    };
    this.additionalCrewMembers = [];
    this.newCrewMember = {
      name: '',
      citizenID: '',
      rank: CrewRank.Officer,
      nationality: ''
    };
    this.cargoManifests = [];
    this.newManifestEntry = {
      containerNumber: '',
      row: 0,
      tier: 0,
      bay: 0,
      storageAreaCode: ''
    };
    this.currentManifestType = ManifestType.Loading;
    this.modalErrorMessage = '';
    this.fieldErrors = {};
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetNewNotification();
    this.isCreating = false;
  }

  onSaveNewNotification() {
    this.modalErrorMessage = '';
    this.fieldErrors = {};
    if (!this.isValidNotification()) {
      this.modalErrorMessage = 'Please fill in all required fields.';
      return;
    }
    this.isCreating = true;
    const crewMembers: CrewMemberModel[] = [...this.additionalCrewMembers];
    const numberOfCrew = crewMembers.length + 1;

    // Create payload with proper formatting
    const payload: any = {
      id: 0,
      code: '',
      vesselIMO: this.newNotification.vesselIMO,
      representativeCitizenID: this.newNotification.representativeCitizenID,
      eta: this.newNotification.eta ? new Date(this.newNotification.eta).toISOString() : new Date().toISOString(),
      etd: this.newNotification.etd ? new Date(this.newNotification.etd).toISOString() : new Date().toISOString(),
      cargoType: this.newNotification.cargoType,
      volume: Number(this.newNotification.volume),
      crewMembers: crewMembers,
      cargoManifests: this.cargoManifests,
      visitStatus: 'InProgress',
      numberOfCrewMembers: numberOfCrew
    };

    console.log('Payload being sent:', payload);    this.vesselVisitNotificationService.createVesselVisitNotification(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdNotification) => {
          this.closeCreateModal();
          this.statusHiding = false;
          this.statusMessage = `Vessel Visit Notification "${createdNotification.code}" created successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
          this.loadVesselVisitNotifications();
        },
        error: (error) => {
          console.error('Error creating vessel visit notification:', error);
          console.error('Error status:', error.status);
          console.error('Error error:', error.error);
          console.error('Error message:', error.message);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          this.handleCreateError(error);
          this.isCreating = false;
        }
      });
  }

  private handleCreateError(error: any) {
    this.fieldErrors = {};
    let errorMessage = 'Error creating vessel visit notification. Please try again.';
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (Array.isArray(error.error)) {
        errorMessage = error.error.join(', ');
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.title) {
        errorMessage = error.error.title;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.modalErrorMessage = errorMessage;
  }

  private isValidNotification(): boolean {
    const baseValid = !!(this.newNotification.vesselIMO?.trim() &&
              this.newNotification.representativeCitizenID?.trim() &&
              this.newNotification.eta &&
              this.newNotification.etd &&
              this.newNotification.cargoType &&
              this.newNotification.volume !== undefined);
    const hasCaptain = this.additionalCrewMembers.some(cm => cm.rank === CrewRank.Captain);
    if (this.newNotification.cargoType === CargoType.Hazardous) {
      const hasSafetyOfficer = this.additionalCrewMembers.some(cm => cm.rank === CrewRank.SafetyOfficer);
      return baseValid && hasCaptain && hasSafetyOfficer;
    }

    return baseValid && hasCaptain;
  }

  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName.toLowerCase()];
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName.toLowerCase()] || '';
  }

  // Edit Modal methods
  resetEditNotification() {
    this.editNotification = {
      vesselIMO: '',
      representativeCitizenID: '',
      eta: new Date(),
      etd: new Date(),
      cargoType: CargoType.Container,
      volume: 0,
      numberOfCrewMembers: 0,
      visitStatus: VisitStatus.InProgress,
      crewMembers: [],
      cargoManifests: []
    };
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};
    this.originalEditNotification = null;
    this.editAdditionalCrewMembers = [];
    this.editNewCrewMember = {
      name: '',
      citizenID: '',
      rank: CrewRank.Officer,
      nationality: ''
    };
    this.editCargoManifests = [];
    this.editNewManifestEntry = {
      containerNumber: '',
      row: 0,
      tier: 0,
      bay: 0,
      storageAreaCode: ''
    };
    this.editCurrentManifestType = ManifestType.Loading;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.resetEditNotification();
    this.isEditing = false;
  }

  onSaveEditNotification() {
    this.editModalErrorMessage = '';
    this.editFieldErrors = {};

    if (!this.isValidEditNotification()) {
      this.editModalErrorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.selectedNotification?.code) {
      this.editModalErrorMessage = 'No notification selected for editing.';
      return;
    }

    if (!this.isEditDirty()) {
      this.editModalErrorMessage = 'No changes to save.';
      return;
    }

    this.isEditing = true;
    this.editNotification.crewMembers = [...this.editAdditionalCrewMembers];
    this.editNotification.numberOfCrewMembers = this.editAdditionalCrewMembers.length + 1;
    this.editNotification.cargoManifests = [...this.editCargoManifests];

    this.vesselVisitNotificationService.updateVesselVisitNotification(this.selectedNotification.code, this.editNotification)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadVesselVisitNotifications();
          this.statusHiding = false;
          this.statusMessage = `Vessel Visit Notification "${this.selectedNotification?.code}" updated successfully!`;
          this.statusMessageType = 'success';
          setTimeout(() => this.clearStatusMessage(), 3000);
        },
        error: (error) => {
          console.error('Error updating vessel visit notification:', error);
          this.handleEditError(error);
          this.isEditing = false;
        }
      });
  }

  isEditDirty(): boolean {
    if (!this.originalEditNotification) return false;
    return JSON.stringify(this.originalEditNotification) !== JSON.stringify(this.editNotification);
  }

  private handleEditError(error: any) {
    this.editFieldErrors = {};
    let errorMessage = 'Error updating vessel visit notification. Please try again.';
    if (error.message) {
      errorMessage = error.message;
    }
    this.editModalErrorMessage = errorMessage;
  }

  private isValidEditNotification(): boolean {
    return !!(this.editNotification.vesselIMO?.trim() &&
              this.editNotification.representativeCitizenID?.trim() &&
              this.editNotification.eta &&
              this.editNotification.etd &&
              this.editNotification.cargoType &&
              this.editNotification.volume !== undefined &&
              this.editNotification.numberOfCrewMembers !== undefined);
  }

  hasEditFieldError(fieldName: string): boolean {
    return !!this.editFieldErrors[fieldName.toLowerCase()];
  }

  getEditFieldError(fieldName: string): string {
    return this.editFieldErrors[fieldName.toLowerCase()] || '';
  }

  // Utility methods for enum conversion
  getCargoTypes(): string[] {
    return Object.values(CargoType);
  }

  getVisitStatuses(): string[] {
    return Object.values(VisitStatus);
  }

  getCrewRanks(): string[] {
    return Object.values(CrewRank);
  }

  getManifestTypes(): string[] {
    return Object.values(ManifestType);
  }

  // Helper methods for date formatting
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16); // Format for datetime-local input
  }

  formatDateForDisplay(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Date update helper methods
  updateNewNotificationEta(event: any) {
    this.newNotification.eta = new Date(event.target.value);
  }

  updateNewNotificationEtd(event: any) {
    this.newNotification.etd = new Date(event.target.value);
  }

  updateEditNotificationEta(event: any) {
    this.editNotification.eta = new Date(event.target.value);
  }

  updateEditNotificationEtd(event: any) {
    this.editNotification.etd = new Date(event.target.value);
  }

  // Crew member management methods
  addCrewMember() {
    if (this.newCrewMember.name?.trim() &&
        this.newCrewMember.citizenID?.trim() &&
        this.newCrewMember.nationality?.trim()) {
      this.additionalCrewMembers.push({
        name: this.newCrewMember.name,
        citizenID: this.newCrewMember.citizenID,
        rank: this.newCrewMember.rank || CrewRank.Officer,
        nationality: this.newCrewMember.nationality
      });
      this.newCrewMember = {
        name: '',
        citizenID: '',
        rank: CrewRank.Officer,
        nationality: ''
      };
    }
  }

  removeCrewMember(index: number) {
    this.additionalCrewMembers.splice(index, 1);
  }

  addManifestEntry() {
    if (this.newManifestEntry.containerNumber?.trim() &&
        this.newManifestEntry.storageAreaCode?.trim()) {
      let manifest = this.cargoManifests.find(m => m.manifestType === this.currentManifestType);

      if (!manifest) {
        manifest = {
          manifestType: this.currentManifestType,
          entries: []
        };
        this.cargoManifests.push(manifest);
      }

      if (!manifest.entries) {
        manifest.entries = [];
      }

      manifest.entries.push({
        containerNumber: this.newManifestEntry.containerNumber,
        row: this.newManifestEntry.row || 0,
        tier: this.newManifestEntry.tier || 0,
        bay: this.newManifestEntry.bay || 0,
        storageAreaCode: this.newManifestEntry.storageAreaCode
      });

      // Reset form
      this.newManifestEntry = {
        containerNumber: '',
        row: 0,
        tier: 0,
        bay: 0,
        storageAreaCode: ''
      };
    }
  }

  removeManifestEntry(manifestType: ManifestType, entryIndex: number) {
    const manifest = this.cargoManifests.find(m => m.manifestType === manifestType);
    if (manifest && manifest.entries) {
      manifest.entries.splice(entryIndex, 1);
      if (manifest.entries.length === 0) {
        const manifestIndex = this.cargoManifests.indexOf(manifest);
        this.cargoManifests.splice(manifestIndex, 1);
      }
    }
  }

  getManifestEntries(manifestType: ManifestType): CargoManifestEntryModel[] {
    const manifest = this.cargoManifests.find(m => m.manifestType === manifestType);
    return manifest && manifest.entries ? manifest.entries : [];
  }

  addEditCrewMember() {
    if (this.editNewCrewMember.name?.trim() &&
        this.editNewCrewMember.citizenID?.trim() &&
        this.editNewCrewMember.nationality?.trim()) {
      this.editAdditionalCrewMembers.push({
        name: this.editNewCrewMember.name,
        citizenID: this.editNewCrewMember.citizenID,
        rank: this.editNewCrewMember.rank || CrewRank.Officer,
        nationality: this.editNewCrewMember.nationality
      });
      this.editNewCrewMember = {
        name: '',
        citizenID: '',
        rank: CrewRank.Officer,
        nationality: ''
      };
    }
  }

  removeEditCrewMember(index: number) {
    this.editAdditionalCrewMembers.splice(index, 1);
  }

  addEditManifestEntry() {
    if (this.editNewManifestEntry.containerNumber?.trim() &&
        this.editNewManifestEntry.storageAreaCode?.trim()) {
      let manifest = this.editCargoManifests.find(m => m.manifestType === this.editCurrentManifestType);

      if (!manifest) {
        manifest = {
          manifestType: this.editCurrentManifestType,
          entries: []
        };
        this.editCargoManifests.push(manifest);
      }

      if (!manifest.entries) {
        manifest.entries = [];
      }

      manifest.entries.push({
        containerNumber: this.editNewManifestEntry.containerNumber,
        row: this.editNewManifestEntry.row || 0,
        tier: this.editNewManifestEntry.tier || 0,
        bay: this.editNewManifestEntry.bay || 0,
        storageAreaCode: this.editNewManifestEntry.storageAreaCode
      });

      this.editNewManifestEntry = {
        containerNumber: '',
        row: 0,
        tier: 0,
        bay: 0,
        storageAreaCode: ''
      };
    }
  }

  removeEditManifestEntry(manifestType: ManifestType, entryIndex: number) {
    const manifest = this.editCargoManifests.find(m => m.manifestType === manifestType);
    if (manifest && manifest.entries) {
      manifest.entries.splice(entryIndex, 1);
      if (manifest.entries.length === 0) {
        const manifestIndex = this.editCargoManifests.indexOf(manifest);
        this.editCargoManifests.splice(manifestIndex, 1);
      }
    }
  }

  getEditManifestEntries(manifestType: ManifestType): CargoManifestEntryModel[] {
    const manifest = this.editCargoManifests.find(m => m.manifestType === manifestType);
    return manifest && manifest.entries ? manifest.entries : [];
  }
}
