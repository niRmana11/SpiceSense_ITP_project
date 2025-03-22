import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import CreditCardPage from "./pages/CreditCardPage";
import React from 'react';
import HomePage from './pages/HomePage';
import ItemPage from './pages/ItemPage';
import OrderProcessingPage from './pages/OrderProcessingPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';


function App() {

  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
  const userId = user ? user._id : null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/credit-cards" element={<CreditCardPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/order/:id" element={<OrderProcessingPage />} />
        <Route path="/confirm/:orderId" element={<OrderConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
