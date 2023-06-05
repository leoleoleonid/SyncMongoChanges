import { Document, Schema, model } from 'mongoose';
import { faker } from '@faker-js/faker';

interface IAddress {
    line1: string;
    line2: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
}

interface ICustomer extends Document {
    firstName: string;
    lastName: string;
    email: string;
    address: IAddress;
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
    line1: { type: String, required: true },
    line2: { type: String },
    postcode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
});

const customerSchema = new Schema<ICustomer>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: addressSchema, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, select: false }
}, {timestamps: true});
customerSchema.pre<ICustomer>('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const CustomerModel = model<ICustomer>('customer', customerSchema);
// CustomerModel.watch().
//     on('change', data => console.log('!!!!!!',data))
//     .on('data', data => console.log('!!!!!!',data));
export default CustomerModel;


export function generateUser(): Partial<ICustomer> {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();
    const address : IAddress = {
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
