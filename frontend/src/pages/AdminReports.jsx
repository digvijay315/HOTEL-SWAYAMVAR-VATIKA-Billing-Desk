import React, { useState, useEffect } from "react";
import api from "../api";
import PremiumInvoice from "../components/PremiumInvoice";
import { 
  Eye, Printer, Search, ChevronLeft, ChevronRight, Filter, AlertCircle, FileText
} from "lucide-react";

export default function AdminReports() {
  // Invoices list state
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [limit] = useState(10);

  // Filters & search
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState(""); // empty means All Time, or "today", "month", "year", "specific"
  const [specificDate, setSpecificDate] = useState("");

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [page, filterType, specificDate, search]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
      };

      if (filterType) {
        params.filter = filterType;
        if (filterType === "specific" && specificDate) {
          params.date = specificDate;
        }
      }

      const res = await api.get("api/invoices", { params });
      if (res.data.success) {
        setInvoices(res.data.data);
        setTotalPages(res.data.pages);
        setTotalInvoices(res.data.total);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(1); // Reset to page 1 on filter change
    if (type !== "specific") {
      setSpecificDate("");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="flex-1 p-6 space-y-8 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white font-serif flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-amber-500" />
            Billing Report
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Search, filter and generate bills with server side pagination
          </p>
        </div>
      </div>

      {/* TABLE DATA LISTING WITH FILTERS */}
      <div className="glass-card rounded-2xl overflow-hidden no-print">
        
        {/* Table Filter Controls Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/20 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
          
          {/* Left: Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 mr-2 text-xs font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            
            <button
              onClick={() => handleFilterChange("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "" 
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/35"
                  : "bg-slate-900 text-slate-450 hover:bg-slate-850 border border-slate-800"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleFilterChange("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "today" 
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/35"
                  : "bg-slate-900 text-slate-450 hover:bg-slate-850 border border-slate-800"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleFilterChange("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "month" 
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/35"
                  : "bg-slate-900 text-slate-450 hover:bg-slate-850 border border-slate-800"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleFilterChange("year")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === "year" 
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/35"
                  : "bg-slate-900 text-slate-450 hover:bg-slate-850 border border-slate-800"
              }`}
            >
              This Year
            </button>

            {/* Datepicker */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFilterChange("specific")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === "specific" 
                    ? "bg-amber-600/20 text-amber-400 border border-amber-500/35"
                    : "bg-slate-900 text-slate-450 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                Date-wise
              </button>
              {filterType === "specific" && (
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-amber-500/50"
                />
              )}
            </div>
          </div>

          {/* Right: Search */}
          <div className="relative max-w-sm w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Name / Mobile / INV..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60"
            />
          </div>

        </div>

        {/* Invoice Grid/Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-amber-500 font-bold">
              Loading invoices...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Invoice #</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Billed By (Staff)</th>
                  <th className="py-4 px-6 text-right">Grand Total</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/30 text-slate-350 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-slate-200">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-6">
                        {new Date(inv.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-200">{inv.customerName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.customerMobile}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-300">
                        {inv.createdBy?.name || "System"}
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-amber-500 text-sm">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-750 rounded-lg transition-all flex items-center justify-center"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setTimeout(() => {
                                window.print();
                              }, 300);
                            }}
                            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-amber-500 border border-slate-800 hover:border-slate-750 rounded-lg transition-all flex items-center justify-center"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-550">
                      <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-slate-650" />
                        <span className="font-semibold">No invoices found</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">Try adjusting your search query or dates</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              Showing page <strong className="text-slate-300">{page}</strong> of <strong className="text-slate-300">{totalPages}</strong> ({totalInvoices} total bills)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* PREMIUM INVOICE MODAL */}
      {selectedInvoice && (
        <PremiumInvoice
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

    </div>
  );
}
