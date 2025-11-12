// Enums from backend
export enum CargoType {
  Container = 'Container',
  BulkCargo = 'BulkCargo',
  GeneralCargo = 'GeneralCargo',
  Passengers = 'Passengers'
}

export enum VisitStatus {
  InProgress = 'InProgress',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export enum CrewRank {
  Captain = 'Captain',
  ChiefOfficer = 'ChiefOfficer',
  SecondOfficer = 'SecondOfficer',
  ThirdOfficer = 'ThirdOfficer',
  ChiefEngineer = 'ChiefEngineer',
  SecondEngineer = 'SecondEngineer',
  ThirdEngineer = 'ThirdEngineer',
  Radio = 'Radio',
  Cook = 'Cook',
  AbleBodiedSeaman = 'AbleBodiedSeaman',
  OrdinarySeaman = 'OrdinarySeaman'
}

export enum ManifestType {
  Loading = 'Loading',
  Unloading = 'Unloading'
}

// Models
export interface CrewMemberModel {
  name?: string;
  citizenID?: string;
  rank?: CrewRank;
  nationality?: string;
}

export interface CargoManifestEntryModel {
  containerNumber?: string;
  row?: number;
  tier?: number;
  bay?: number;
  storageAreaCode?: string;
}

export interface CargoManifestModel {
  manifestType?: ManifestType;
  entries?: CargoManifestEntryModel[];
}

export interface VesselVisitNotificationModel {
  id?: number;
  code?: string;
  vesselIMO?: string;
  representativeCitizenID?: string;
  eta?: Date;
  etd?: Date;
  cargoManifests?: CargoManifestModel[];
  cargoType?: CargoType;
  volume?: number;
  crewMembers?: CrewMemberModel[];
  visitStatus?: VisitStatus;
  lastModifiedAt?: Date;
  numberOfCrewMembers?: number;
}
