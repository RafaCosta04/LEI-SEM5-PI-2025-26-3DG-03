

export class OperationEntry {

    constructor(
        public id: string,
        public operationType: string,
        public container: string,
        public operationStart: Date,
        public operationEnd: Date,
        public craneUsed: string
    ) {
        this.validateOperationType(operationType);
        this.validateCraneUsed(craneUsed);
        this.validateContainer(container);
    }


    private validateCraneUsed(craneUsed: string) {
        if (!craneUsed || craneUsed.trim().length === 0) {
            throw new Error("Crane Used cannot be null or empty.");
        }
    }

    private validateOperationType(operationType: string) {
        if (!operationType || operationType.trim().length === 0) {
            throw new Error("Operation Type cannot be null or empty.");
        }
    }

    private validateContainer(container: string) {
        if (!container || container.trim().length === 0) {
            throw new Error("Container cannot be null or empty.");
        }
    }

    updateOperationType(operationType: string) {
        this.validateOperationType(operationType);
        this.operationType = operationType;
    }

    updateContainer(container: string) {
        this.validateContainer(container);
        this.container = container;
    }

    updateOperationStart(operationStart: Date) {
        this.operationStart = operationStart;
    }

    updateOperationEnd(operationEnd: Date) {
        this.operationEnd = operationEnd;
    }

    updateCraneUsed(craneUsed: string) {
        this.validateCraneUsed(craneUsed);
        this.craneUsed = craneUsed;
    }

}