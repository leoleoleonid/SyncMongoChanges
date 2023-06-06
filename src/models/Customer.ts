import { Document, Schema, model } from "mongoose";
import { faker } from "@faker-js/faker";

interface IAddress {
  line1: string;
  line2: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
}

export interface ICustomer extends Document {
  _id?: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  address: IAddress;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
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
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const customerCollection = "customer";
const CustomerModel = model(customerCollection, customerSchema);

export default CustomerModel;

export function generateUser(): Partial<ICustomer> {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email();
  const address: IAddress = {
    line1: faker.location.streetAddress(),
    line2: faker.location.secondaryAddress(),
    postcode: faker.location.zipCode(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
  };

  return {
    firstName,
    lastName,
    email,
    address,
  };
}
