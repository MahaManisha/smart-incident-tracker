const axios = require('axios');

const testApi = async () => {
    try {
        // Need a token to test, but let's see if the route is even reachable or returns 401
        const res = await axios.get('http://localhost:5000/api/mapping/services');
        console.log('Status:', res.status);
        console.log('Data Type:', typeof res.data);
        console.log('Data:', res.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

testApi();
