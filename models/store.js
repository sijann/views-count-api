// models/store.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  views: [{ type: Number }], // Change timestamp to a Number array
  count: { type: Number, default: 0 },
});

const storeSchema = new mongoose.Schema({
  store_name: { type: String, required: true, unique: true },
  session: { type: String, required: true },
  settings: {
    timeframe: { type: String, enum: ['1hr', '1day', '1week', 'alltime'], required: true },
    minimum_count_to_show: { type: Number, required: true },
    displayText: { type: String, required: true },
  },
  products: { type: Map, of: productSchema },
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
