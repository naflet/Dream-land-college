
import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  GraduationCap,
  MapPin,
  Users,
  Newspaper,
  MessageSquare,
  CalendarDays,
  BriefcaseBusiness,
  RefreshCw,
  TrendingUp,
  Clock3,
} from "lucide-react";

import api from "../services/api";
import "../styles/admin-dashboard.css";

const dashboardResources = [
  {
    title: "Applications",
    endpoint: "/applications",
    icon: ClipboardList,
    color: "blue",
  },
  {
    title: "Programs",
    endpoint: "/programs",
    icon: GraduationCap,
    color: "green",
  },
  {
    title: "Campuses",
    endpoint: "/campuses",
    icon: MapPin,
    color: "purple",
  },
  {
    title: "Staff Members",
    endpoint: "/staff",
    icon: Users,
    color: "orange",
  },
  {
    title: "News Articles",
    endpoint: "/news",
    icon: Newspaper,
    color: "pink",
  },
  {
    title: "Contact Messages",
    endpoint: "/contact",
    icon: MessageSquare,
    color: "teal",
  },
  {
    title: "Consultations",
    endpoint: "/consultations",
    icon: CalendarDays,
    color: "indigo",
  },
  {
    title: "Job Applications",
    endpoint: "/job-applications",
    icon: BriefcaseBusiness,
    color: "red",
  },
];

function getRecords(response) {
  if (Array.isArray(response)) return response;

  const possibleArrays = [
    response?.data,
    response?.records,
    response?.applications,
    response?.campuses,
    response?.programs,
    response?.staff,
    response?.news,
    response?.messages,
    response?.consultations,
    response?.jobApplications,
  ];

  return possibleArrays.find(Array.isArray) || null;
}

function getCount(response, records) {
  if (typeof response?.count === "number") {
    return response.count;
  }

  if (typeof response?.totalRecords === "number") {
    return response.totalRecords;
  }

  if (typeof response?.total === "number") {
    return response.total;
  }

  if (records) {
    return records.length;
  }

  return null;
}

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled(
        dashboardResources.map((resource) =>
          api.get(resource.endpoint)
        )
      );

      const stats = [];
      const recent = [];

      results.forEach((result, index) => {
        const resource = dashboardResources[index];

        if (result.status !== "fulfilled") {
          stats.push({
            ...resource,
            count: null,
            failed: true,
          });
          return;
        }

        const response = result.value;
        const records = getRecords(response);
        const count = getCount(response, records);

        stats.push({
          ...resource,
          count,
          failed: count === null,
        });

        if (records) {
          records.forEach((record) => {
            const date =
              record.created_at ||
              record.createdAt ||
              record.submitted_at ||
              record.updated_at;

            recent.push({
              id: record.id || `${resource.title}-${recent.length}`,
              title:
                record.full_name ||
                record.name ||
                record.title ||
                record.subject ||
                resource.title,
              category: resource.title,
              date: date ? new Date(date) : null,
            });
          });
        }
      });

      recent.sort((a, b) => {
        const first = a.date?.getTime() || 0;
        const second = b.date?.getTime() || 0;
        return second - first;
      });

      setStatistics(stats);
      setRecentRecords(recent.slice(0, 8));

      if (stats.every((item) => item.failed)) {
        setError(
          "Dashboard data could not be loaded. Check your backend connection and administrator permissions."
        );
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("An unexpected error occurred while loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const formatDate = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-heading">
        <div>
          <span className="admin-eyebrow">OVERVIEW</span>
          <h1>Dashboard</h1>
          <p>Welcome to your college administration workspace.</p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "is-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-dashboard-section-heading">
        <div>
          <h2>College Overview</h2>
          <p>Records retrieved from your administration system.</p>
        </div>
        <TrendingUp size={20} />
      </div>

      <div className="admin-stat-grid">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <article className="admin-stat-card" key={item.title}>
              <div className={`admin-stat-icon ${item.color}`}>
                <Icon size={21} />
              </div>

              <div className="admin-stat-info">
                <span>{item.title}</span>
                <strong>
                  {loading
                    ? "..."
                    : item.count === null
                      ? "—"
                      : item.count.toLocaleString()}
                </strong>
                <small>
                  {item.failed ? "Data unavailable" : "Total records"}
                </small>
              </div>
            </article>
          );
        })}
      </div>

      <section className="admin-recent-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <h2>Recent Records</h2>
            <p>Latest records available from your system.</p>
          </div>
          <Clock3 size={20} />
        </div>

        {loading ? (
          <div className="admin-dashboard-empty">
            Loading recent records...
          </div>
        ) : recentRecords.length > 0 ? (
          <div className="admin-recent-list">
            {recentRecords.map((record) => (
              <div className="admin-recent-item" key={record.id}>
                <div className="admin-recent-marker">
                  <ClipboardList size={17} />
                </div>

                <div className="admin-recent-details">
                  <strong>{record.title}</strong>
                  <span>{record.category}</span>
                </div>

                <time>{formatDate(record.date)}</time>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-dashboard-empty">
            No recent records are available.
          </div>
        )}
      </section>
    </div>
  );
}
