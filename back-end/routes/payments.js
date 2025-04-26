// routes/payments.js
import express from "express";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const router = express.Router();

// Existing routes (unchanged)
router.post("/", async (req, res) => {
  try {
    console.log("Payment request body:", req.body);
    const { userId, orderId, amount, cardId } = req.body;

    if (!userId || !orderId || !amount || !cardId) {
      return res.status(400).json({ error: "Missing required fields: userId, orderId, amount, or cardId" });
    }

    const payment = new Payment({
      userId,
      orderId,
      amount,
      method: "credit_card",
      cardId,
    });

    console.log("Saving payment:", payment);
    await payment.save();

    console.log("Updating order status for orderId:", orderId);
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: "paid" }, { new: true });
    if (!updatedOrder) {
      throw new Error("Order not found or update failed");
    }

    res.status(200).json({ message: "Payment successful", paymentId: payment._id });
  } catch (err) {
    console.error("Payment processing error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/invoice/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate("orderId")
      .populate("cardId");
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const order = payment.orderId;
    const card = payment.cardId;

    if (!order) {
      throw new Error("Order not found in payment");
    }
    if (!card) {
      throw new Error("Card details not found in payment");
    }

    let itemIds = [];
    if (Array.isArray(order.items)) {
      itemIds = order.items.map((item) => item.itemId);
    }
    const items = await Item.find({ _id: { $in: itemIds } });
    const itemsMap = items.reduce((acc, item) => {
      acc[item._id.toString()] = item.name;
      return acc;
    }, {});

    const doc = new PDFDocument();
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment._id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Payment ID: ${payment._id}`);
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Items:");
    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item) => {
        const itemName = itemsMap[item.itemId.toString()] || "Unknown Item";
        doc.text(`${itemName} - ${item.quantity || 0} x $${(item.price || 0).toFixed(2)}`);
      });
    } else {
      doc.text("No items found in this order.");
    }
    doc.moveDown();
    doc.text(`Total: $${(order.total || 0).toFixed(2)}`);
    doc.moveDown();

    doc.text(`Paid with: **** **** **** ${card.cardNumber.slice(-4)}`);
    doc.text(`Card Holder: ${card.cardHolder}`);

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Updated route for financial reports data
router.get("/financial-reports", async (req, res) => {
  try {
    // Get top 3 best-selling items
    const orders = await Order.find().populate({
      path: "items.itemId",
      model: "Item",
    });
    const itemSales = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!item.itemId || !item.itemId._id) {
          console.warn(`Invalid itemId in order ${order._id}, item:`, item);
          return;
        }
        const itemId = item.itemId._id.toString();
        if (!item.itemId.name) {
          console.warn(`Missing name for itemId ${itemId} in order ${order._id}, item:`, item.itemId);
        }
        const itemName = item.itemId.name || `Unknown Item ${itemId}`;
        if (!itemSales[itemId]) {
          itemSales[itemId] = { name: itemName, quantity: 0, revenue: 0 };
        }
        itemSales[itemId].quantity += item.quantity;
        itemSales[itemId].revenue = (itemSales[itemId].revenue || 0) + item.price * item.quantity;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    // Get payment logs with item names
    const payments = await Payment.find()
      .populate({
        path: "orderId",
        populate: {
          path: "items.itemId",
          model: "Item",
        },
      })
      .populate("cardId");

    const paymentLogs = payments.map((payment) => {
      const order = payment.orderId;
      const items = order?.items?.map((item) => ({
        name: item.itemId?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.price,
      })) || [];
      return {
        paymentId: payment._id,
        orderId: order?._id,
        amount: payment.amount,
        method: payment.method,
        cardLast4: payment.cardId?.cardNumber?.slice(-4) || "N/A",
        status: payment.status,
        date: payment.date,
        items,
      };
    });

    // Calculate summary statistics
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const transactionCount = payments.length;

    res.json({
      topItems,
      paymentLogs,
      summary: {
        totalRevenue,
        transactionCount,
      },
    });
  } catch (err) {
    console.error("Financial reports error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route for downloadable reports (unchanged)
router.get("/financial-report/download/:type/:period", async (req, res) => {
  try {
    const { type, period } = req.params;
    const now = new Date();
    let startDate;

    // Determine date range based on period
    if (period === "daily") {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === "weekly") {
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    const payments = await Payment.find({
      date: { $gte: startDate, $lte: new Date() },
    })
      .populate({
        path: "orderId",
        populate: {
          path: "items.itemId",
          model: "Item",
        },
      })
      .populate("cardId");

    const paymentData = payments.map((payment) => {
      const order = payment.orderId;
      const items = order?.items?.map((item) => ({
        name: item.itemId?.name || "Unknown Item",
        quantity: item.quantity,
        price: item.price,
      })) || [];
      return {
        paymentId: payment._id,
        orderId: order?._id,
        amount: payment.amount,
        method: payment.method,
        cardLast4: payment.cardId?.cardNumber?.slice(-4) || "N/A",
        status: payment.status,
        date: payment.date,
        items,
      };
    });

    if (type === "pdf") {
      const doc = new PDFDocument();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=financial-report-${period}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      doc.fontSize(20).text(`Financial Report - ${period.charAt(0).toUpperCase() + period.slice(1)}`, {
        align: "center",
      });
      doc.moveDown();

      doc.fontSize(12).text(`Period: ${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`);
      doc.text(`Total Transactions: ${paymentData.length}`);
      doc.text(`Total Revenue: $${paymentData.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`);
      doc.moveDown();

      doc.text("Payment Logs:");
      paymentData.forEach((payment, index) => {
        doc.text(`Payment ${index + 1}:`);
        doc.text(`Payment ID: ${payment.paymentId}`);
        doc.text(`Order ID: ${payment.orderId || "N/A"}`);
        doc.text(`Amount: $${payment.amount.toFixed(2)}`);
        doc.text(`Method: ${payment.method}`);
        doc.text(`Card: **** **** **** ${payment.cardLast4}`);
        doc.text(`Status: ${payment.status}`);
        doc.text(`Date: ${new Date(payment.date).toLocaleString()}`);
        doc.text("Items:");
        payment.items.forEach((item) => {
          doc.text(`- ${item.name}: ${item.quantity} x $${item.price.toFixed(2)}`);
        });
        doc.moveDown();
      });

      doc.end();
    } else if (type === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Financial Report - ${period}`);

      worksheet.columns = [
        { header: "Payment ID", key: "paymentId", width: 30 },
        { header: "Order ID", key: "orderId", width: 30 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Method", key: "method", width: 15 },
        { header: "Card Last 4", key: "cardLast4", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Date", key: "date", width: 20 },
        { header: "Items", key: "items", width: 50 },
      ];

      paymentData.forEach((payment) => {
        const itemsStr = payment.items
          .map((item) => `${item.name}: ${item.quantity} x $${item.price.toFixed(2)}`)
          .join("; ");
        worksheet.addRow({
          paymentId: payment.paymentId.toString(),
          orderId: payment.orderId?.toString() || "N/A",
          amount: payment.amount.toFixed(2),
          method: payment.method,
          cardLast4: payment.cardLast4,
          status: payment.status,
          date: new Date(payment.date).toLocaleString(),
          items: itemsStr,
        });
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=financial-report-${period}.xlsx`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(400).json({ error: "Invalid file type" });
    }
  } catch (err) {
    console.error("Report download error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;