# 🔗 Linkly — URL Shortener

A full-stack URL shortener built with React, Node.js, Express, and MongoDB. Linkly lets users create, manage, and track shortened URLs through a clean dashboard.

## 🚀 Live Demo

- **Frontend:** linkly-url-shortener-fawn.vercel.app
- **Backend API:** https://linkly-backend-ogmf.onrender.com
- **GitHub Repository:** https://github.com/amoghshetty04/linkly-url-shortener

## ✨ Features

- **User Authentication** — Sign up and log in securely using JWT authentication and password hashing.
- **URL Shortening** — Convert long URLs into short, shareable links.
- **Custom Aliases** — Create personalized short URL aliases.
- **Link Expiration** — Set expiration periods for shortened links.
- **Dashboard** — View and manage your shortened URLs.
- **Individual Link Analytics** — Track clicks and view visit history for each link.
- **Analytics Visualization** — View click activity over time.
- **QR Code Generation** — Generate and download QR codes for shortened URLs.
- **Search, Filter and Sort** — Find and organize links.
- **Edit and Delete Links** — Update or remove existing links.
- **Dark and Light Mode** — Switch dashboard themes.
- **Responsive Interface** — Use the application across different screen sizes.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Recharts
- qrcode.react
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- nanoid

### Deployment
- **Vercel** — Frontend hosting
- **Render** — Backend hosting
- **MongoDB Atlas** — Cloud database
- **GitHub** — Version control

## 🏗️ Architecture

```text
User / Browser
      |
      v
React Frontend (Vercel)
      |
      | REST API requests
      v
Express Backend (Render)
      |
      v
MongoDB Atlas
      |
      v
Users, URLs and Click History
```

When someone opens a shortened URL, the backend looks up the corresponding original URL, records the visit, and redirects the visitor.

## 📁 Project Structure

```text
linkly/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Url.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── urlRoutes.js
│   ├── .env
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── .env
│   ├── package.json
│   └── index.html
│
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A MongoDB database, either local MongoDB or [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Clone the repository

```bash
git clone https://github.com/amoghshetty04/linkly-url-shortener.git
cd linkly-url-shortener
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
```

Replace the example values with your own credentials. Never commit `.env` files or expose database passwords and JWT secrets.

### 3. Start the backend

Run the command configured in your backend's `package.json`. If its development script uses Nodemon:

```bash
npm run dev
```

The local backend should be available at:

```text
http://localhost:5000
```

### 4. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## 🔌 API Overview

The backend exposes REST API endpoints for authentication, URL management, and analytics.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| POST | `/api/auth/signup` | Register an account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/urls` | Get the authenticated user's URLs |
| POST | `/api/urls` | Create a shortened URL |
| PUT | `/api/urls/:id` | Update a URL |
| DELETE | `/api/urls/:id` | Delete a URL |
| GET | `/api/urls/:id/analytics` | Retrieve link analytics |
| GET | `/:shortId` | Redirect to the original URL |

Protected endpoints require a valid JWT access token. The exact request fields and response formats are defined in the backend route handlers.

## 📊 Analytics

Linkly records visit timestamps for shortened URLs. The dashboard uses this history to display:

- Total clicks
- Click activity by day
- Recent visits
- Individual link performance

## 🔐 Security Notes

- Passwords are hashed before storage.
- JWTs are used for authenticated API access.
- URL management operations are restricted to the link owner.
- Redirect destinations are validated when links are created or updated.
- Environment variables are used for sensitive configuration.

## 🚢 Deployment

### Backend — Render

1. Connect the GitHub repository to Render.
2. Set the root directory to `backend`.
3. Configure the build and start commands using `backend/package.json`.
4. Add `MONGO_URI`, `JWT_SECRET`, and `NODE_ENV=production` as environment variables.
5. Configure MongoDB Atlas Network Access to permit the backend's outbound connections.

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Use the Vite framework preset.
4. Set the output directory to `dist`.
5. Configure `VITE_API_URL` to the deployed backend URL.
6. Ensure backend CORS allows requests from the production frontend domain.

If the application uses React Router, configure Vercel rewrites so direct navigation to routes such as `/login` and `/signup` serves the React application.

## 🔮 Future Improvements

- Custom domains for shortened links
- More detailed analytics and date-range filters
- Link sharing and export options
- Rate limiting and abuse prevention
- Automated testing and CI/CD improvements

## 👨‍💻 Author

**Amogh Shetty**

- GitHub: [@amoghshetty04](https://github.com/amoghshetty04)

---

If you find this project useful, consider giving the repository a ⭐.
