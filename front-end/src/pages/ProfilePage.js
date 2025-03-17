import { Link } from "react-router-dom";
import OrdersList from "../components/OrderList";

function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user")); // Get user from localStorage

  return (
    <div>
      <OrdersList userId={user?._id} />
      <Link to="/credit-cards">
        <button>Manage My Credit Cards</button>
      </Link>
    </div>
  );
}

export default ProfilePage;
