import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_EDIT_FORM = {
  url: "",
  customAlias: "",
  expiresInDays: "",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [urls, setUrls] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("linkly-theme") === "dark"
  );

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [savingEdit, setSavingEdit] = useState(false);

  function toggleTheme() {
    setDarkMode((current) => {
      const nextTheme = !current;
      localStorage.setItem("linkly-theme", nextTheme ? "dark" : "light");
      return nextTheme;
    });
  }

  async function fetchUrls() {
    try {
      const data = await apiRequest("/api/urls");
      setUrls(Array.isArray(data.urls) ? data.urls : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load your links.");
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
        body: JSON.stringify({
          url: url.trim(),
          customAlias: customAlias.trim(),
          expiresInDays: expiresInDays || null,
        }),
      });

      setMessage(`Short URL created: ${data.shortUrl || ""}`);
      setUrl("");
      setCustomAlias("");
      setExpiresInDays("");
      await fetchUrls();
    } catch (err) {
      setError(err.message || "Unable to create the short link.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(shortUrl) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setMessage("Short URL copied!");
      setError("");
    } catch {
      setError("Unable to copy. Please copy the link manually.");
      setMessage("");
    }
  }

  function handleDownloadQR(item) {
    const svg = document.getElementById(`qr-${item._id}`);

    if (!svg) {
      setError("Unable to find the QR code.");
      return;
    }

    try {
      const svgClone = svg.cloneNode(true);
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `linkly-${item.shortId}-qr.svg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      setMessage("QR code downloaded!");
      setError("");
    } catch {
      setError("Unable to download the QR code.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this link?")) return;

    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/urls/${id}`, { method: "DELETE" });
      setUrls((currentUrls) => currentUrls.filter((item) => item._id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Link deleted successfully!");
    } catch (err) {
      setError(err.message || "Unable to delete this link.");
    }
  }

  function handleEdit(item) {
    const remainingDays = item.expiresAt
      ? Math.max(
          1,
          Math.ceil(
            (new Date(item.expiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : "";

    setEditingId(item._id);
    setEditForm({
      url: item.redirectURL || "",
      customAlias: item.shortId || "",
      expiresInDays: remainingDays ? String(remainingDays) : "",
    });
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setError("");
    setMessage("");
    setSavingEdit(true);

    try {
      await apiRequest(`/api/urls/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({
          url: editForm.url.trim(),
          customAlias: editForm.customAlias.trim(),
          expiresInDays: editForm.expiresInDays || null,
        }),
      });

      setMessage("Link updated successfully!");
      cancelEdit();
      await fetchUrls();
    } catch (err) {
      setError(err.message || "Unable to update this link.");
    } finally {
      setSavingEdit(false);
    }
  }

  const filteredUrls = useMemo(() => {
    return urls
      .filter((item) => {
        const query = search.trim().toLowerCase();
        const shortId = (item.shortId || "").toLowerCase();
        const destination = (item.redirectURL || "").toLowerCase();
        const matchesSearch =
          shortId.includes(query) || destination.includes(query);

        const clicks = (item.visitHistory || []).length;
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
            return (b.visitHistory || []).length - (a.visitHistory || []).length;
          case "leastClicked":
            return (a.visitHistory || []).length - (b.visitHistory || []).length;
          case "newest":
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  }, [urls, search, sortBy, filterBy]);

  const totalLinks = urls.length;
  const totalClicks = urls.reduce(
    (total, item) => total + (item.visitHistory || []).length,
    0
  );
  const clickedLinks = urls.filter(
    (item) => (item.visitHistory || []).length > 0
  ).length;

  const clickChartData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
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
      }),
    [urls]
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={`dashboard ${darkMode ? "dark-mode" : "light-mode"}`}>
      <header className="dashboard-header">
        <h2 className="brand">Linkly 🔗</h2>
        <div className="header-actions">
          <span>{user?.name || "User"}</span>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
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

        <section className="stats-grid" aria-label="Link statistics">
          <div className="stat-card">
            <p>Total Links</p>
            <h2>{totalLinks}</h2>
          </div>
          <div className="stat-card">
            <p>Total Clicks</p>
            <h2>{totalClicks}</h2>
          </div>
          <div className="stat-card">
            <p>Links With Clicks</p>
            <h2>{clickedLinks}</h2>
          </div>
        </section>

        <section className="analytics-card">
          <h2>Click Analytics</h2>
          <p className="subtitle">Clicks over the last 7 days</p>
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

        <form className="create-form" onSubmit={handleCreate}>
          <h2>Create a Short Link</h2>
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

          <label htmlFor="customAlias">Custom alias (optional)</label>
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

          <label htmlFor="expiresInDays">Link expiration</label>
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

        <section className="links-section">
          <h2>My Links ({filteredUrls.length})</h2>

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
                const shortUrl = `${API_BASE_URL}/${item.shortId}`;
                const history = item.visitHistory || [];
                const isExpired =
                  item.expiresAt && new Date(item.expiresAt) <= new Date();

                return (
                  <article className="link-card" key={item._id}>
                    {editingId === item._id && (
                      <form className="edit-form" onSubmit={handleSaveEdit}>
                        <h3>Edit Short Link</h3>

                        <label htmlFor={`edit-url-${item._id}`}>
                          Destination URL
                        </label>
                        <input
                          id={`edit-url-${item._id}`}
                          type="url"
                          required
                          value={editForm.url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, url: e.target.value })
                          }
                        />

                        <label htmlFor={`edit-alias-${item._id}`}>
                          Custom alias
                        </label>
                        <input
                          id={`edit-alias-${item._id}`}
                          type="text"
                          minLength={3}
                          maxLength={30}
                          pattern="[a-zA-Z0-9_-]{3,30}"
                          required
                          value={editForm.customAlias}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              customAlias: e.target.value,
                            })
                          }
                        />

                        <label htmlFor={`edit-expiry-${item._id}`}>
                          Expiration
                        </label>
                        <select
                          id={`edit-expiry-${item._id}`}
                          value={editForm.expiresInDays}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              expiresInDays: e.target.value,
                            })
                          }
                        >
                          <option value="">Never expires</option>
                          <option value="1">1 day</option>
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="365">365 days</option>
                        </select>

                        <div className="link-actions">
                          <button type="submit" disabled={savingEdit}>
                            {savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="link-info">
                      <a href={shortUrl} target="_blank" rel="noreferrer">
                        {shortUrl}
                      </a>
                      <p className="original-url">{item.redirectURL}</p>
                      <small>Clicks: {history.length}</small>
                      <p>
                        {isExpired
                          ? "Status: Expired"
                          : item.expiresAt
                          ? `Expires: ${new Date(
                              item.expiresAt
                            ).toLocaleDateString("en-IN")}`
                          : "Expires: Never"}
                      </p>

                      <div className="qr-code">
                        <QRCodeSVG
                          id={`qr-${item._id}`}
                          value={shortUrl}
                          size={140}
                          level="H"
                          includeMargin
                        />
                      </div>
                    </div>

                    <div className="link-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleCopy(shortUrl)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleDownloadQR(item)}
                      >
                        Download QR
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
