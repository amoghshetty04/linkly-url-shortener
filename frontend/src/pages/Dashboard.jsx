
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 className="brand">Linkly 🔗</h2>
        <button className="secondary-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Welcome, {user?.name || "User"}!</h1>
        <p className="subtitle">
          Your account is ready. Let's create your first short link.
        </p>

        <div className="dashboard-card">
          <h3>My Links</h3>
          <p>Your shortened URLs will appear here.</p>
          <button onClick={() => navigate("/links")}>
            Create a short link
          </button>
        </div>
      </main>
    </div>
  );
}
