import { Link } from "react-router-dom";
import OrdersList from "../components/OrderList";

function ProfilePage() {
  const userId = sessionStorage.getItem("userId"); // Get userId from sessionStorage

  return (
    <div>
      <OrdersList userId={userId} />
      <Link to="/credit-cards">
        <button>Manage My Credit Cards</button>
      </Link>
    </div>
  );
}

export default ProfilePage;
