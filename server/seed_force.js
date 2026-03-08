const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/Service');

const seedAgain = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to:', mongoose.connection.name);

        await Service.deleteMany({});
        console.log('Cleared existing services');

        const data = [
            { name: 'Gateway', description: 'API Gateway', criticality: 'CRITICAL', status: 'OPERATIONAL' },
            { name: 'Auth Server', description: 'Security', criticality: 'CRITICAL', status: 'OPERATIONAL' },
            { name: 'Database', description: 'Persistence', criticality: 'CRITICAL', status: 'OPERATIONAL' }
        ];

        const created = await Service.insertMany(data);
        console.log('Inserted:', created.length);

        const check = await Service.find();
        console.log('Verified Count:', check.length);
        console.log('Verified First Name:', check[0]?.name);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAgain();
