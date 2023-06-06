import mongoose, { ConnectOptions } from "mongoose";
import CustomerModel from "./models/Customer";
import * as dotenv from "dotenv";
import { updater } from "./updater";
import * as process from "process";
import ModeModel from "./models/ModeStatus";
import AnonymizeCustomerModel from "./models/CustomerAnonymised";

dotenv.config();

const isFullReindex = process.argv.includes("--full-reindex");
const mongoURI =
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/mydatabase?replicaSet=rs0";
const upsertInterval = parseInt(process.env.UPSERT_INTERVAL || "1000"); //ms
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions)
  .then(async () => {
    const db = mongoose.connection;
    db.on("error", (e) => console.error("MongoDB connection error:", e));
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });

    if (isFullReindex) {

      await updater.fullReindex();

      process.exit(0);
    } else {
      await updater.upsertCustomers();
      setInterval(() => {
        updater.upsertCustomers();
      }, upsertInterval);
    }
  });
