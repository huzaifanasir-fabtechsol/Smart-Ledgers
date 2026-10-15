import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { translations } from "../translations";
import { apiRequest } from "../api";
import DeleteConfirmModal from "./DeleteConfirmModal";
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import Pagination from "./Pagination";
import "../shared.css";
import "./OrderManager.css";
const OrderManager = ({ language = "en", onAddOrder, onEditOrder }) => {
  const t = translations[language];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedViewOrder, setSelectedViewOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState({
    payment_status: "",
    transaction_type: "",
    transaction_catagory: "",
    start_date: "",
    end_date: "",
    search: ""
  });
  useEffect(() => {
    fetchOrders();
  }, [currentPage, pageSize, filters]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest(".btn-menu")) {
        setOpenMenuId(null);
      }
    };
    const handleCloseMenu = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleCloseMenu, true);
    window.addEventListener("resize", handleCloseMenu);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleCloseMenu, true);
      window.removeEventListener("resize", handleCloseMenu);
    };
  }, []);
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      });
      const response = await apiRequest(`/revenue/orders/?${params}`);
      const data = await response.json();
      setOrders(data.results || data);
      if (data.count) {
        setTotalPages(Math.ceil(data.count / pageSize));
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  const getContactInfo = (order) => {
    if (order.transaction_type === "purchase" && order.other_details) {
      return {
        name: order.other_details.saler_name || order.other_details.seller_name || "",
        phone: order.other_details.phone || ""
      };
    } else if (order.transaction_type === "sale" && order.other_details) {
      return {
        name: order.other_details.customer_name || "",
        phone: order.other_details.phone || ""
      };
    } else if (order.transaction_type === "auction" && order.other_details) {
      return {
        name: order.other_details.auction_house || "",
        phone: order.other_details.phone || ""
      };
    }
    return { name: order.customer_name || "", phone: "" };
  };
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const handleClearFilters = () => {
    setFilters({
      payment_status: "",
      transaction_type: "",
      transaction_catagory: "",
      start_date: "",
      end_date: "",
      search: ""
    });
    setCurrentPage(1);
  };
  const handleDelete = async () => {
    try {
      await apiRequest(`/revenue/orders/${showDeleteConfirm.id}/`, { method: "DELETE" });
      toast.success("Order deleted successfully");
      setShowDeleteConfirm(null);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to delete order");
    }
  };
  const handleEdit = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setOpenMenuId(null);
      onEditOrder(order);
    }
  };
  const handleViewDetails = (order) => {
    setOpenMenuId(null);
    setSelectedViewOrder(order);
    setShowViewModal(true);
  };
  const handleGenerateInvoice = async (orderId) => {
    try {
      const response = await apiRequest(`/revenue/orders/${orderId}/generate_invoice/`, {
        method: "GET"
      });
      if (!response.ok) {
        throw new Error("Invoice generation failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderId}.pdf`;
      a.click();
      toast.success("Invoice generated successfully");
      setOpenMenuId(null);
    } catch (error) {
      toast.error("Failed to generate invoice");
    }
  };
  const handleToggleHighlight = async (order) => {
    const next = !order.is_highlighted;
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, is_highlighted: next } : o));
    try {
      const response = await apiRequest(`/revenue/orders/${order.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_highlighted: next })
      });
      if (!response.ok) throw new Error("failed");
    } catch (error) {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, is_highlighted: !next } : o));
      toast.error("Failed to update highlight");
    }
  };
  const handleEditStatus = (order) => {
    setEditingOrder(order);
    setPaymentStatus(order.payment_status || "pending");
    setShowModal(true);
    setOpenMenuId(null);
  };
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest(`/revenue/orders/${editingOrder.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status: paymentStatus })
      });
      toast.success("Payment status updated successfully");
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      toast.error("Failed to update payment status");
    } finally {
      setLoading(false);
    }
  };
  const handleMenuClick = (e, orderId) => {
    e.stopPropagation();
    if (openMenuId === orderId) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 180;
    let left = rect.right - menuWidth;
    if (left < 10) left = rect.left;
    let top = rect.bottom + 6;
    setMenuPos({ top, left });
    setOpenMenuId(orderId);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "order-manager" }, /* @__PURE__ */ React.createElement(ToastContainer, { position: "top-right", autoClose: 3e3 }), /* @__PURE__ */ React.createElement("div", { className: "page-header" }, /* @__PURE__ */ React.createElement("h2", null, t.orders), /* @__PURE__ */ React.createElement("button", { className: "btn-primary", onClick: onAddOrder }, t.addOrder)), /* @__PURE__ */ React.createElement("div", { className: "table-section" }, /* @__PURE__ */ React.createElement("div", { className: "filters" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search by transaction , customer, notes...",
      value: filters.search,
      onChange: (e) => handleFilterChange("search", e.target.value),
      className: "filter-input"
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filters.payment_status,
      onChange: (e) => handleFilterChange("payment_status", e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "All Payments"),
    /* @__PURE__ */ React.createElement("option", { value: "pending" }, "Pending"),
    /* @__PURE__ */ React.createElement("option", { value: "completed" }, "Completed"),
    /* @__PURE__ */ React.createElement("option", { value: "failed" }, "Failed")
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filters.transaction_type,
      onChange: (e) => handleFilterChange("transaction_type", e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "All Types"),
    /* @__PURE__ */ React.createElement("option", { value: "sale" }, "Sale"),
    /* @__PURE__ */ React.createElement("option", { value: "purchase" }, "Purchase"),
    /* @__PURE__ */ React.createElement("option", { value: "nagare" }, t.nagare || "Nagare"),
    /* @__PURE__ */ React.createElement("option", { value: "auction" }, "Auction")
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: filters.transaction_catagory,
      onChange: (e) => handleFilterChange("transaction_catagory", e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "All Categories"),
    /* @__PURE__ */ React.createElement("option", { value: "local" }, "Local"),
    /* @__PURE__ */ React.createElement("option", { value: "foreign" }, "Foreign")
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      className: "filter-input",
      value: filters.start_date,
      onChange: (e) => handleFilterChange("start_date", e.target.value),
      placeholder: "Start Date"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      className: "filter-input",
      value: filters.end_date,
      onChange: (e) => handleFilterChange("end_date", e.target.value),
      placeholder: "End Date"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "table-container" }, /* @__PURE__ */ React.createElement("table", null, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Sr"), /* @__PURE__ */ React.createElement("th", null, t.date), /* @__PURE__ */ React.createElement("th", null, t.type), /* @__PURE__ */ React.createElement("th", null, "Name"), /* @__PURE__ */ React.createElement("th", null, "Auction"), /* @__PURE__ */ React.createElement("th", null, t.items), /* @__PURE__ */ React.createElement("th", null, t.paymentStatus), /* @__PURE__ */ React.createElement("th", null, t.totalAmount), /* @__PURE__ */ React.createElement("th", { style: { width: "60px" } }, t.actions))), /* @__PURE__ */ React.createElement("tbody", null, loading ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9" }, /* @__PURE__ */ React.createElement("div", { className: "table-loader-container" }, /* @__PURE__ */ React.createElement("div", { className: "spinner" }), /* @__PURE__ */ React.createElement("span", null, "Loading orders...")))) : orders.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9", style: { textAlign: "center" } }, "No orders found")) : orders.map((order, index) => {
    const contact = getContactInfo(order);
    return /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: order.id,
        onClick: () => handleViewDetails(order),
        style: { cursor: "pointer", ...order.is_highlighted ? { background: "#fef9c3" } : {} },
        className: "table-row-hover"
      },
      /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            handleToggleHighlight(order);
          },
          title: order.is_highlighted ? "Remove highlight" : "Highlight",
          style: { background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0, marginRight: "0.3rem", color: order.is_highlighted ? "#eab308" : "var(--muted-foreground)" }
        },
        order.is_highlighted ? "\u2605" : "\u2606"
      ), (currentPage - 1) * pageSize + index + 1),
      /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--primary)", textDecoration: "underline" } }, order.transaction_date)),
      /* @__PURE__ */ React.createElement("td", null, order.transaction_type?.[0].toUpperCase() + order.transaction_type?.slice(1)),
      /* @__PURE__ */ React.createElement("td", null, contact.name),
      /* @__PURE__ */ React.createElement("td", null, order.auction_name),
      /* @__PURE__ */ React.createElement("td", null, order.items?.length || 0),
      /* @__PURE__ */ React.createElement("td", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("span", { className: `status-badge status-${order.payment_status}`, onClick: () => handleEditStatus(order), style: { cursor: "pointer" } }, t[order.payment_status])),
      /* @__PURE__ */ React.createElement("td", { style: { fontWeight: 700 } }, "\xA5", Number(order.total_amount || 0).toLocaleString()),
      /* @__PURE__ */ React.createElement("td", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("button", { className: `btn-menu ${openMenuId === order.id ? "active" : ""}`, onClick: (e) => handleMenuClick(e, order.id) }, "\u22EE"))
    );
  })))), /* @__PURE__ */ React.createElement(
    Pagination,
    {
      currentPage,
      totalPages,
      onPageChange: setCurrentPage,
      pageSize,
      onPageSizeChange: (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
      },
      previousLabel: t.previous,
      nextLabel: t.next,
      pageLabel: t.page,
      ofLabel: t.of
    }
  )), openMenuId && /* @__PURE__ */ React.createElement("div", { ref: menuRef, className: "context-menu", style: { top: menuPos.top, left: menuPos.left } }, (() => {
    const order = orders.find((o) => o.id === openMenuId);
    return order ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => handleViewDetails(order) }, "\u{1F441}\uFE0F View Details"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleEdit(openMenuId) }, "\u270F\uFE0F Edit"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleGenerateInvoice(openMenuId) }, "\u{1F4C4} Download PDF"), /* @__PURE__ */ React.createElement("button", { className: "danger", onClick: () => {
      setShowDeleteConfirm(order);
      setOpenMenuId(null);
    } }, "\u{1F5D1}\uFE0F Delete")) : null;
  })()), /* @__PURE__ */ React.createElement(
    DeleteConfirmModal,
    {
      isOpen: !!showDeleteConfirm,
      onClose: () => setShowDeleteConfirm(null),
      onConfirm: handleDelete,
      title: "Delete Order",
      message: `Are you sure you want to delete this order? This action cannot be undone.`
    }
  ), showModal && /* @__PURE__ */ React.createElement("div", { className: "modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "modal" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" } }, /* @__PURE__ */ React.createElement("h3", { style: { margin: 0 } }, "Update Payment Status"), /* @__PURE__ */ React.createElement("button", { className: "modal-close", type: "button", onClick: () => setShowModal(false) }, "\xD7")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleUpdateStatus }, /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, t.paymentStatus), /* @__PURE__ */ React.createElement("select", { value: paymentStatus, onChange: (e) => setPaymentStatus(e.target.value), required: true }, /* @__PURE__ */ React.createElement("option", { value: "pending" }, t.pending), /* @__PURE__ */ React.createElement("option", { value: "completed" }, t.completed), /* @__PURE__ */ React.createElement("option", { value: "failed" }, t.failed))), /* @__PURE__ */ React.createElement("div", { className: "modal-actions" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn-secondary", onClick: () => setShowModal(false), disabled: loading }, t.cancel), /* @__PURE__ */ React.createElement("button", { type: "submit", className: "btn-primary", disabled: loading }, loading ? "Updating..." : "Update"))))), /* @__PURE__ */ React.createElement(
    InvoiceDetailsModal,
    {
      isOpen: showViewModal,
      onClose: () => {
        setShowViewModal(false);
        setSelectedViewOrder(null);
      },
      orderId: selectedViewOrder?.id,
      initialOrder: selectedViewOrder,
      onEdit: (order) => {
        onEditOrder(order);
      }
    }
  ));
};
export default OrderManager;
