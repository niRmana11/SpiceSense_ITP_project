import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import itemRoutes from "./routes/items.js";
import creditCardRoutes from "./routes/creditCards.js";
import orderRoute from "./routes/order.js";
import itemRoute from "./routes/item.js";
import productRoutes from "./routes/productRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import deliveryRoutes from "./routes/delivery.js";



import productRouter from "./routes/productSupRoutes.js";
import orderDeliveryRouter from "./routes/orderDeliveryRoutes.js";
import shipmentDeliveryRouter from "./routes/shipmentDeliveryRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";
import messageRouter from "./routes/messageRoutes.js";



dotenv.config();

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cookieParser());
app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Serve static images from the uploads folder
app.use("/uploads", express.static(`${__dirname}/uploads`));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.path}`);
  console.log("Cookies received:", req.cookies);

  const oldSend = res.send;
  res.send = function (data) {
    console.log("Response Headers (Set-Cookie):", res.getHeaders()["set-cookie"]);
    return oldSend.apply(res, arguments);
  };

  next();
});

// Routes
app.get("/", (req, res) => res.send("API is running..."));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/credit-cards", creditCardRoutes);
app.use("/api/order", orderRoute);
app.use("/api/item", itemRoute);
app.use("/api/products", productRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/delivery", deliveryRoutes);


app.use("/api/supProducts", productRouter);
app.use("/api/messages", messageRouter);
app.use("/api/orderdelivers", orderDeliveryRouter);
app.use("/api/deliveries", shipmentDeliveryRouter);
app.use("/api/transactions", transactionRouter);


// Test Cookie Endpoint
app.get("/api/test-cookie", (req, res) => {
  res.cookie("testCookie", "works", {
    httpOnly: true,
    maxAge: 3600000,
    sameSite: "lax",
    secure: false,
  });
  res.json({ success: true, message: "Test cookie set" });
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Start the Server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Global Error Handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});