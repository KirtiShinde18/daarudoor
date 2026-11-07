const mongoose = require('mongoose');
const Order = require('./models/Order');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    try {
      const orders = await Order.find().lean();
      console.log(`Total orders found in 'Order' model: ${orders.length}`);
      if (orders.length > 0) {
        console.log(JSON.stringify(orders.slice(-2), null, 2)); // Last 2 orders
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
