const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Incident = require('./models/Incident');
const Team = require('./models/Team');

async function run() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-incident-tracker';
        console.log('Connecting to:', uri.split('@')[1] || uri); // Hide credentials
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const total = await Incident.countDocuments();
        const withTeam = await Incident.countDocuments({ assignedTeam: { $ne: null } });
        const teamsCount = await Team.countDocuments();
        const latestIncidents = await Incident.find().sort({ createdAt: -1 }).limit(10);

        console.log('--- DB Stats ---');
        console.log('Total Incidents:', total);
        console.log('Incidents with Team:', withTeam);
        console.log('Total Teams:', teamsCount);

        if (latestIncidents.length > 0) {
            latestIncidents.forEach(inc => {
                console.log(`INC: ${inc.title} | Status: ${inc.status} | Team: ${inc.assignedTeam} | Created: ${inc.createdAt}`);
            });
        } else {
            console.log('No incidents found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
