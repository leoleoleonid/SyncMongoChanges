import { model, Schema } from "mongoose";
export interface IStatus extends Document {
  fullReindex: Boolean;
  lastUpdateTime: Date;
}

const modeSchema = new Schema<IStatus>({
  fullReindex: { type: Boolean, required: true },
  lastUpdateTime: { type: Date, required: true },
});

export const modeCollection = "mode";
const ModeModel = model(modeCollection, modeSchema);

export default ModeModel;
