export enum PhysicalResourceKind {
  STSCrane = 'STSCrane',
  MobileCrane = 'MobileCrane',
  Truck = 'Truck',
  Other = 'Other'
}

export enum ResourceStatus {
  Available = 'Available',
  Unavailable = 'Unavailable',
  InMaintenance = 'InMaintenance'
}

export interface OperationalWindowModel {
  startDay?: number;
  endDay?: number;
  startTime?: string;
  endTime?: string;
}

export interface PhysicalResourceModel {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  kind?: PhysicalResourceKind;
  setupTimeMinutes?: number;
  operationalCapacity?: number;
  assignedArea?: string;
  qualificationCode?: string;
  operationalWindow?: OperationalWindowModel;
  status?: ResourceStatus;
}


export const PHYSICAL_RESOURCE_KINDS = [
  { value: PhysicalResourceKind.STSCrane, label: 'STS Crane' },
  { value: PhysicalResourceKind.MobileCrane, label: 'Mobile Crane' },
  { value: PhysicalResourceKind.Truck, label: 'Truck' },
  { value: PhysicalResourceKind.Other, label: 'Other' }
];

export const RESOURCE_STATUSES = [
  { value: ResourceStatus.Available, label: 'Available' },
  { value: ResourceStatus.Unavailable, label: 'Unavailable' },
  { value: ResourceStatus.InMaintenance, label: 'In Maintenance' }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];
