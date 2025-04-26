import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import CreditCardPage from "./pages/CreditCardPage";
import React from 'react';
import HomePage from './pages/HomePage';
import ItemPage from './pages/ItemPage';
import OrderProcessingPage from './pages/OrderProcessingPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import { CookiesProvider } from "react-cookie";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import SupplierDashboard from "./pages/SupplierDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import SendResetOtp from "./pages/SendResetOtp";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import NavBar from "./components/navBar.js";
import InventoryOverview from "./pages/InventoryOverview.js";
import StockLevels from "./pages/StockLevels.js";
import ExpiryAlerts from "./pages/ExpiryAlerts.js";
import InventoryTransactions from "./pages/InventoryTransactions.js";
import SearchFilter from "./pages/SearchFilter.js";
import AdminProducts from "./pages/AdminProducts.js";
import FinancialReports from "./pages/FinancialReports.js"; // Added


function App() {

  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
  const userId = user ? user._id : null;

  return (
    <CookiesProvider>
    <Router>
      <Routes>
        <Route path="/login2" element={<LoginPage />} /> {/* remove this login */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/credit-cards" element={<CreditCardPage />} />
        <Route path="/home2" element={<HomePage />} />
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/order/:id" element={<OrderProcessingPage />} />
        <Route path="/confirm/:orderId" element={<OrderConfirmationPage />} />
        <Route path="/welcome" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Welcome />} /> {/* Updated Home for customers */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify-account" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/supplier-dashboard" element={<SupplierDashboard/>} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard/>} />
          <Route path="/send-reset-otp" element={<SendResetOtp />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/inventory-overview" element={<InventoryOverview />}></Route>
        <Route path="/stock-levels" element={<StockLevels />}></Route>
        <Route path="/expiry-alerts" element={<ExpiryAlerts />}></Route>
        <Route path="/inventory-transactions" element={<InventoryTransactions />}></Route>
        <Route path="/search-filter" element={<SearchFilter />}></Route>
        <Route path="/admin-products" element={<AdminProducts />}></Route>
        <Route path="/financial-reports" element={<FinancialReports />} /> {/* Added */}
      </Routes>
    </Router>
    </CookiesProvider>
  );
}

export default App;
