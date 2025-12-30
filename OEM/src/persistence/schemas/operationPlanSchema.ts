import mongoose from "mongoose";
import { IOperationPlanPersistence } from "../../dataschema/IOperationPlanPersistence";


const OperationEntrySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    operationType: {
      type: String,
      required: true,
    },

    container: {
      type: String,
      required: true,
    },

    operationStart: {
      type: Date,
      required: true,
    },

    operationEnd: {
      type: Date,
      required: true,
    },

    craneUsed: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);


const OperationPlanSchema = new mongoose.Schema(
  {
    vvn: {
      type: String,
      required: true,
    },

    TargetDay: {
      type: Date,
      required: true,
    },

    arrivalTime: {
      type: Date,
      required: true,
    },

    departureTime: {
      type: Date,
      required: true,
    },

    operations: {
      type: [OperationEntrySchema],
      required: true,
      default: [],
    },

    author: {
      type: String,
      required: true,
    },

    algorithm: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOperationPlanPersistence & mongoose.Document>(  
    "OperationPlan", 
    OperationPlanSchema
);
