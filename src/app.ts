import mongoose from 'mongoose';
import CustomerModel, {generateUser} from "./models/customer";
import * as dotenv from "dotenv";

dotenv.config();
console.log(process.env.MONGO_URI)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';
mongoose.connect(mongoURI).then(async () => {
    const db = mongoose.connection;

    // console.log('generateUser', generateUser())
    // await CustomerModel.insertMany([generateUser()])
    // console.log('generateUser', await CustomerModel.find({}))


    db.on('error', (e) => console.error('MongoDB connection error:', e));
    db.once('open', () => {
        console.log('Connected to MongoDB');
    });

});
