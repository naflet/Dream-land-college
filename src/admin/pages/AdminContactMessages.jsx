
import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Archive,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

import api from "../services/api";
import "../styles/admin-contact-messages.css";

const statuses = ["all", "unread", "read", "replied", "archived"];

const statusStyles = {
  unread: "unread",
  read: "read",
  replied: "replied",
  archived: "archived",
};

function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/contact");

      setMessages(response?.contactMessages || []);
    } catch (err) {
      setError(err.message || "Failed to load contact messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesStatus =
        statusFilter === "all" || message.status === statusFilter;

      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        message.name?.toLowerCase().includes(searchText) ||
        message.email?.toLowerCase().includes(searchText) ||
        message.subject?.toLowerCase().includes(searchText) ||
        message.message?.toLowerCase().includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [messages, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: messages.length,
      unread: messages.filter((item) => item.status === "unread").length,
      read: messages.filter((item) => item.status === "read").length,
      replied: messages.filter((item) => item.status === "replied").length,
      archived: messages.filter((item) => item.status === "archived").length,
    };
  }, [messages]);

  const openMessage = async (message) => {
    setSelectedMessage(message);

    if (message.status === "unread") {
      await updateStatus(message.id, "read", false);
    }
  };

  const updateStatus = async (id, status, showError = true) => {
    try {
      setUpdating(true);

      const response = await api.patch(`/contact/${id}`, { status });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update message.");
      }

      setMessages((previous) =>
        previous.map((message) =>
          message.id === id
            ? { ...message, ...response.contactMessage }
            : message
        )
      );

      setSelectedMessage((previous) =>
        previous?.id === id
          ? { ...previous, ...response.contactMessage }
          : previous
      );

      return true;
    } catch (err) {
      if (showError) {
        setError(err.message || "Failed to update message status.");
      }
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const deleteMessage = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this contact message?"
    );

    if (!confirmed) return;

    try {
      setUpdating(true);
      setError("");

      const response = await api.delete(`/contact/${id}`);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete message.");
      }

      setMessages((previous) =>
        previous.filter((message) => message.id !== id)
      );

      setSelectedMessage(null);
    } catch (err) {
      setError(err.message || "Failed to delete contact message.");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="contact-messages-page">
      <div className="cm-page-header">
        <div>
          <span className="cm-eyebrow">STUDENT SERVICES</span>
          <h1>Contact Messages</h1>
          <p>Manage and respond to messages submitted through your website.</p>
        </div>

        <button
          className="cm-refresh-button"
          onClick={loadMessages}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "cm-spinning" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="cm-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="cm-stats-grid">
        <div className="cm-stat-card">
          <div className="cm-stat-icon total"><Mail size={21} /></div>
          <div>
            <span>Total Messages</span>
            <strong>{counts.total}</strong>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-icon unread"><MessageSquare size={21} /></div>
          <div>
            <span>Unread</span>
            <strong>{counts.unread}</strong>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-icon read"><Eye size={21} /></div>
          <div>
            <span>Read</span>
            <strong>{counts.read}</strong>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-icon replied"><CheckCircle2 size={21} /></div>
          <div>
            <span>Replied</span>
            <strong>{counts.replied}</strong>
          </div>
        </div>

        <div className="cm-stat-card">
          <div className="cm-stat-icon archived"><Archive size={21} /></div>
          <div>
            <span>Archived</span>
            <strong>{counts.archived}</strong>
          </div>
        </div>
      </div>

      <div className="cm-content-card">
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, email, subject or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="cm-filter"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "all"
                  ? "All Messages"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="cm-table-wrapper">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Date Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="cm-empty">
                    <RefreshCw size={23} className="cm-spinning" />
                    <span>Loading contact messages...</span>
                  </td>
                </tr>
              ) : filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="cm-empty">
                    <Mail size={30} />
                    <strong>No contact messages found</strong>
                    <span>Messages submitted through your website will appear here.</span>
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr key={message.id}>
                    <td>
                      <div className="cm-sender">
                        <strong>{message.name}</strong>
                        <span>{message.email}</span>
                      </div>
                    </td>

                    <td>{message.subject || "General Inquiry"}</td>

                    <td>
                      <div className="cm-message-preview">
                        {message.message}
                      </div>
                    </td>

                    <td className="cm-date">
                      {formatDate(message.created_at)}
                    </td>

                    <td>
                      <span className={`cm-status ${statusStyles[message.status] || ""}`}>
                        {message.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="cm-action-button"
                        onClick={() => openMessage(message)}
                        title="View message"
                        aria-label="View message"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="cm-table-footer">
          Showing {filteredMessages.length} of {messages.length} messages
        </div>
      </div>

      {selectedMessage && (
        <div
          className="cm-modal-overlay"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="cm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cm-modal-header">
              <div>
                <span className="cm-eyebrow">MESSAGE DETAILS</span>
                <h2>Contact Message</h2>
              </div>

              <button
                className="cm-close-button"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message"
              >
                <X size={21} />
              </button>
            </div>

            <div className="cm-modal-body">
              <div className="cm-detail-row">
                <span>Sender Name</span>
                <strong>{selectedMessage.name}</strong>
              </div>

              <div className="cm-detail-row">
                <span>Email Address</span>
                <strong>{selectedMessage.email}</strong>
              </div>

              <div className="cm-detail-row">
                <span>Phone Number</span>
                <strong>{selectedMessage.phone || "Not provided"}</strong>
              </div>

              <div className="cm-detail-row">
                <span>Subject / Department</span>
                <strong>{selectedMessage.subject || "General Inquiry"}</strong>
              </div>

              <div className="cm-detail-row">
                <span>Date Received</span>
                <strong>{formatDate(selectedMessage.created_at)}</strong>
              </div>

              <div className="cm-detail-row">
                <span>Current Status</span>
                <span className={`cm-status ${statusStyles[selectedMessage.status] || ""}`}>
                  {selectedMessage.status}
                </span>
              </div>

              <div className="cm-full-message">
                <span>Message</span>
                <p>{selectedMessage.message}</p>
              </div>

              <div className="cm-status-control">
                <label htmlFor="cm-status-select">Update Message Status</label>

                <select
                  id="cm-status-select"
                  value={selectedMessage.status}
                  onChange={(e) =>
                    updateStatus(selectedMessage.id, e.target.value)
                  }
                  disabled={updating}
                >
                  {statuses
                    .filter((status) => status !== "all")
                    .map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="cm-modal-footer">
              <button
                className="cm-delete-button"
                onClick={() => deleteMessage(selectedMessage.id)}
                disabled={updating}
              >
                <Trash2 size={17} />
                Delete Message
              </button>

              <button
                className="cm-done-button"
                onClick={() => setSelectedMessage(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContactMessages;
