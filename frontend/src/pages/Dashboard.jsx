
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function fetchUrls() {
    try {
      const data = await apiRequest("/api/urls");
      setUrls(data.urls);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUrls();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setCreating(true);

    try {
      const data = await apiRequest("/api/urls", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      setMessage(`Short URL created: ${data.shortUrl}`);
      setUrl("");
      await fetchUrls();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(shortUrl) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setMessage("Short URL copied!");
    } catch {
      setError("Unable to copy. Please copy the link manually.");
    }
  }

async function handleDelete(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this link?"
  );

  if (!confirmed) return;

  setError("");
  setMessage("");

  try {
    await apiRequest(`/api/urls/${id}`, {
      method: "DELETE",
    });

    setUrls((currentUrls) =>
      currentUrls.filter((item) => item._id !== id)
    );

    setMessage("Link deleted successfully!");
  } catch (err) {
    setError(err.message);
  }
}


  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2 className="brand">Linkly 🔗</h2>
        <div className="header-actions">
          <span>{user?.name}</span>
          <button className="secondary-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Welcome, {user?.name || "User"}!</h1>
        <p className="subtitle">
          Create short links and manage them in one place.
        </p>

        <form className="create-form" onSubmit={handleCreate}>
          <label htmlFor="url">Enter your long URL</label>
          <div className="url-input-row">
            <input
              id="url"
              type="url"
              placeholder="https://example.com/your-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button type="submit" disabled={creating}>
              {creating ? "Creating..." : "Shorten URL"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <section className="links-section">
          <h2>My Links</h2>

          {loading ? (
            <p>Loading your links...</p>
          ) : urls.length === 0 ? (
            <p className="subtitle">
              No links yet. Create your first short URL above.
            </p>
          ) : (
            <div className="links-list">
              {urls.map((item) => {
                const shortUrl =
                  `http://localhost:5000/${item.shortId}`;

                return (
                  <article className="link-card" key={item._id}>
                    <div className="link-info">
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shortUrl}
                      </a>
                      <p>{item.redirectURL}</p>
                      <small>
                        Clicks: {item.visitHistory.length}
                      </small>
                    </div>

                    
`   <div className="link-actions">
  <button
    type="button"
    className="secondary-btn"
    onClick={() => handleCopy(shortUrl)}
  >
    Copy
  </button>

  <button
    type="button"
    className="delete-btn"
    onClick={() => handleDelete(item._id)}
  >
    Delete
  </button>
</div>

                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
