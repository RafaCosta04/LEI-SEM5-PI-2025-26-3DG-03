export interface StorageAreaModel {
  id?: number;
  code?: string;
  location?: string;
  storageAreaType?: StorageAreaType;
  maxCapacity?: number;
  currentCapacity?: number;
  storageAreaDocks?: StorageAreaDockModel[];
  lastModifiedAt?: Date;
}

export interface StorageAreaDockModel {
  dockName?: string;
  distance?: number;
}

export enum StorageAreaType {
  Yard = 'Yard',
  Warehouse = 'Warehouse'
}
