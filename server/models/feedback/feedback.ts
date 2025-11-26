import { Schema } from "@models/types";
import { createModel } from "@models/utils/modelCreator";
import { IFeedback } from "@models/types/feedback";

const FeedbackSchema = new Schema<IFeedback>({
  jobRequest: { type: Schema.Types.ObjectId, ref: "JobRequest", required: true },
  fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fromRole: {
    type: String,
    enum: ["customer", "contractor", "admin"],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
});

// Prevent duplicate feedback for the same direction on a job
FeedbackSchema.index(
  {
    jobRequest: 1,
    fromUser: 1,
    toUser: 1,
  },
  { unique: true },
);

// Optimized indexes for common queries
FeedbackSchema.index({ jobRequest: 1 });
FeedbackSchema.index({ fromUser: 1, jobRequest: 1 });
FeedbackSchema.index({ toUser: 1 });

const Feedback = createModel<IFeedback>({
  schema: FeedbackSchema,
  modelName: "Feedback",
});

export { Feedback };
export default Feedback;
