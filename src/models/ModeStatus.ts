import { model, Schema } from "mongoose";
export interface IStatus extends Document {
  fullReindex: Boolean;
}

const modeSchema = new Schema<IStatus>(
  {
    fullReindex: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const modeCollection = "mode";
const ModeModel = model(modeCollection, modeSchema);

export default ModeModel;
