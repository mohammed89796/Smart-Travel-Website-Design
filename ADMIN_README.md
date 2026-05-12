# Smart Travel Admin Dashboard - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1️⃣ Start Backend Server
```bash
cd server
npm start
```
✓ Runs on http://localhost:5000

### 2️⃣ Start Frontend Server
```bash
# In a new terminal, from root directory
npm run dev
```
✓ Runs on http://localhost:5173

### 3️⃣ Access Admin Dashboard
Open browser: **http://localhost:5173/admin**

**Login with:**
- Email: `admin@smarttravel.com`
- Password: `SecurePassword123`

---

## 📚 Full Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[ADMIN_DASHBOARD_QUICKSTART.md](./ADMIN_DASHBOARD_QUICKSTART.md)** | Get running in 5 min, first tasks | 5 min |
| **[ADMIN_ACCESS_GUIDE.md](./ADMIN_ACCESS_GUIDE.md)** | Complete usage guide, all features | 20 min |
| **[ADMIN_FRONTEND_ARCHITECTURE.md](./ADMIN_FRONTEND_ARCHITECTURE.md)** | Technical architecture for developers | 15 min |
| **[ADMIN_DASHBOARD_COMPLETE.md](./ADMIN_DASHBOARD_COMPLETE.md)** | Full implementation reference | Reference |
| **[ADMIN_DOCUMENTATION_INDEX.md](./ADMIN_DOCUMENTATION_INDEX.md)** | Documentation navigation | Navigation |
| **[server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md)** | All 40+ API endpoints | Reference |

---

## 🎯 What You Can Do

✅ **Manage Destinations** - Add, edit, delete travel spots  
✅ **Track Bookings** - View all reservations with status  
✅ **Manage Users** - View and manage user accounts  
✅ **Moderate Reviews** - Approve/reject user feedback  
✅ **View Analytics** - Charts, trends, KPI metrics  
✅ **Real-time Stats** - Dashboard with live data  

---

## 🔑 Key Routes

```
http://localhost:5173/             → Home
http://localhost:5173/admin        → Admin Dashboard
http://localhost:5173/dashboard    → User Dashboard
http://localhost:5173/planning     → Trip Planning
http://localhost:5173/itinerary    → Itinerary View
```

---

## 🎨 Dashboard Features

**6 Main Tabs:**

1. **Overview** - KPIs, statistics, quick actions
2. **Destinations** - Manage travel locations (full CRUD)
3. **Bookings** - Track reservations and status
4. **Users** - Manage user accounts
5. **Reviews** - Moderate user reviews
6. **Analytics** - Charts and reports with date ranges

---

## 🆘 Quick Troubleshooting

**"Cannot connect to server"**
- Verify backend started: `npm start` in server/
- Check MongoDB is running
- Backend should show: "Server running on http://localhost:5000"

**"Login fails"**
- Verify credentials: admin@smarttravel.com / SecurePassword123
- Check backend logs for errors
- Clear localStorage: `localStorage.clear()` in browser console

**"Dashboard shows blank"**
- Clear cache: Ctrl+Shift+Delete
- Restart server: Ctrl+C, then `npm run dev`
- Check browser console (F12) for errors

---

## 📦 What's Installed

✅ **React 18.3.1** - UI framework  
✅ **React Router DOM** - URL routing  
✅ **TypeScript** - Type safety  
✅ **Tailwind CSS** - Styling  
✅ **Recharts** - Charts/analytics  
✅ **Axios** - API calls  
✅ **Lucide Icons** - UI icons  

**Backend:**
✅ **Express** - Server framework  
✅ **MongoDB** - Database  
✅ **JWT** - Authentication  
✅ **bcryptjs** - Password hashing  

---

## 🔐 Security Notes

⚠️ **Change default password after first login!**

To reset admin password:
```bash
mongosh
use smart_travel
# Update with bcrypt-hashed password
db.admins.updateOne(
  { email: "admin@smarttravel.com" },
  { $set: { password: "your_hashed_password" } }
)
```

---

## 📊 Tech Stack

**Frontend:**
- React + TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Recharts (charts)
- Axios (API client)

**Backend:**
- Node.js + Express
- MongoDB
- JWT authentication
- RBAC (Role-based access control)

---

## ✨ Next Steps

1. **Start the servers** (see 3 steps above)
2. **Login to admin dashboard**
3. **Try creating a destination** (see quickstart guide)
4. **Check analytics** to see sample data
5. **Read docs** for advanced features

---

## 📞 Documentation Structure

```
Smart Travel Website Design/
├── README.md (← you are here)
├── ADMIN_DASHBOARD_QUICKSTART.md ← START HERE
├── ADMIN_ACCESS_GUIDE.md
├── ADMIN_FRONTEND_ARCHITECTURE.md
├── ADMIN_DASHBOARD_COMPLETE.md
├── ADMIN_DOCUMENTATION_INDEX.md
├── server/
│   ├── API_DOCUMENTATION.md
│   └── npm start (backend)
├── src/
│   └── app/components/
│       ├── AdminLogin.tsx
│       ├── AdminDashboard.tsx
│       ├── DestinationManager.tsx
│       ├── BookingManager.tsx
│       ├── UserManager.tsx
│       ├── ReviewManager.tsx
│       └── AnalyticsDashboard.tsx
└── npm run dev (frontend)
```

---

## 🎉 Ready to Go!

Your admin dashboard is fully functional and ready to use.

**First time?** → Read [ADMIN_DASHBOARD_QUICKSTART.md](./ADMIN_DASHBOARD_QUICKSTART.md)  
**Want details?** → Check [ADMIN_ACCESS_GUIDE.md](./ADMIN_ACCESS_GUIDE.md)  
**Developer?** → See [ADMIN_FRONTEND_ARCHITECTURE.md](./ADMIN_FRONTEND_ARCHITECTURE.md)  

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Updated:** April 2026
