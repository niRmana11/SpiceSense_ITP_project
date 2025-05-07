
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../Styles/FinancialReports.css";

const FinancialReports = () => {
  const [topItems, setTopItems] = useState([]);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, transactionCount: 0 });
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    fetchFinancialReports();
  }, []);
//get top items , summary , full log
  const fetchFinancialReports = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/payments/financial-reports");
      setTopItems(response.data.topItems);
      setPaymentLogs(response.data.paymentLogs);
      setFilteredLogs(response.data.paymentLogs);
      setSummary(response.data.summary || { totalRevenue: 0, transactionCount: 0 });
    } catch (error) {
      toast.error("Failed to fetch financial reports");
      console.error(error);
    }
  };

  const handleDownload = async (type, period) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/payments/financial-report/download/${type}/${period}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `financial-report-${period}.${type === "excel" ? "xlsx" : type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(`Failed to download ${type.toUpperCase()} report`);
      console.error(error);
    }
  };

  const handleDateFilter = () => {
    if (!dateFilter.start || !dateFilter.end) {
      setFilteredLogs(paymentLogs);
      return;
    }
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    endDate.setHours(23, 59, 59, 999);

    const filtered = paymentLogs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
    setFilteredLogs(filtered);
  };

  return (
    <div className="financial-container">
      <h1 className="financial-title">Financial Reports</h1>

      {/* Summary Statistics */}
      <div className="financial-stats-grid">
        <div className="financial-stat-card">
          <h3 className="financial-stat-title">Total Revenue</h3>
          <p className="financial-stat-value">${(summary.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="financial-stat-card">
          <h3 className="financial-stat-title">Transactions</h3>
          <p className="financial-stat-value">{summary.transactionCount || 0}</p>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="financial-top-items">
        <h2 className="financial-section-title">Top 3 Best-Selling Items</h2>
        <div className="financial-card">
          {topItems.length > 0 ? (
            <ul className="financial-item-list">
              {topItems.map((item, index) => (
                <li key={index} className="financial-item">
                  {item.name || `Item ${index + 1}`}: {item.quantity} units sold, ${item.revenue.toFixed(2)} revenue
                </li>
              ))}
            </ul>
          ) : (
            <p className="financial-no-data">No sales data available.</p>
          )}
        </div>
      </div>

      {/* Download Reports */}
      <div className="financial-download-section">
        <h2 className="financial-section-title">Download Reports</h2>
        <div className="financial-card">
          <div className="financial-download-grid">
            <div className="financial-download-item">
              <h3 className="financial-download-title">Daily</h3>
              <button
                onClick={() => handleDownload("pdf", "daily")}
                className="financial-action-btn"
              >
                PDF
              </button>
              <button
                onClick={() => handleDownload("excel", "daily")}
                className="financial-action-btn"
              >
                Excel
              </button>
            </div>
            <div className="financial-download-item">
              <h3 className="financial-download-title">Weekly</h3>
              <button
                onClick={() => handleDownload("pdf", "weekly")}
                className="financial-action-btn"
              >
                PDF
              </button>
              <button
                onClick={() => handleDownload("excel", "weekly")}
                className="financial-action-btn"
              >
                Excel
              </button>
            </div>
            <div className="financial-download-item">
              <h3 className="financial-download-title">Monthly</h3>
              <button
                onClick={() => handleDownload("pdf", "monthly")}
                className="financial-action-btn"
              >
                PDF
              </button>
              <button
                onClick={() => handleDownload("excel", "monthly")}
                className="financial-action-btn"
              >
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <div className="financial-date-filter">
        <h2 className="financial-section-title">Filter Payment Logs by Date</h2>
        <div className="financial-card">
          <div className="financial-filter-inputs">
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="financial-date-input"
            />
            <h3 className="financial-stat-title">To</h3>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="financial-date-input"
            />
            <button
              onClick={handleDateFilter}
              className="financial-action-btn"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Payment Logs Table */}
      <div className="financial-payment-logs">
        <h2 className="financial-section-title">Payment Logs</h2>
        <div className="financial-card">
          <table className="financial-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Card Last 4</th>
                <th>Status</th>
                <th>Date</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.paymentId}>
                    <td>{log.paymentId}</td>
                    <td>{log.orderId || "N/A"}</td>
                    <td>${(log.amount || 0).toFixed(2)}</td>
                    <td>{log.method}</td>
                    <td>{log.cardLast4}</td>
                    <td>{log.status}</td>
                    <td>{new Date(log.date).toLocaleString()}</td>
                    <td>
                      {log.items.map((item, index) => (
                        <div key={index} className="financial-item-detail">
                          {item.name}: {item.quantity} x ${item.price.toFixed(2)}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="financial-no-data">
                    No payment logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;