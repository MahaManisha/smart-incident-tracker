const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/Service');

const MONGO_URI = process.env.MONGO_URI;

const checkDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const count = await Service.countDocuments();
        const services = await Service.find().limit(5);
        console.log('Count:', count);
        console.log('Sample Services:', services.map(s => s.name));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDB();
