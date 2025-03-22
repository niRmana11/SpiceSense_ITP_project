const express = require('express');
const Order = require('../models/Order');
const Item = require('../models/Item');
const router = express.Router();




// Get Order by ID (for Order Confirmation Page)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.itemId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('❌ Error fetching order:', err);
    res.status(500).json({ message: 'Error fetching order', error: err.message });
  }
});






// Create Order
router.post('/create', async (req, res) => {
  const { userId, items, shippingAddress, billingAddress } = req.body;

  try {
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request. User ID and items are required.' });
    }

    let total = 0;
    let validatedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = await Item.findById(items[i].itemId);

      if (!item) {
        return res.status(404).json({ message: `Item with ID ${items[i].itemId} not found` });
      }

      validatedItems.push({
        itemId: item._id,
        quantity: items[i].quantity,
        price: item.price
      });

      total += item.price * items[i].quantity;
    }

    const newOrder = new Order({
      userId,
      items: validatedItems,
      total,
      status: 'pending',
      shippingAddress,
      billingAddress
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order created successfully', order: newOrder });

  } catch (err) {
    console.error('❌ Error creating order:', err);
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
});

module.exports = router;
