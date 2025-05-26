import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import Sidebar from "../../components/Sidebar";
import api from "../../utils/axiosInstance";
import { printInvoices } from "../../utils/printInvoices";
import { Printer } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [showOkOnly, setShowOkOnly] = useState(false);
  const navigate = useNavigate();
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized: Please log in first.");
          setLoading(false);
          return;
        }
        const response = await api.get("api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } else {
          setError("Unexpected response format");
        }
      } catch (err) {
        setError("Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-500 text-white";
      case "Arrears":
        return "bg-red-500 text-white";
      case "Partially Paid":
        return "bg-yellow-500 text-black";
      case "Unpaid":
        return "bg-gray-500 text-white";
      case "Newly Arrived":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-300 text-black";
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab !== "all") {
      if (activeTab === "paid" && invoice.status !== "Paid") return false;
      if (activeTab === "arrears" && invoice.status !== "Arrest") return false;
      if (activeTab === "partly-paid" && invoice.status !== "Partially Paid")
        return false;
      if (activeTab === "newly-arrived" && invoice.printedtime !== 0)
        return false;
      if (activeTab === "unpaid" && invoice.status !== "Unpaid") return false;
    }
    return (
      invoice.shop_id.toString().includes(searchQuery) ||
      invoice.invoice_id.toString().includes(searchQuery) ||
      invoice.month_year.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices((prevSelected) =>
      prevSelected.includes(invoiceId)
        ? prevSelected.filter((id) => id !== invoiceId)
        : [...prevSelected, invoiceId]
    );
  };

  const onPrintClick = () => {
    if (selectedInvoices.length === 0) return;
    setConfirmMessage("Are you sure you want to print?");
    setShowOkOnly(false);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: Please log in first.");
      return;
    }

    const invoicesToPrint = filteredInvoices.filter((invoice) =>
      selectedInvoices.includes(invoice.invoice_id)
    );

    printInvoices(invoicesToPrint, token);
    setShowConfirm(false);
  };

  // Function to handle sending emails for selected invoices
  const handleSendSingleEmail = async (invoice) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized: Please log in first.");
        return;
      }

      const response = await api.post(
        "/api/send-email",
        { invoices: [invoice] }, // Send as an array of one
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess(
          `Invoice ${invoice.invoice_id} sent successfully via email!`
        );
      } else {
        setError(`Failed to send invoice ${invoice.invoice_id}.`);
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred while sending the email.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar className="w-64 flex-shrink-0" />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-4">Invoice Management</h1>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <input
          type="text"
          placeholder="Search by Shop ID, Invoice ID, or Month-Year"
          className="p-2 border rounded mb-4 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="flex space-x-4 mt-6 border-b pb-2">
          {[
            { key: "all", label: "All Invoices" },
            { key: "paid", label: "Paid Invoices" },
            { key: "arrears", label: "Arrears Invoices" },
            { key: "partly-paid", label: "Partly Paid" },
            { key: "newly-arrived", label: "Newly Arrived" },
            { key: "unpaid", label: "Unpaid Invoices" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg cursor-pointer ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ConfirmWrapper
          show={showConfirm}
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          confirmText="Yes"
          cancelText={showOkOnly ? "Ok" : "No"}
          icon="🖨️"
        >
          <button
            onClick={onPrintClick}
            disabled={selectedInvoices.length === 0}
            className={`mt-4 px-6 py-2 rounded-lg text-white flex items-center ${
              selectedInvoices.length === 0
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-700"
            }`}
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Selected Invoices
          </button>
        </ConfirmWrapper>

        <div className="overflow-x-auto bg-white p-4 shadow-md rounded-lg mt-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedInvoices.length === filteredInvoices.length &&
                      filteredInvoices.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(
                          filteredInvoices.map((invoice) => invoice.invoice_id)
                        );
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                  />
                </th>
                <th className="border p-2">Invoice ID</th>
                <th className="border p-2">Shop ID</th>
                <th className="border p-2">Month</th>
                <th className="border p-2">Rent Amount</th>
                <th className="border p-2">Operation Fee</th>
                <th className="border p-2">VAT</th>
                <th className="border p-2">Previous Balance</th>
                <th className="border p-2">Total Fines</th>
                <th className="border p-2">Fines Prev Month</th>
                <th className="border p-2">Total Arrears</th>
                <th className="border p-2">Total Amount</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Total Paid</th>
                <th className="border p-2">Prev Total Paid</th>
                <th className="border p-2">Prev Payment Date</th>
                <th className="border p-2">Created At</th>
                <th className="border p-2">Shop Name</th>
                <th className="border p-2">Tenant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="19" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border">
                    <td className="border p-2">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.invoice_id)}
                        onChange={() =>
                          toggleInvoiceSelection(invoice.invoice_id)
                        }
                      />
                    </td>
                    <td className="border p-2">{invoice.invoice_id}</td>
                    <td
                      className="px-6 py-4 text-sm text-blue-600 cursor-pointer underline"
                      onClick={() =>
                        navigate(`/shop-summary/${invoice.shop_id}`)
                      }
                    >
                      {invoice.shop_id}
                    </td>
                    <td className="border p-2">
                      {new Date(invoice.month_year).toLocaleDateString()}
                    </td>
                    <td className="border p-2">LKR {invoice.rent_amount}</td>
                    <td className="border p-2">LKR {invoice.operation_fee}</td>
                    <td className="border p-2">LKR {invoice.vat_amount}</td>
                    <td className="border p-2">
                      LKR {invoice.previous_balance}
                    </td>
                    <td className="border p-2">LKR {invoice.fines}</td>
                    <td className="border p-2">LKR {invoice.previous_fines}</td>
                    <td className="border p-2">LKR {invoice.total_arrears}</td>
                    <td className="border p-2">LKR {invoice.total_amount}</td>
                    <td
                      className={`border p-2 text-center font-bold ${getStatusClass(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </td>
                    <td className="border p-2">
                      LKR {invoice.total_paid?.toFixed(2) || "0.00"}
                    </td>
                    <td className="border p-2">
                      LKR{" "}
                      {invoice.previous_payment_summary?.total_paid?.toFixed(
                        2
                      ) || "0.00"}
                    </td>
                    <td className="border p-2">
                      {invoice.previous_payment_summary?.last_payment_date
                        ? new Date(
                            invoice.previous_payment_summary.last_payment_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="border p-2">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="border p-2">
                      {invoice.Shop?.shop_name || "N/A"}
                    </td>
                    <td className="border p-2">
                      {invoice.Shop?.Tenant?.name || "N/A"}
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => handleSendSingleEmail(invoice)}
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        📧 Send Email
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
