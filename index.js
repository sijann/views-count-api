// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectToDB = require('./db');
const Store = require('./models/store');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectToDB();

// Route to track product views
app.get('/api/count', async (req, res) => {
    const { store: store_name, product: productId } = req.query;
  
    try {
      // Find the store based on the provided store name
      const store = await Store.findOne({ store_name });
  
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
  
      // Get the product count based on the product ID
      const products = store.products || new Map();
      let productCount = products.get(productId)?.count || 0;
  
      // If the product doesn't exist, start counting from 1 and save the time
      if (productCount === 0) {
        productCount = 1;
        products.set(productId, { count: productCount, timestamp: Date.now() });
  
        // Update the store data in the database
        await Store.updateOne({ store_name }, { $set: { products } });
      } else {
        // Check if the views count is within the specified timeframe
        const { timeframe } = store.settings;
        const currentTime = Date.now();
        const timeDiff = currentTime - products.get(productId).timestamp;
        const timeframeMs = getTimeframeMilliseconds(timeframe);
  
        if (timeDiff >= timeframeMs) {
          // Reset the count if the timeframe has passed
          productCount = 1;
          products.set(productId, { count: productCount, timestamp: currentTime });
  
          // Update the store data in the database
          await Store.updateOne({ store_name }, { $set: { products } });
        } else {
          // Increment the count if still within the timeframe
          productCount++;
          products.get(productId).count = productCount;
  
          // Update the store data in the database
          await Store.updateOne({ store_name }, { $set: { products } });
        }
      }

      // Get the store data as a plain JavaScript object
  const plainStore = store.toObject();
  
      // Update the product count and send the response
      return res.json({
        viewsCount: productCount,
        timeframe: store.settings.timeframe,
        displayText: plainStore.settings.displayText
          .replace(/{{viewsCount}}/g, productCount)
          .replace(/{{timeframe}}/g, getTimeframeText(store.settings.timeframe)),
      });
    } catch (error) {
      console.error('Error while processing the request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

// Route to create or update a store with settings
app.post('/api/store', async (req, res) => {
  const { store_name, session, settings } = req.body;

  try {
    // Find the store based on the provided store name
    let store = await Store.findOne({ store_name });

    if (store) {
      // Update the existing store's settings
      store.session = session;
      store.settings = settings;
    } else {
      // Create a new store with the provided settings
      store = new Store({
        store_name,
        session,
        settings,
      });
    }

    await store.save();

    return res.json({ message: store._id ? 'Store settings updated successfully' : 'New store created successfully' });
  } catch (error) {
    console.error('Error while processing the request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get the custom timeframe text
function getTimeframeText(timeframe) {
    switch (timeframe) {
      case '1hr':
        return 'hour';
      case '1day':
        return '24 hours';
      case '1week':
        return '7 days';
      case 'alltime':
      default:
        return '';
    }
  }

// Helper function to convert timeframe to milliseconds
function getTimeframeMilliseconds(timeframe) {
   switch (timeframe) {
    case '1hr':
      return 3600000; // 1 hour in milliseconds
    case '1day':
      return 86400000; // 1 day in milliseconds
    case '1week':
      return 604800000; // 1 week in milliseconds
    case 'alltime':
    default:
      return Number.MAX_SAFE_INTEGER; // All time (large value to cover practically all time)
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
