import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Login from "./pages/Login";
import StaffBilling from "./pages/StaffBilling";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStaff from "./pages/AdminStaff";
import AdminDishes from "./pages/AdminDishes";
import AdminReports from "./pages/AdminReports";
import AdminRooms from "./pages/AdminRooms";
import AdminRoomReports from "./pages/AdminRoomReports";
import AdminTables from "./pages/AdminTables";
import StaffRoomBooking from "./pages/StaffRoomBooking";
import StaffKotBilling from "./pages/StaffKotBilling";
import StaffGRC from "./pages/StaffGRC";

// Guard for Admin Routes
const AdminRoute = ({ children, currentUser, handleLogout, theme, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "admin") return <Navigate to="/staff" replace />;
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <Navbar 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex flex-1 min-w-0 relative h-[calc(100vh-73px)]">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        <div className="flex-1 bg-slate-950/20 animate-fade-in min-w-0 overflow-x-hidden overflow-y-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

// Guard for Staff Routes
const StaffRoute = ({ children, currentUser, handleLogout, theme, toggleTheme }) => {
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "staff" && currentUser.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentUser={currentUser} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      <div className="flex-1 bg-slate-950/20">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold">
        Initializing Billing Desk...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Unified Login Route */}
        <Route
          path="/login"
          element={
            currentUser ? (
              currentUser.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/staff" replace />
              )
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Staff POS Billing Route */}
        <Route
          path="/staff"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffBilling />
            </StaffRoute>
          }
        />

        {/* Admin Reports & Charts Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Admin Billing Reports Route */}
        <Route
          path="/admin/reports"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminReports />
            </AdminRoute>
          }
        />

        {/* Admin Manage Rooms Route */}
        <Route
          path="/admin/rooms"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminRooms />
            </AdminRoute>
          }
        />

        {/* Admin Room Bookings Route */}
        <Route
          path="/admin/room-reports"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminRoomReports />
            </AdminRoute>
          }
        />

        {/* Staff Room Booking Route */}
        <Route
          path="/staff/rooms"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffRoomBooking />
            </StaffRoute>
          }
        />

        {/* Staff GRC Route */}
        <Route
          path="/staff/grc"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffGRC />
            </StaffRoute>
          }
        />

        {/* Admin Staff Registrations Route */}
        <Route
          path="/admin/staff"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminStaff />
            </AdminRoute>
          }
        />

        {/* Admin Menu Catalog Route */}
        <Route
          path="/admin/dishes"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminDishes />
            </AdminRoute>
          }
        />

        {/* Admin Tables Route */}
        <Route
          path="/admin/tables"
          element={
            <AdminRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <AdminTables />
            </AdminRoute>
          }
        />

        {/* Staff KOT Billing Route */}
        <Route
          path="/staff/kot"
          element={
            <StaffRoute currentUser={currentUser} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
              <StaffKotBilling />
            </StaffRoute>
          }
        />

        {/* Fallback routing */}
        <Route
          path="*"
          element={
            currentUser ? (
              currentUser.role === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/staff" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
