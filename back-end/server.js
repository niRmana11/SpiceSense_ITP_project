require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Sample route
app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

const paymentRoutes = require("./routes/payments");
app.use("/api/payments", paymentRoutes);

const itemRoutes = require("./routes/items");
app.use("/api/items", itemRoutes);

const creditCardRoutes = require("./routes/creditCards");
app.use("/api/credit-cards", creditCardRoutes);