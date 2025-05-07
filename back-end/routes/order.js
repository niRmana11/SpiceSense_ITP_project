const express = require('express');
const Order = require('../models/Order');
const Item = require('../models/Item');
const router = express.Router();

// Allowed statuses for validation
const ALLOWED_STATUSES = [
  'pending',
  'paid',
  'ready for shipment',
  'shipped',
  'in transit',
  'delivered',
  'cancelled'
];

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.itemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching all orders:', err);
    res.status(500).json({ message: 'Error fetching orders', error: err.message });
  }
});

// Get Order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.itemId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
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
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
});

// Update Order
router.put('/:id', async (req, res) => {
  const { status, items, shippingAddress, billingAddress } = req.body;
  try {
    console.log('PUT request for order ID:', req.params.id, 'with data:', req.body);

    const order = await Order.findById(req.params.id);
    if (!order) {
      console.log('Order not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status if provided
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Invalid status value. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
      order.status = status;
    }

    // Update items if provided
    if (items && items.length > 0) {
      let total = 0;
      const validatedItems = [];
      for (let i = 0; i < items.length; i++) {
        console.log('Validating item ID:', items[i].itemId);
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
      order.items = validatedItems;
      order.total = total;
    }

    // Update addresses if provided
    if (shippingAddress) order.shippingAddress = shippingAddress;
    if (billingAddress) order.billingAddress = billingAddress;

    await order.save();
    const updatedOrder = await Order.findById(req.params.id).populate('items.itemId');
    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(400).json({
      message: 'Error updating order',
      error: err.message.includes('enum') ? 'Invalid status value provided' : err.message
    });
  }
});

// Delete Order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ message: 'Error deleting order', error: err.message });
  }
});

module.exports = router;