import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import CreditCardPage from "./pages/CreditCardPage";

function App() {

  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage
  const userId = user ? user._id : null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/credit-cards" element={<CreditCardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
