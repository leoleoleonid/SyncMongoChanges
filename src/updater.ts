import CustomerModel, { ICustomer } from "./models/Customer";
import ModeModel, { IStatus } from "./models/ModeStatus";
import mongoose, { Schema } from "mongoose";
import Queue from "./models/Queue";
import AnonymizeCustomerModel from "./models/CustomerAnonymised";

class Updater {
  // customers ready to update
  private customersMap: Map<Schema.Types.ObjectId, ICustomer> = new Map<
    Schema.Types.ObjectId,
    ICustomer
  >();
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

  //accept new customers from events
  pushCustomers(customers: ICustomer[]) {
    if (this.customersMap.size < Updater.upsertPackSize) {
      //not more than 1000 in one pack to insert, rest must be persisted in toUpdateIds collection
      customers
        .slice(0, Updater.upsertPackSize - this.customersMap.size)
        .forEach((customer) => {
          if (customer._id) {
            this.customersMap.set(
              customer._id,
              this.anonymizeCustomerData(customer)
            );
          }
        });
    }
  }

  private async getCustomersFromQueue(
    limit: number,
    omitIds: (Schema.Types.ObjectId | undefined)[]
  ): Promise<ICustomer[]> {
    const ids = await Queue.find({ id: { $nin: omitIds } }, { id: true })
      .limit(limit)
      .distinct("id");
    return CustomerModel.find({ _id: { $in: ids } });
  }
  async addCustomersFromQueue(omitIds: (Schema.Types.ObjectId | undefined)[]) {
    if (this.customersMap.size < Updater.upsertPackSize) {
      const addFromQueueCount = Updater.upsertPackSize - this.customersMap.size;
      const customersFromQueue = await this.getCustomersFromQueue(
        addFromQueueCount,
        omitIds
      );
      this.pushCustomers(customersFromQueue);
    }
  }

  async upsertCustomers(): Promise<void> {
    if (await this.isFullReindexModeRunning()) return;
    const session = await mongoose.startSession();
    try {
      console.log("START TRANSACTION");
      session.startTransaction();
      const omitIds = Array.from(this.customersMap.keys());
      await this.addCustomersFromQueue(omitIds);
      const upsertQuery = Array.from(this.customersMap.values()).map((customer) => ({
        updateOne: {
          filter: { _id: customer._id },
          update: { $set: customer },
          upsert: true,
        },
      }));

      const ids = Array.from(this.customersMap.keys());
      await AnonymizeCustomerModel.bulkWrite(upsertQuery, { session });
      await Queue.deleteMany({ id: { $in: ids } }).session(session);
      await session.commitTransaction();
      await session.endSession();
      this.customersMap = new Map<Schema.Types.ObjectId, ICustomer>();
      console.log("END TRANSACTION");
    } catch (e) {
      console.error("ERROR DURING TRANSACTION");
      console.error(e);
      await session.abortTransaction();
      await session.endSession();
    }
  }

  async fullReindex(): Promise<void> {
    const updatedIds: Schema.Types.ObjectId[] = [];
    const customersCount = await CustomerModel.count();
    while (updatedIds.length < customersCount) {
      const toUpdate: ICustomer[] = await CustomerModel.find({
        _id: { $nin: updatedIds },
      }).limit(Updater.upsertPackSize);
      const anonymizedToUpdate = toUpdate.map((customer) => {
        if (customer._id) updatedIds.push(customer._id);
        return this.anonymizeCustomerData(customer);
      });
      await AnonymizeCustomerModel.insertMany(anonymizedToUpdate);
    }
  }
}

export const updater = new Updater();
