
import express from "express";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const router = express.Router();

//  save payement after paying for order
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

//  invoice generation route 
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

    // Initialize PDF document
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment._id}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Helper function to draw a horizontal line
    const drawLine = (y, thickness = 1) => {
      doc
        .lineWidth(thickness)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
    };

    // Header
    doc
      .fillColor("#003087") // Dark blue color
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", 50, 50, { align: "left" });
    doc
      .fillColor("#555555")
      .fontSize(12)
      .font("Helvetica")
      .text("Spice Sense", 50, 80)
      .text("123 Spice Lane, Palapathwela,", 50, 95)
      .text("Sri Lanka 23100", 50, 110)
      .text("Email: support@spicesense.com", 50, 125);

    // Invoice details (right-aligned)
    doc
      .fillColor("#000000")
      .fontSize(12)
      .text(`Invoice #: ${payment._id}`, 350, 50, { align: "right" })
      .text(`Order #: ${order._id}`, 350, 65, { align: "right" })
      .text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 350, 80, { align: "right" });

    // Divider
    drawLine(150, 2);

    // Items table header
    const tableTop = 170;
    doc
      .fillColor("#003087")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Description", 50, tableTop)
      .text("Quantity", 300, tableTop, { width: 90, align: "right" })
      .text("Unit Price", 390, tableTop, { width: 90, align: "right" })
      .text("Total", 480, tableTop, { width: 90, align: "right" });

    drawLine(tableTop + 20);

    // Items table rows
    let y = tableTop + 30;
    let subtotal = 0;
    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item, index) => {
        const itemName = itemsMap[item.itemId.toString()] || "Unknown Item";
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const itemTotal = quantity * price;

        doc
          .fillColor("#000000")
          .fontSize(10)
          .font("Helvetica")
          .text(itemName, 50, y, { width: 240 })
          .text(quantity.toString(), 300, y, { width: 90, align: "right" })
          .text(`$${price.toFixed(2)}`, 390, y, { width: 90, align: "right" })
          .text(`$${itemTotal.toFixed(2)}`, 480, y, { width: 90, align: "right" });

        subtotal += itemTotal;
        y += 20;

        // Add page break if needed
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });
    } else {
      doc
        .fontSize(10)
        .text("No items found in this order.", 50, y);
      y += 20;
    }

    // Draw table bottom line
    drawLine(y);

    // Total
    y += 20;
    doc
      .fillColor("#000000")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total", 390, y, { width: 90, align: "right" })
      .text(`$${order.total.toFixed(2)}`, 480, y, { width: 90, align: "right" });

    // Payment details
    y += 40;
    doc
      .fillColor("#003087")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Payment Details", 50, y);
    y += 20;
    doc
      .fillColor("#000000")
      .fontSize(10)
      .font("Helvetica")
      .text(`Paid with: **** **** **** ${card.cardNumber.slice(-4)}`, 50, y)
      .text(`Card Holder: ${card.cardHolder}`, 50, y + 15)
      .text(`Payment Date: ${new Date(payment.date).toLocaleString()}`, 50, y + 30);

    // Footer
    const footerY = 750;
    drawLine(footerY, 1);
    doc
      .fillColor("#555555")
      .fontSize(10)
      .font("Helvetica")
      .text("Thank you for your business!", 50, footerY + 10, { align: "center" })
      .text("Contact us at support@spicesense.com for any inquiries.", 50, footerY + 25, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("Invoice generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

//  GET payments route 
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// financial reports route 
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

// Updated financial report download route with fixed footer
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
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=financial-report-${period}.pdf`
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      // Helper function to draw a horizontal line
      const drawLine = (y, thickness = 1) => {
        doc
          .lineWidth(thickness)
          .moveTo(50, y)
          .lineTo(550, y)
          .stroke();
      };

      // Helper function to draw the footer
      const drawFooter = (yPosition) => {
        drawLine(yPosition, 1);
        doc
          .fillColor("#555555")
          .fontSize(10)
          .font("Helvetica")
          .text("Thank you for your business!", 50, yPosition + 10, { align: "center" })
          .text("Contact us at support@spicesense.com for any inquiries.", 50, yPosition + 25, { align: "center" });
      };

      // Header
      doc
        .fillColor("#003087") // Dark blue color
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(`FINANCIAL REPORT - ${period.toUpperCase()}`, 50, 50, { align: "left" });
      doc
        .fillColor("#555555")
        .fontSize(12)
        .font("Helvetica")
        .text("Spice Sense", 50, 80)
        .text("123 Spice Lane, Palapathwela,", 50, 95)
        .text("Sri Lanka 23100", 50, 110)
        .text("Email: support@spicesense.com", 50, 125);

      // Report details (right-aligned)
      doc
        .fillColor("#000000")
        .fontSize(12)
        .text(`Period: ${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`, 350, 50, { align: "right" })
        .text(`Generated: ${new Date().toLocaleDateString()}`, 350, 65, { align: "right" });

      // Divider
      drawLine(150, 2);

      // Summary section
      const summaryTop = 170;
      doc
        .fillColor("#003087")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Summary", 50, summaryTop);
      drawLine(summaryTop + 20);
      doc
        .fillColor("#000000")
        .fontSize(10)
        .font("Helvetica")
        .text(`Total Transactions: ${paymentData.length}`, 50, summaryTop + 30)
        .text(`Total Revenue: $${paymentData.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`, 50, summaryTop + 45);

      // Payment logs table header
      let tableTop = summaryTop + 80;
      doc
        .fillColor("#003087")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Payment ID", 50, tableTop)
        .text("Order ID", 150, tableTop)
        .text("Amount", 250, tableTop, { width: 90, align: "right" })
        .text("Card", 340, tableTop, { width: 90, align: "right" })
        .text("Date", 430, tableTop, { width: 120, align: "right" });

      drawLine(tableTop + 20);

      // Payment logs table rows
      let y = tableTop + 30;
      if (paymentData.length > 0) {
        paymentData.forEach((payment, index) => {
          doc
            .fillColor("#000000")
            .fontSize(9)
            .font("Helvetica")
            .text(payment.paymentId.toString(), 50, y, { width: 100 })
            .text(payment.orderId?.toString() || "N/A", 150, y, { width: 100 })
            .text(`$${payment.amount.toFixed(2)}`, 250, y, { width: 90, align: "right" })
            .text(`**** ${payment.cardLast4}`, 340, y, { width: 90, align: "right" })
            .text(new Date(payment.date).toLocaleString(), 430, y, { width: 120, align: "right" });

          y += 20;

          // Add items as sub-rows
          if (payment.items.length > 0) {
            doc
              .fillColor("#555555")
              .fontSize(8)
              .text("Items:", 60, y);
            payment.items.forEach((item) => {
              y += 15;
              doc.text(
                `- ${item.name}: ${item.quantity} x $${item.price.toFixed(2)}`,
                70,
                y,
                { width: 450 }
              );
            });
            y += 15;
          }

          // Add page break if needed
          if (y > 650) { // Reserve space for footer
            doc.addPage();
            y = 50;
            // Redraw table header on new page
            doc
              .fillColor("#003087")
              .fontSize(12)
              .font("Helvetica-Bold")
              .text("Payment ID", 50, y)
              .text("Order ID", 150, y)
              .text("Amount", 250, y, { width: 90, align: "right" })
              .text("Card", 340, y, { width: 90, align: "right" })
              .text("Date", 430, y, { width: 120, align: "right" });
            drawLine(y + 20);
            y += 30;
          }
        });
      } else {
        doc
          .fillColor("#000000")
          .fontSize(10)
          .text("No payments found for this period.", 50, y);
        y += 20;
      }

      // Draw table bottom line
      drawLine(y);

      // Draw footer at the bottom of the final page
      const footerY = Math.max(y + 20, 650); // Ensure footer doesn't overlap content
      drawFooter(footerY);

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
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;