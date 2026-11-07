const mongoose = require('mongoose');
const Order = require('./server/models/Order');
require('dotenv').config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI)
  .then(async () => {
    const orders = await Order.find().lean();
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
  });
