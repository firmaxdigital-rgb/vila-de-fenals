const https = require('https');
require('dotenv').config({ path: '.env.local' });

const token = process.env.NUKI_API_TOKEN;

if (!token) {
  console.error("No NUKI_API_TOKEN found in .env.local");
  process.exit(1);
}

const options = {
  hostname: 'api.nuki.io',
  path: '/smartlock',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log("Success! Nuki API returned:");
      console.log(JSON.parse(data));
    } else {
      console.error(`Error: Status code ${res.statusCode}`);
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
