import { OperationEntry } from "./OperationEntry";

export class OperationPlan {
    
    constructor(
        public id: string,
        public vvn: string,
        public TargetDay: Date,
        public arrivalTime:Date,
        public departureTime:Date,
        public operations: OperationEntry[],
        public author: string,
        public algorithm: string,
        public createdAt: Date
    ) {
        this.validateVvn(vvn);
        this.validateAuthor(author);
        this.validateAlgorithm(algorithm);
    }

    private validateVvn(vvn: string) {
        if (!vvn || vvn.trim().length === 0) {
            throw new Error("Vessel Visit Notification cannot be null or empty.");
        }
    }

    private validateAuthor(author: string) {
        if (!author || author.trim().length === 0) {
            throw new Error("Author cannot be null or empty.");
        }
    }

    private validateAlgorithm(algorithm: string) {
        if (!algorithm || algorithm.trim().length === 0) {
            throw new Error("Algorithm cannot be null or empty.");
        }
    }

    updateVvn(vvn: string) {
        this.validateVvn(vvn);
        this.vvn = vvn;
    }

    updateTargetDay(targetDay: Date) {
        this.TargetDay = targetDay;
    }

    updateArrivalTime(arrivalTime: Date) {
        this.arrivalTime = arrivalTime;
    }

    updateDepartureTime(departureTime: Date) {
        this.departureTime = departureTime;
    }

    updateAuthor(author: string) {
        this.validateAuthor(author);
        this.author = author;
    }

    updateAlgorithm(algorithm: string) {
        this.validateAlgorithm(algorithm);
        this.algorithm = algorithm;
    }

    updateOperations(operations: OperationEntry[]) {
        this.operations = operations;
    }



}
