// routes/delivery.js
const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// Get delivery by ID
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json(delivery);
  } catch (err) {
    console.error('Error fetching delivery:', err);
    res.status(500).json({ message: 'Error fetching delivery', error: err.message });
  }
});

// Get delivery by order ID
router.get('/order/:orderId', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });
    if (!delivery) {
      return res.status(404).json({ message: 'No delivery found for this order' });
    }
    res.json(delivery);
  } catch (err) {
    console.error('Error fetching delivery by order ID:', err);
    res.status(500).json({ message: 'Error fetching delivery', error: err.message });
  }
});

// Get all deliveries for a user
router.get('/user/:userId', async (req, res) => {
  try {
    // First, find all orders for this user
    const orders = await Order.find({ userId: req.params.userId });
    if (!orders || orders.length === 0) {
      return res.json([]);
    }

    // Get the order IDs
    const orderIds = orders.map(order => order._id);

    // Find all deliveries for these orders
    const deliveries = await Delivery.find({ orderId: { $in: orderIds } })
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching user deliveries:', err);
    res.status(500).json({ message: 'Error fetching user deliveries', error: err.message });
  }
});

// Create new delivery
router.post('/create', async (req, res) => {
  try {
    const { orderId, trackingNumber, carrier, estimatedDeliveryDate, deliveryNotes, status, updatedBy } = req.body;

    // Verify the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if a delivery already exists for this order
    const existingDelivery = await Delivery.findOne({ orderId });
    if (existingDelivery) {
      return res.status(400).json({ message: 'A delivery already exists for this order' });
    }

    // Create new delivery
    const newDelivery = new Delivery({
      orderId,
      status: status || 'ready for shipment',
      trackingNumber,
      carrier,
      estimatedDeliveryDate,
      deliveryNotes,
      updatedBy,
      statusHistory: [{
        status: status || 'ready for shipment',
        timestamp: new Date(),
        updatedBy: updatedBy || null
      }]
    });

    // Save the new delivery
    await newDelivery.save();

    // Update the order status to match
    order.status = status || 'ready for shipment';
    await order.save();

    res.status(201).json({ message: 'Delivery created successfully', delivery: newDelivery });
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ message: 'Error creating delivery', error: err.message });
  }
});

// Update delivery status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, updatedBy } = req.body;
    
    // Validate status
    const validStatuses = ['ready for shipment', 'shipped', 'in transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: ready for shipment, shipped, in transit, delivered' });
    }
    
    // Find the delivery
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Update status
    delivery.status = status;
    
    // Add to status history
    delivery.statusHistory.push({
      status: status,
      timestamp: new Date(),
      updatedBy: updatedBy || null
    });

    // If status is 'delivered', set the actual delivery date
    if (status === 'delivered') {
      delivery.actualDeliveryDate = new Date();
    }

    // Save the updated delivery
    await delivery.save();

    // Update corresponding order status
    const order = await Order.findById(delivery.orderId);
    if (order) {
      order.status = status;
      await order.save();
    }

    res.json({ message: 'Delivery status updated successfully', delivery });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ message: 'Error updating delivery status', error: err.message });
  }
});

// Update delivery tracking information
router.put('/:id/tracking', async (req, res) => {
  try {
    const { trackingNumber, carrier, estimatedDeliveryDate, deliveryNotes } = req.body;
    
    // Find the delivery
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Update tracking information
    if (trackingNumber) delivery.trackingNumber = trackingNumber;
    if (carrier) delivery.carrier = carrier;
    if (estimatedDeliveryDate) delivery.estimatedDeliveryDate = estimatedDeliveryDate;
    if (deliveryNotes !== undefined) delivery.deliveryNotes = deliveryNotes;

    // Save the updated delivery
    await delivery.save();

    res.json({ message: 'Delivery tracking information updated successfully', delivery });
  } catch (err) {
    console.error('Error updating delivery tracking information:', err);
    res.status(500).json({ message: 'Error updating delivery tracking information', error: err.message });
  }
});

// Get all deliveries (for admin)
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderId',
        select: 'userId total'
      });
    
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching all deliveries:', err);
    res.status(500).json({ message: 'Error fetching all deliveries', error: err.message });
  }
});

// Get deliveries by status (for admin filtering)
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['ready for shipment', 'shipped', 'in transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status parameter' });
    }
    
    const deliveries = await Delivery.find({ status })
      .sort({ createdAt: -1 })
      .populate({
        path: 'orderId',
        select: 'userId total items'
      });
    
    res.json(deliveries);
  } catch (err) {
    console.error(`Error fetching deliveries with status ${req.params.status}:`, err);

    res.status(500).json({ message: 'Error fetching deliveries by status', error: err.message });
  }
});

// Update multiple fields at once
router.put('/:id', async (req, res) => {
  try {
    const { status, trackingNumber, carrier, estimatedDeliveryDate, deliveryNotes, updatedBy } = req.body;
    
    // Find the delivery
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Update fields if provided
    if (status) {
      // Validate status
      const validStatuses = ['ready for shipment', 'shipped', 'in transit', 'delivered'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      
      delivery.status = status;
      
      // Add to status history
      delivery.statusHistory.push({
        status: status,
        timestamp: new Date(),
        updatedBy: updatedBy || null
      });

      // If status is 'delivered', set the actual delivery date
      if (status === 'delivered') {
        delivery.actualDeliveryDate = new Date();
      }
      
      // Update corresponding order status
      const order = await Order.findById(delivery.orderId);
      if (order) {
        order.status = status;
        await order.save();
      }
    }
    
    if (trackingNumber) delivery.trackingNumber = trackingNumber;
    if (carrier) delivery.carrier = carrier;
    if (estimatedDeliveryDate) delivery.estimatedDeliveryDate = estimatedDeliveryDate;
    if (deliveryNotes !== undefined) delivery.deliveryNotes = deliveryNotes;

    // Save the updated delivery
    await delivery.save();

    res.json({ message: 'Delivery updated successfully', delivery });
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ message: 'Error updating delivery', error: err.message });
  }
});

// Delete delivery (rarely used, mostly for testing)
router.delete('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    await Delivery.deleteOne({ _id: req.params.id });
    res.json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ message: 'Error deleting delivery', error: err.message });
  }
});

// Get recent deliveries with pagination (for admin dashboard)
router.get('/admin/recent', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const deliveries = await Delivery.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'orderId',
        select: 'userId total'
      });
    
    const total = await Delivery.countDocuments();
    
    res.json({
      deliveries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalDeliveries: total
    });
  } catch (err) {
    console.error('Error fetching recent deliveries:', err);
    res.status(500).json({ message: 'Error fetching recent deliveries', error: err.message });
  }
});

// Get delivery statistics for admin dashboard
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = {
      total: await Delivery.countDocuments(),
      readyForShipment: await Delivery.countDocuments({ status: 'ready for shipment' }),
      shipped: await Delivery.countDocuments({ status: 'shipped' }),
      inTransit: await Delivery.countDocuments({ status: 'in transit' }),
      delivered: await Delivery.countDocuments({ status: 'delivered' })
    };
    
    // Get counts for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    stats.lastSevenDays = {
      total: await Delivery.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      delivered: await Delivery.countDocuments({ 
        status: 'delivered',
        'statusHistory.timestamp': { $gte: sevenDaysAgo },
        'statusHistory.status': 'delivered'
      })
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error fetching delivery statistics:', err);
    res.status(500).json({ message: 'Error fetching delivery statistics', error: err.message });
  }
});

module.exports = router;
