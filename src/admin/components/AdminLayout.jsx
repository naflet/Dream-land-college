
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  MapPin,
  Newspaper,
  Users,
  BriefcaseBusiness,
  UserRound,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ClipboardList,
  Star,
  Mail,
  CalendarDays,
  Bell,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../AuthContext";
import api from "../services/api";
import "../styles/admin-layout.css";

import collegeLogo from "../../assets/dream-land-logo.png";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: "COLLEGE MANAGEMENT",
    items: [
      {
        label: "Campuses",
        path: "/admin/campuses",
        icon: MapPin,
      },
      {
        label: "Programs",
        path: "/admin/programs",
        icon: GraduationCap,
      },
      {
        label: "Staff",
        path: "/admin/staff",
        icon: Users,
      },
    ],
  },
  {
    title: "WEBSITE CONTENT",
    items: [
      {
        label: "News & Updates",
        path: "/admin/news",
        icon: Newspaper,
      },
      {
        label: "Academic Calendar",
        path: "/admin/academic-calendar",
        icon: CalendarDays,
      },
      {
        label: "Testimonials",
        path: "/admin/testimonials",
        icon: Star,
      },
    ],
  },
  {
    title: "STUDENT SERVICES",
    items: [
      {
        label: "Applications",
        path: "/admin/applications",
        icon: ClipboardList,
      },
      {
        label: "Consultations",
        path: "/admin/consultations",
        icon: CalendarDays,
      },
      {
        label: "Contact Messages",
        path: "/admin/contact-messages",
        icon: Mail,
      },
    ],
  },
  {
    title: "CAREER MANAGEMENT",
    items: [
      {
        label: "Vacancies",
        path: "/admin/vacancies",
        icon: BriefcaseBusiness,
      },
      {
        label: "Job Applications",
        path: "/admin/job-applications",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "My Profile",
        path: "/admin/profile",
        icon: UserRound,
      },
    ],
  },
];

// ==========================================
// NOTIFICATION TIME FORMAT
// ==========================================

const formatNotificationTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const difference = Math.max(0, Date.now() - date.getTime());

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
};

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Real notification data
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Track notification IDs to detect newly submitted requests.
  const previousNotificationIds = useRef(null);

  // Prevent overlapping notification requests.
  const fetchingNotifications = useRef(false);

  // ==========================================
  // LOAD NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    if (fetchingNotifications.current) return;

    fetchingNotifications.current = true;

    try {
      const response = await api.get("/notifications");

      if (!response?.success) {
        throw new Error("Unable to retrieve notifications.");
      }

      const receivedNotifications = response.notifications || [];

      // Detect notifications that arrived after the initial load.
      const currentIds = new Set(
        receivedNotifications.map((notification) => notification.id)
      );

      if (previousNotificationIds.current !== null) {
        const newNotifications = receivedNotifications.filter(
          (notification) =>
            !previousNotificationIds.current.has(notification.id)
        );

        // Show desktop alerts for newly received requests.
        if (
          newNotifications.length > 0 &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          newNotifications.forEach((notification) => {
            try {
              const alert = new Notification(notification.title, {
                body: notification.message,
                icon: collegeLogo,
              });

              alert.onclick = () => {
                window.focus();
                navigate(notification.target_path || "/admin");
                alert.close();
              };
            } catch (error) {
              console.error("Desktop notification error:", error);
            }
          });
        }
      }

      previousNotificationIds.current = currentIds;

      setNotifications(receivedNotifications);

      setUnreadCount(
        Number.isFinite(response.unreadCount)
          ? response.unreadCount
          : receivedNotifications.filter(
              (notification) => !notification.read_at
            ).length
      );
    } catch (error) {
      console.error("Notification loading error:", error.message);
    } finally {
      fetchingNotifications.current = false;
      setNotificationsLoading(false);
    }
  };

  // ==========================================
  // AUTOMATIC NOTIFICATION CHECKING
  // ==========================================

  useEffect(() => {
    if (!admin?.id) return;

    setNotificationsLoading(true);
    previousNotificationIds.current = null;

    fetchNotifications();

    const notificationInterval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => {
      clearInterval(notificationInterval);
      previousNotificationIds.current = null;
    };
  }, [admin?.id]);

  // ==========================================
  // MARK NOTIFICATION AS READ
  // ==========================================

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read_at) {
        await api.patch(
          `/notifications/${notification.id}/read`
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  read_at: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      }

      setNotificationsOpen(false);

      navigate(notification.target_path || "/admin");
    } catch (error) {
      console.error("Unable to mark notification as read:", error);

      // Still open the relevant request page if marking read fails.
      setNotificationsOpen(false);
      navigate(notification.target_path || "/admin");
    }
  };

  // ==========================================
  // NOTIFICATION BELL
  // ==========================================

  const handleNotificationToggle = async () => {
    setNotificationsOpen((current) => !current);
    setDropdownOpen(false);

    // Ask permission only after the administrator clicks the bell.
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }

    fetchNotifications();
  };

  // ==========================================
  // OUTSIDE CLICK HANDLER
  // ==========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const initials =
    admin?.full_name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "AD";

  const formattedRole = admin?.role?.replace(/_/g, " ") || "Admin";

  return (
    <div className={`admin-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">
            <img
              src={collegeLogo}
              alt="Dream Land College Logo"
              className="admin-sidebar-logo"
            />
          </div>

          <div className="admin-brand-text">
            <strong>Dream Land</strong>
            <span>COLLEGE ADMIN</span>
          </div>

          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

          <button
            className="admin-sidebar-collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar width"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav className="admin-navigation">
          {navigation.map((section) => (
            <div className="admin-nav-section" key={section.title}>
              <p className="admin-nav-heading">{section.title}</p>

              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={() => setSidebarOpen(false)}
                    title={item.label}
                  >
                    <Icon size={18} className="admin-nav-icon" />
                    <span>{item.label}</span>
                    <ChevronRight className="admin-nav-arrow" size={15} />
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">{initials}</div>

            <div className="admin-user-details">
              <strong>{admin?.full_name || "Administrator"}</strong>
              <span>{formattedRole}</span>
            </div>
          </div>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>

            <div className="admin-topbar-title">
              <div className="admin-badge-wrapper">
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="admin-header-logo"
                />

                <span>Dream Land College</span>
              </div>

              <strong>Administration Portal</strong>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* REAL ADMIN NOTIFICATIONS */}

            <div className="admin-notif-container" ref={notifRef}>
              <button
                className="admin-icon-action-btn"
                onClick={handleNotificationToggle}
                aria-label={`View notifications. ${unreadCount} unread`}
                aria-expanded={notificationsOpen}
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span className="admin-pulse-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="admin-dropdown-menu admin-notif-dropdown">
                  <div className="admin-dropdown-header">
                    <strong>Notifications</strong>

                    <span className="admin-unread-chip">
                      {unreadCount} New
                    </span>
                  </div>

                  <div className="admin-notif-list">
                    {notificationsLoading && notifications.length === 0 ? (
                      <div className="admin-notif-item">
                        <div>
                          <p>Loading notifications...</p>
                        </div>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="admin-notif-item">
                        <div>
                          <p>No notifications yet</p>
                          <span>New requests will appear here.</span>
                        </div>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`admin-notif-item ${
                            !notification.read_at ? "unread" : ""
                          }`}
                          role="button"
                          tabIndex={0}
                          title="Open notification"
                          onClick={() =>
                            handleNotificationClick(notification)
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              handleNotificationClick(notification);
                            }
                          }}
                        >
                          <div
                            className={`admin-notif-dot ${
                              notification.read_at ? "inactive" : ""
                            }`}
                          />

                          <div>
                            <p>{notification.title}</p>
                            <span>{notification.message}</span>
                            <span>
                              {formatNotificationTime(
                                notification.created_at
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN ACCOUNT DROPDOWN */}

            <div className="admin-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="admin-topbar-account"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-label="User menu"
              >
                <div className="admin-topbar-avatar">{initials}</div>

                <div className="admin-account-info">
                  <strong>{admin?.full_name || "Administrator"}</strong>
                  <span>{formattedRole}</span>
                </div>

                <ChevronDown
                  size={15}
                  className={`admin-dropdown-chevron ${
                    dropdownOpen ? "open" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="admin-dropdown-menu admin-user-dropdown">
                  <div className="admin-dropdown-user-header">
                    <div className="admin-dropdown-big-avatar">{initials}</div>

                    <div>
                      <strong>{admin?.full_name || "Administrator"}</strong>
                      <p>{admin?.email || "admin@dreamland.edu"}</p>
                    </div>
                  </div>

                  <div className="admin-dropdown-divider" />

                  <div className="admin-dropdown-links">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/admin/profile");
                      }}
                    >
                      <UserRound size={16} />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate("/admin/settings");
                      }}
                    >
                      <Settings size={16} />
                      <span>Portal Settings</span>
                    </button>

                    <button disabled className="admin-disabled-link">
                      <ShieldCheck size={16} />
                      <span>Security & Roles</span>
                    </button>
                  </div>

                  <div className="admin-dropdown-divider" />

                  <div className="admin-dropdown-footer">
                    <button
                      className="admin-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>

        <footer className="admin-footer">
          Dream Land College Administration Portal
        </footer>
      </div>
    </div>
  );
}
