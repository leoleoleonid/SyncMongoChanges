import CustomerModel, { ICustomer } from "./models/Customer";
import ModeModel, { IStatus } from "./models/ModeStatus";
import mongoose, { Schema } from "mongoose";
import AnonymizeCustomerModel from "./models/CustomerAnonymised";

class Updater {
  static upsertPackSize = 1000;

  async isFullReindexModeRunning(): Promise<boolean> {
    const mode: IStatus | null = await ModeModel.findOne();
    const result = mode ? Boolean(mode.fullReindex) : true;
    console.log("isFullReindexModeRunning", result);
    return result;
  }

  anonymizeCustomerData(customer: ICustomer): ICustomer {
    function generateRandomString(): string {
      const characters =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomString = "";
      for (let i = 0; i < 8; i++) {
        randomString += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return randomString;
    }

    const anonymizedCustomer: ICustomer = {
      _id: customer._id,
      createdAt: customer.createdAt,
      firstName: generateRandomString(),
      lastName: generateRandomString(),
      email:
        generateRandomString() +
        customer.email.substring(customer.email.indexOf("@")),
      address: {
        line1: generateRandomString(),
        line2: generateRandomString(),
        postcode: generateRandomString(),
        city: customer.address.city,
        state: customer.address.state,
        country: customer.address.country,
      },
    } as ICustomer;

    return anonymizedCustomer;
  }

  async upsertCustomers(): Promise<void> {
    if (await this.isFullReindexModeRunning()) return;
    const session = await mongoose.startSession();
    try {
      console.log("START TRANSACTION");
      session.startTransaction();
      const helpInfo: IStatus | null = await ModeModel.findOne({});
      if (!helpInfo) {
        console.error("mode collection is broken!");
        return;
      }
      const { lastUpdateTime } = helpInfo;
      const customersToUpdate: ICustomer[] = await CustomerModel.find({
        updatedAt: { $gt: lastUpdateTime },
      })
        .sort({ updatedAt: 1 })
        .limit(Updater.upsertPackSize);

      if (!customersToUpdate.length) {
        await session.commitTransaction();
        await session.endSession();
        return;
      }
      const newLastUpdateTime =
        customersToUpdate[customersToUpdate.length - 1].updatedAt;
      const query = customersToUpdate.map((customer) => {
        const anonymizedCustomer = this.anonymizeCustomerData(customer);
        return {
          updateOne: {
            filter: {
              _id: customer._id,
            },
            update: {
              $set: anonymizedCustomer,
            },
            upsert: true,
          },
        };
      });

      await AnonymizeCustomerModel.bulkWrite(query, { session });
      await ModeModel.findOneAndUpdate(
        {},
        { lastUpdateTime: newLastUpdateTime }
      ).session(session);
      await session.commitTransaction();
      await session.endSession();
      console.log("END TRANSACTION");
    } catch (e) {
      console.error("ERROR DURING TRANSACTION");
      console.error(e);
      await session.abortTransaction();
      await session.endSession();
    }
  }

  async fullReindex(): Promise<void> {
    //todo add transaction
    await ModeModel.deleteMany();
    await new ModeModel({
      fullReindex: true,
      lastUpdateTime: new Date(),
    }).save();
    await AnonymizeCustomerModel.deleteMany();
    let lastUpdateTime : Date;
    const updatedIds: Schema.Types.ObjectId[] = [];
    const customersCount = await CustomerModel.count();
    while (updatedIds.length < customersCount) {
      const toUpdate: ICustomer[] = await CustomerModel.find({
        _id: { $nin: updatedIds },
      }).limit(Updater.upsertPackSize).sort({ updatedAt: 1 });


      const anonymizedToUpdate = toUpdate.map((customer) => {
        if (customer._id) updatedIds.push(customer._id);
        return this.anonymizeCustomerData(customer);
      });
      await AnonymizeCustomerModel.insertMany(anonymizedToUpdate);
      if(updatedIds.length === customersCount) {
        lastUpdateTime = toUpdate[toUpdate.length - 1].updatedAt;
        await ModeModel.deleteMany();
        await new ModeModel({
          fullReindex: false,
          lastUpdateTime: lastUpdateTime,
        }).save();
      }
    }
  }
}

export const updater = new Updater();
