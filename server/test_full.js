const http = require('http');
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const testFull = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            console.log('Admin not found');
            process.exit(1);
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated Token');

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/mapping/services',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Body:', data);
                process.exit(0);
            });
        });

        req.on('error', e => {
            console.error(e);
            process.exit(1);
        });

        req.end();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testFull();
