import { model, Schema } from "mongoose";

interface IQueue {
  id: Schema.Types.ObjectId;
}

const queueSchema = new Schema<IQueue>(
  {
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

export const queueCollection = "queue";
const QueueModel = model(queueCollection, queueSchema);

export default QueueModel;
