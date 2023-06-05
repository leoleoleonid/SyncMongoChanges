import { ICustomer } from "./Customer";
import { model, Schema } from "mongoose";

const anonymizedCustomerSchema = new Schema<ICustomer>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    postcode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export const anonymizeCustomerCollection = "anonymizeCustomer";
const AnonymizeCustomerModel = model(
  anonymizeCustomerCollection,
  anonymizedCustomerSchema
);

export default AnonymizeCustomerModel;
