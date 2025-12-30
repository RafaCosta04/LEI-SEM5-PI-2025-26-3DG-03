import mongoose from "mongoose";
import { IComplementaryTaskPersistence } from "../../dataschema/IComplementaryTaskPersistence";
import { ComplementaryTaskStatus } from "../../domain/ComplementaryTaskEnums";

const ComplementaryTaskSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true
    },

    responsibleTeam: {
      type: String,
      required: true,
      maxlength: 200
    },

    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: false
    },

    status: {
      type: String,
      enum: Object.values(ComplementaryTaskStatus),
      required: true,
      default: ComplementaryTaskStatus.Ongoing
    },

    vesselVisitExecutionCode: {
      type: String,
      required: true,
      index: true
    },

    suspendsOperations: {
      type: Boolean,
      required: true,
      default: false
    },

    description: {
      type: String,
      required: false,
      maxlength: 1000
    }
  },
  { 
    timestamps: true,
    collection: 'complementaryTasks'
  }
);


ComplementaryTaskSchema.index({ vesselVisitExecutionCode: 1, status: 1 });
ComplementaryTaskSchema.index({ startTime: 1 });
ComplementaryTaskSchema.index({ suspendsOperations: 1, status: 1 });

export default mongoose.model<IComplementaryTaskPersistence & mongoose.Document>(
  "ComplementaryTask",
  ComplementaryTaskSchema
);
