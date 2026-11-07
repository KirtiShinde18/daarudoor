const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const admin = await User.findOne({ role: 'admin' }).lean();
      if (!admin) {
        console.log("No admin found");
        process.exit(0);
      }
      
      const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_KEY || 'jwtsecurepassword', { expiresIn: '1h' });

      const res = await fetch('http://localhost:5500/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`API returned ${data.data ? data.data.length : 0} orders.`);
      if (data.data && data.data.length > 0) {
        console.log("First order from API:");
        console.log(JSON.stringify(data.data[0], null, 2));
      } else {
        console.log(data);
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
