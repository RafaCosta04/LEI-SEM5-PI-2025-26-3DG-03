export interface IOperationEntryPersistence {
  _id: string;
  operationType: string;
  container: string;
  operationStart: Date;
  operationEnd: Date;
  craneUsed: string;
}
