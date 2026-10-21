
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [urls, setUrls] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [expiresInDays, setExpiresInDays] = useState("");
  // Fetch the logged-in user's URLs
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

  // Create a short URL
  async function handleCreate(e) {
    e.preventDefault();

    setError("");
    setMessage("");
    setCreating(true);

    try {
      const data = await apiRequest("/api/urls", {
        method: "POST",
        body: JSON.stringify({
             url: url.trim(),
          customAlias: customAlias.trim(),
            expiresInDays: expiresInDays || null,
        }),
        
      });

      setMessage(`Short URL created: ${data.shortUrl}`);

      // Clear both fields after successful creation
      setUrl("");
      setCustomAlias("");
      setExpiresInDays("");

      await fetchUrls();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  // Copy a short URL
  async function handleCopy(shortUrl) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setMessage("Short URL copied!");
      setError("");
    } catch {
      setError("Unable to copy. Please copy the link manually.");
    }
  }

  // Delete a short URL
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

  // Search, filter, and sort URLs
  const filteredUrls = urls
    .filter((item) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        item.shortId.toLowerCase().includes(query) ||
        item.redirectURL.toLowerCase().includes(query);

      const clicks = item.visitHistory.length;

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "clicked" && clicks > 0) ||
        (filterBy === "notClicked" && clicks === 0);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);

        case "mostClicked":
          return b.visitHistory.length - a.visitHistory.length;

        case "leastClicked":
          return a.visitHistory.length - b.visitHistory.length;

        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Dashboard statistics
  const totalLinks = urls.length;

  const totalClicks = urls.reduce(
    (total, item) => total + item.visitHistory.length,
    0
  );

  const clickedLinks = urls.filter(
    (item) => item.visitHistory.length > 0
  ).length;

  // Click analytics for the last 7 calendar days
  const clickChartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const clicks = urls.reduce((total, item) => {
      const dailyClicks = (item.visitHistory || []).filter((visit) => {
        const timestamp = new Date(visit.timestamp);
        return timestamp >= date && timestamp < nextDate;
      }).length;

      return total + dailyClicks;
    }, 0);

    return {
      date: date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      clicks,
    };
  });

  // Logout
  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h2 className="brand">Linkly 🔗</h2>

        <div className="header-actions">
          <span>{user?.name}</span>

          <button
            type="button"
            className="secondary-btn"
            onClick={handleLogout}
          >
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

        {/* Statistics cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <p>Total Links</p>
            <h2>{totalLinks}</h2>
          </div>

          <div className="stat-card">
            <p>Total Clicks</p>
            <h2>{totalClicks}</h2>
          </div>

          <div className="stat-card">
            <p>Active Links</p>
            <h2>{clickedLinks}</h2>
          </div>
        </div>

        {/* Click analytics chart */}
        <section className="analytics-card">
          <h2>Click Analytics</h2>

          <p className="subtitle">
            Clicks over the last 7 days
          </p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clickChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Clicks"
                  stroke="#635bff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Create URL form */}
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

          <label htmlFor="customAlias">
            Custom alias (optional)
          </label>

          <input
            id="customAlias"
            type="text"
            placeholder="e.g. my-portfolio"
            value={customAlias}
            onChange={(e) => setCustomAlias(e.target.value)}
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]{3,30}"
            title="Use 3–30 letters, numbers, hyphens, or underscores."
          />
          <label htmlFor="expiresInDays">
             Link expiration (optional)
            </label>

        <select
        id="expiresInDays"
        value={expiresInDays}
        onChange={(e) => setExpiresInDays(e.target.value)}
        >
            <option value="">Never expires</option>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
             <option value="30">30 days</option>
             <option value="90">90 days</option>
            <option value="365">365 days</option>
        </select>
        </form>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {/* Links list */}
        <section className="links-section">
          <h2>My Links ({filteredUrls.length})</h2>

          {/* Search, sort, and filter controls */}
          <div className="link-controls">
            <input
              type="search"
              placeholder="Search by short ID or original URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search links"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort links"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="mostClicked">Most clicked</option>
              <option value="leastClicked">Least clicked</option>
            </select>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              aria-label="Filter links by clicks"
            >
              <option value="all">All links</option>
              <option value="clicked">With clicks</option>
              <option value="notClicked">Without clicks</option>
            </select>
          </div>

          {loading ? (
            <p>Loading your links...</p>
          ) : filteredUrls.length === 0 ? (
            <p className="subtitle">
              {urls.length === 0
                ? "No links yet. Create your first short URL above."
                : "No links match your search or filter."}
            </p>
          ) : (
            <div className="links-list">
              {filteredUrls.map((item) => {
                const shortUrl = `http://localhost:5000/${item.shortId}`;

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

                    <div className="link-actions">
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
