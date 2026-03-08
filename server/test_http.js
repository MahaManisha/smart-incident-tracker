const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/mapping/services',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Body:', data);
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
});

req.end();
