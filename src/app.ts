import mongoose from "mongoose";
import CustomerModel, { generateUser, ICustomer } from "./models/Customer";
import * as dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI || "mongodb://mongo:27017/mydatabase";
const addCustomersInterval = parseInt(
  process.env.ADD_CUSTOMERS_INTERVAL || "200"
);

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

const addCustomers = async (): Promise<void> => {
  try {
    const length = getRandomInt(1, 10);
    const customers: Partial<ICustomer>[] = Array(length)
      .fill(null)
      .map((i) => generateUser());
    await CustomerModel.insertMany(customers);
    console.log(`${customers.length} new customers inserted.`);
  } catch (e) {
    console.error(e);
  }
};
mongoose.connect(mongoURI).then(async () => {
  const db = mongoose.connection;
  db.on("error", (e) => console.error("MongoDB connection error:", e));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });

  await addCustomers();
  setInterval(addCustomers, addCustomersInterval);
});
