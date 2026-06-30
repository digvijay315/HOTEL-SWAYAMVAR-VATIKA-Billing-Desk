import React, { useState, useEffect } from "react";
import { BookOpen, FileText, Image as ImageIcon, Search, Download } from "lucide-react";
import api, { roomBookingAPI } from "../api";
import Swal from "sweetalert2";
import { showError, showAlert, getSwalConfig } from "../utils/alerts";
import PremiumRoomInvoice from "../components/PremiumRoomInvoice";

export default function AdminRoomReports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For debouncing / search button
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  
  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Guest Details Modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [selectedGuestBooking, setSelectedGuestBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [page, filterType, searchTerm]); // custom dates are handled via a "Apply" button or just when they change? We will use a fetch button for custom dates to be safe, or just trigger on change if both are set.

  // Fetch when custom dates are both set (if custom filter)
  useEffect(() => {
    if (filterType === 'custom' && customStartDate && customEndDate) {
      fetchBookings();
    }
  }, [customStartDate, customEndDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/room-bookings", {
        params: {
          page,
          limit: 10,
          filter: filterType === 'all' ? undefined : filterType,
          startDate: filterType === 'custom' ? customStartDate : undefined,
          endDate: filterType === 'custom' ? customEndDate : undefined,
          search: searchTerm || undefined
        }
      });
      setBookings(res.data.data);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.pages);
      }
    } catch (error) {
      console.error(error);
      showError("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (booking) => {
    if (booking.status === "Checked-Out") {
      setSelectedBooking(booking);
      setShowInvoice(true);
    } else {
      showAlert("Info", "Invoice is only available after Check-Out.", "info");
    }
  };

  const handleViewDocument = (url) => {
    if (!url) {
      showAlert("Info", "No document uploaded for this booking.", "info");
      return;
    }
    Swal.fire({
      ...getSwalConfig(),
      title: 'Customer Document',
      imageUrl: url,
      imageAlt: 'Document',
      width: 600,
      padding: '1em'
    });
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTerm(searchInput);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await roomBookingAPI.exportBookings({
        filter: filterType === 'all' ? undefined : filterType,
        startDate: filterType === 'custom' ? customStartDate : undefined,
        endDate: filterType === 'custom' ? customEndDate : undefined,
        search: searchTerm || undefined
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Room_Bookings_${new Date().toISOString().slice(0,10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      showError("Export Failed", "Could not export data to Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (booking, e) => {
    // Prevent modal if clicking on buttons
    if (e.target.closest('button')) return;
    
    setSelectedGuestBooking(booking);
    setShowGuestModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
            <BookOpen className="w-7 h-7" />
            Room Bookings
          </h2>
          <p className="text-slate-400 text-sm mt-1">View booking history and invoices</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Filters */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Date</option>
          </select>

          {filterType === 'custom' && (
            <div className="flex gap-2">
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm" />
              <span className="text-slate-500 self-center">to</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-white text-sm" />
            </div>
          )}

          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search by Guest Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-l-xl pl-4 pr-4 py-2 text-white focus:outline-none focus:border-amber-500"
            />
            <button onClick={handleSearch} className="bg-amber-500 text-slate-900 p-2.5 rounded-r-xl border border-amber-500 hover:bg-amber-400">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-gold-800/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-gold-800/20">
              <tr>
                <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Guest</th>
                <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Room</th>
                <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Check In / Out</th>
                <th className="px-6 py-4 text-slate-300 font-semibold text-sm">Status</th>
                <th className="px-6 py-4 text-slate-300 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-800/10">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">Loading bookings...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr 
                    key={booking._id} 
                    onClick={(e) => handleRowClick(booking, e)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {booking.guests && booking.guests.length > 0 ? (
                        <>
                          <p className="font-semibold text-slate-200">{booking.guests[0].name} <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-500">+{booking.guests.length - 1} more</span></p>
                          <p className="text-xs text-slate-400">{booking.guests[0].phone}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{booking.guests[0].idType}: {booking.guests[0].idNumber}</p>
                        </>
                      ) : (
                        <p className="font-semibold text-slate-200">N/A</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-200">{booking.room?.roomNumber}</p>
                      <p className="text-xs text-slate-400">{booking.room?.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-emerald-400">In: {new Date(booking.checkInTime).toLocaleString("en-IN")}</p>
                      {booking.checkOutTime && (
                        <p className="text-amber-500 mt-1">Out: {new Date(booking.checkOutTime).toLocaleString("en-IN")}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'Checked-In' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.status === 'Checked-Out' && (
                        <p className="text-xs font-bold text-amber-500 mt-1 ml-1">₹{booking.totalAmount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (booking.guests && booking.guests[0]?.documentImage) {
                              handleViewDocument(booking.guests[0].documentImage);
                            } else {
                              handleViewDocument(null);
                            }
                          }}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/25"
                          title="View Document"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(booking)}
                          className={`p-1.5 rounded-lg transition-all border border-transparent ${
                            booking.status === 'Checked-Out' 
                              ? 'text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/25'
                              : 'text-slate-600 cursor-not-allowed'
                          }`}
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Guest Details Modal */}
      {showGuestModal && selectedGuestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-amber-500">
                Booking Details - Room {selectedGuestBooking.room?.roomNumber}
              </h3>
              <button onClick={() => setShowGuestModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl">
              <div>
                <p className="text-sm text-slate-400">Check-In</p>
                <p className="font-semibold text-white">{new Date(selectedGuestBooking.checkInTime).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className={`font-semibold ${selectedGuestBooking.status === 'Checked-In' ? 'text-blue-400' : 'text-slate-400'}`}>{selectedGuestBooking.status}</p>
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-800 pb-2">Guest Information</h4>
            <div className="space-y-4">
              {selectedGuestBooking.guests && selectedGuestBooking.guests.map((g, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-amber-500 text-lg">{g.name} <span className="text-sm text-slate-400 font-normal">(Age: {g.age})</span></p>
                    <p className="text-slate-300">📞 {g.phone}</p>
                    <p className="text-slate-400 text-sm mt-1">{g.idType}: {g.idNumber}</p>
                  </div>
                  {g.documentImage && (
                    <button 
                      onClick={() => handleViewDocument(g.documentImage)}
                      className="px-3 py-1.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg text-sm font-semibold transition-all border border-transparent hover:border-blue-500/25 flex items-center gap-1"
                    >
                      View ID
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInvoice && selectedBooking && (
        <PremiumRoomInvoice 
          booking={selectedBooking} 
          onClose={() => {
            setShowInvoice(false);
            setSelectedBooking(null);
          }} 
        />
      )}
    </div>
  );
}
