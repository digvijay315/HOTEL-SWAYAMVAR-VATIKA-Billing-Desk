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

  const handleViewImage = (url, title = 'Customer Document') => {
    if (!url) {
      showAlert("Info", `No ${title.toLowerCase()} uploaded for this booking.`, "info");
      return;
    }
    Swal.fire({
      ...getSwalConfig(),
      title: title,
      imageUrl: url,
      imageAlt: title,
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
                              handleViewImage(booking.guests[0].documentImage, 'Customer Document');
                            } else {
                              handleViewImage(null, 'Customer Document');
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

      {/* Premium Guest Details Modal */}
      {showGuestModal && selectedGuestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-gold-800/40 p-0 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 border-b border-slate-200 dark:border-gold-800/30 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 dark:from-amber-500 dark:via-yellow-300 dark:to-amber-500"></div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-amber-600 dark:text-amber-500 flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                    Booking Details
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">
                    Room <span className="text-slate-900 dark:text-white font-bold">{selectedGuestBooking.room?.roomNumber}</span> ({selectedGuestBooking.room?.type})
                  </p>
                </div>
                <button 
                  onClick={() => setShowGuestModal(false)} 
                  className="bg-slate-100 hover:bg-red-100 dark:bg-slate-800/50 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-2 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Check-in / Out Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm dark:shadow-inner">
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Check-In</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400 font-mono text-sm">{new Date(selectedGuestBooking.checkInTime).toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm dark:shadow-inner">
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Check-Out</p>
                  <p className="font-medium text-amber-600 dark:text-amber-500 font-mono text-sm">
                    {selectedGuestBooking.checkOutTime 
                      ? new Date(selectedGuestBooking.checkOutTime).toLocaleString("en-IN")
                      : "Not Checked-Out Yet"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm dark:shadow-inner flex flex-col justify-center">
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Status</p>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedGuestBooking.status === 'Checked-In' 
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' 
                        : 'bg-slate-200 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30'
                    }`}>
                      {selectedGuestBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Guest Information</h4>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedGuestBooking.guests && selectedGuestBooking.guests.map((g, idx) => (
                  <div key={idx} className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-800/40 dark:to-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-gold-800/20 relative group hover:border-amber-500/50 dark:hover:border-gold-800/50 transition-colors shadow-md dark:shadow-lg">
                    <div className="absolute top-0 right-0 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 px-3 py-1 rounded-bl-2xl rounded-tr-2xl text-xs font-bold border-b border-l border-amber-200 dark:border-gold-800/20">
                      Guest {idx + 1}
                    </div>
                    
                    <div className="mb-4 pr-16">
                      <p className="font-black text-slate-900 dark:text-white text-lg tracking-wide">{g.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Age: <span className="text-amber-600 dark:text-amber-400">{g.age}</span></p>
                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Ph: <span className="text-amber-600 dark:text-amber-400">{g.phone}</span></p>
                      </div>
                      <p className="text-slate-500 dark:text-slate-500 text-xs mt-2 uppercase tracking-wider font-bold">
                        {g.idType}: <span className="text-slate-800 dark:text-slate-300">{g.idNumber}</span>
                      </p>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                      {g.personPhoto && (
                        <button 
                          onClick={() => handleViewImage(g.personPhoto, 'Live Photo')}
                          className="flex-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-500 py-2 rounded-xl text-xs font-bold transition-all border border-amber-200 hover:border-amber-400 dark:border-amber-500/20 dark:hover:border-amber-500/50 flex items-center justify-center gap-1.5 shadow-sm dark:shadow-inner"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Live Photo
                        </button>
                      )}
                      {g.documentImage && (
                        <button 
                          onClick={() => handleViewImage(g.documentImage, 'ID Document')}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 py-2 rounded-xl text-xs font-bold transition-all border border-blue-200 hover:border-blue-400 dark:border-blue-500/20 dark:hover:border-blue-500/50 flex items-center justify-center gap-1.5 shadow-sm dark:shadow-inner"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View ID
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
