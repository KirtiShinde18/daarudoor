const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5500,
  path: '/api/admin/orders',
  method: 'GET',
  headers: {
    // Wait, the API requires admin auth.
    // Let me generate an admin token first.
  }
};
