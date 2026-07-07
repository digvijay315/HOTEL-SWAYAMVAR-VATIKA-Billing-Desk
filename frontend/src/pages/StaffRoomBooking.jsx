import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { BedDouble, CheckCircle, UploadCloud, FileText, Camera } from "lucide-react";
import api from "../api";
import { showError, showSuccess, showAlert } from "../utils/alerts";
import PremiumRoomInvoice from "../components/PremiumRoomInvoice";

export default function StaffRoomBooking() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  
  const [numGuests, setNumGuests] = useState(1);
  const [guests, setGuests] = useState([
    { name: "", age: "", phone: "", idType: "Aadhar", idNumber: "", documentFile: null, personPhoto: null }
  ]);
  const [activeWebcam, setActiveWebcam] = useState(null);
  const webcamRef = useRef(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [uploadingDoc, setUploadingDoc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasGST, setHasGST] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [verifyingGST, setVerifyingGST] = useState(false);

  const [activeBooking, setActiveBooking] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [manualTotalAmount, setManualTotalAmount] = useState(0);
  const [splitBill, setSplitBill] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/rooms");
      setRooms(res.data.data);
    } catch (error) {
      console.error(error);
      showError("Error", "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room) => {
    setSelectedRoom(room);
    if (room.status === 'Available') {
      setNumGuests(1);
      setGuests([{ name: "", age: "", phone: "", idType: "Aadhar", idNumber: "", documentImage: null, personPhoto: null }]);
      setAdvanceAmount(0);
      setHasGST(false);
      setGstNumber("");
      setCompanyName("");
      setCompanyAddress("");
      setShowCheckInModal(true);
    } else {
      // Find active booking for this room
      try {
        const res = await api.get("/api/room-bookings");
        const bookings = res.data.data;
        const active = bookings.find(b => b.room._id === room._id && b.status === 'Checked-In');
        if (active) {
          setActiveBooking(active);
          
          // Calculate default total
          const checkInDate = new Date(active.checkInTime);
          const checkOutDate = new Date();
          const diffTime = Math.abs(checkOutDate - checkInDate);
          // Removed grace period to strictly charge next day after 24 hours
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 0) diffDays = 1;
          
          let roomTotal = diffDays * room.price;
          let restaurantTotal = 0;
          if (active.restaurantBills && active.restaurantBills.length > 0) {
            restaurantTotal = active.restaurantBills.reduce((s, bill) => s + bill.grandTotal, 0);
          }
          
          setManualTotalAmount(roomTotal + restaurantTotal);
          setSplitBill(false);

          setShowCheckOutModal(true);
        } else {
          showError("Error", "No active booking found for this room");
        }
      } catch (error) {
        showError("Error", "Failed to fetch booking details");
      }
    }
  };

  const handleFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(`doc-${index}`);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await api.post("/api/upload/upload-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        // Handle both data.urls and data.data based on API response
        const url = (res.data.urls && res.data.urls[0]) || (res.data.data && res.data.data[0]);
        if (url) {
          updateGuestField(index, "documentImage", url);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      showError("Upload Failed", "Image upload failed. Please try again.");
    } finally {
      setUploadingDoc("");
    }
  };

  const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const captureWebcamPhoto = async (index) => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    setUploadingDoc(`photo-${index}`);
    setActiveWebcam(null);
    
    const file = dataURLtoFile(imageSrc, `guest-${index}-${Date.now()}-photo.jpg`);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await api.post("/api/upload/upload-files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        const url = (res.data.urls && res.data.urls[0]) || (res.data.data && res.data.data[0]);
        if (url) {
          updateGuestField(index, "personPhoto", url);
        }
      }
    } catch (error) {
      console.error("Photo upload failed:", error);
      showError("Upload Failed", "Photo upload failed. Please try again.");
    } finally {
      setUploadingDoc("");
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/api/room-bookings/checkin", {
        roomId: selectedRoom._id,
        guests: guests,
        advanceAmount: Number(advanceAmount) || 0,
        hasGST,
        gstNumber: hasGST ? gstNumber : "",
        companyName: hasGST ? companyName : "",
        companyAddress: hasGST ? companyAddress : ""
      });

      showSuccess("Success", "Check-in successful");
      setShowCheckInModal(false);
      fetchRooms();
    } catch (error) {
      showError("Error", error.response?.data?.message || "Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNumGuestsChange = (e) => {
    const val = parseInt(e.target.value) || 1;
    setNumGuests(val);
    const newGuests = [...guests];
    if (val > newGuests.length) {
      for (let i = newGuests.length; i < val; i++) {
        newGuests.push({ name: "", age: "", phone: "", idType: "Aadhar", idNumber: "", documentImage: null, personPhoto: null });
      }
    } else {
      newGuests.length = val;
    }
    setGuests(newGuests);
  };
  
  const handleVerifyGST = async () => {
    if (!gstNumber || gstNumber.length !== 15) {
      showError("Invalid GST", "Please enter a valid 15-digit GST Number");
      return;
    }
    
    setVerifyingGST(true);
    try {
      const res = await api.get(`/api/room-bookings/verify-gst/${gstNumber}`);
      if (res.data.success) {
        setCompanyName(res.data.data.businessName || "");
        setCompanyAddress(res.data.data.address || "");
        showSuccess("Verified", "GST Details fetched successfully!");
      } else {
        showError("Failed", res.data.message || "Failed to verify GST");
      }
    } catch (error) {
      showError("Verification Failed", "Could not verify GST. Please check the number or try again.");
      console.error(error);
    } finally {
      setVerifyingGST(false);
    }
  };

  const handlePhoneBlur = async (index, phone) => {
    if (!phone || phone.length < 10) return;
    
    try {
      const res = await api.get(`/api/room-bookings/guest/${phone}`);
      if (res.data.success && res.data.data) {
        const pastGuest = res.data.data;
        const updated = [...guests];
        updated[index] = {
          ...updated[index],
          name: updated[index].name || pastGuest.name || "",
          age: updated[index].age || pastGuest.age || "",
          idType: pastGuest.idType || "Aadhar",
          idNumber: updated[index].idNumber || pastGuest.idNumber || "",
          documentImage: updated[index].documentImage || pastGuest.documentImage || null,
          personPhoto: updated[index].personPhoto || pastGuest.personPhoto || null
        };
        setGuests(updated);
        showSuccess("Guest Found", "Previous guest details loaded automatically!");
      }
    } catch (error) {
      // Simply ignore if guest not found
    }
  };

  const updateGuestField = (index, field, value) => {
    const updated = [...guests];
    updated[index][field] = value;
    setGuests(updated);
  };

  const handleCheckOut = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/api/room-bookings/checkout/${activeBooking._id}`, { manualTotalAmount });
      setActiveBooking(res.data.data); // Update with final total amount
      setShowCheckOutModal(false);
      setShowInvoice(true);
      fetchRooms();
    } catch (error) {
      showError("Error", error.response?.data?.message || "Check-out failed");
    } finally {
      setSubmitting(false);
    }
  };

  const groupedRooms = rooms.reduce((acc, room) => {
    if (!acc[room.type]) acc[room.type] = [];
    acc[room.type].push(room);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 no-print">
        <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
          <BedDouble className="w-7 h-7" />
          Room Booking System
        </h2>
        <p className="text-slate-400 text-sm mt-1">Select a room to Check-In or Check-Out.</p>
      </div>

      {loading ? (
        <div className="text-amber-500 text-center py-10 no-print">Loading rooms...</div>
      ) : (
        <div className="space-y-8 no-print">
          {['AC', 'Non-AC', 'Hall', 'Mini Hall'].map((type) => (
            groupedRooms[type] && groupedRooms[type].length > 0 && (
              <div key={type}>
                <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2">{type} Rooms</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {groupedRooms[type].map((room) => (
                    <button
                      key={room._id}
                      onClick={() => handleRoomClick(room)}
                      className={`relative p-4 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 ${
                        room.status === 'Available'
                          ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-400'
                          : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400'
                      }`}
                    >
                      <BedDouble className="w-8 h-8 mb-2" />
                      <span className="font-bold text-lg">{room.roomNumber}</span>
                      <span className="text-[10px] mt-0.5 text-slate-400 font-bold bg-slate-900/40 px-2 py-0.5 rounded-md">
                        {room.beds || 1} Bed{room.beds > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs mt-1 text-slate-400 font-bold">₹{room.price}</span>
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${room.status === 'Available' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gold-800/30 p-6 rounded-2xl w-full max-w-5xl shadow-2xl">
            <h3 className="text-xl font-bold text-amber-500 mb-6 border-b border-slate-700 pb-2">
              Check-In: Room {selectedRoom?.roomNumber} <span className="text-sm text-slate-400 font-normal ml-2">({selectedRoom?.beds || 1} Bed{selectedRoom?.beds > 1 ? 's' : ''} - ₹{selectedRoom?.price})</span>
            </h3>
            <form onSubmit={handleCheckIn} className="max-h-[75vh] overflow-y-auto pr-2 relative flex flex-col">
              {selectedRoom?.type !== 'Hall' && (
                <div className="sticky top-0 bg-slate-900 pb-4 pt-2 z-10 border-b border-slate-700 mb-4 shadow-sm shadow-slate-900">
                  <label className="block text-sm text-amber-500 font-bold mb-1">Number of Persons</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numGuests}
                    onChange={handleNumGuestsChange}
                    className="w-full md:w-1/3 bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2 text-white font-bold"
                  />
                </div>
              )}

              <div className="space-y-4 flex-1">
                {guests.map((guest, index) => (
                  <div key={index} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80">
                    <h4 className="text-amber-500 font-bold text-sm mb-3 border-b border-slate-700/50 pb-1 inline-block">Person {index + 1}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={guest.name}
                          onChange={(e) => updateGuestField(index, "name", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>

                      {/* Age & Mobile */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Age</label>
                          <input
                            type="number"
                            required
                            value={guest.age}
                            onChange={(e) => updateGuestField(index, "age", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Mobile No</label>
                          <input
                            type="text"
                            required={index === 0}
                            value={guest.phone}
                            onChange={(e) => updateGuestField(index, "phone", e.target.value)}
                            onBlur={(e) => handlePhoneBlur(index, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                      </div>

                      {/* ID Type & ID Number */}
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">ID Type</label>
                          <select
                            value={guest.idType}
                            onChange={(e) => updateGuestField(index, "idType", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-white"
                          >
                            <option value="Aadhar">Aadhar</option>
                            <option value="PAN">PAN</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-slate-400 mb-1">ID Number</label>
                          <input
                            type="text"
                            required={index === 0}
                            value={guest.idNumber}
                            onChange={(e) => updateGuestField(index, "idNumber", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                          />
                        </div>
                      </div>

                      {/* Upload ID Document & Photo */}
                      <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2 lg:col-span-4 mt-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Upload ID {index > 0 && "(Opt.)"}</label>
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-lg p-1.5 h-[38px]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, index)}
                              disabled={uploadingDoc === `doc-${index}`}
                              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer overflow-hidden"
                            />
                            {uploadingDoc === `doc-${index}` && <span className="text-[10px] text-amber-500 animate-pulse whitespace-nowrap">Wait...</span>}
                            {guest.documentImage && (
                              <img src={guest.documentImage} alt="ID" className="w-7 h-7 rounded object-cover shrink-0 border border-emerald-500/50" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Live Photo {index > 0 && "(Opt.)"}</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveWebcam(index)}
                              disabled={uploadingDoc === `photo-${index}`}
                              className="flex items-center justify-center gap-2 flex-1 bg-slate-950 border border-slate-700 rounded-lg h-[38px] text-xs text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                              <Camera className="w-4 h-4" />
                              {uploadingDoc === `photo-${index}` ? "Uploading..." : "Open Camera"}
                            </button>
                            {guest.personPhoto && (
                              <img src={guest.personPhoto} alt="Photo" className="w-8 h-8 rounded object-cover shrink-0 border border-emerald-500/50" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="sticky bottom-0 bg-slate-900 pt-4 pb-2 z-10 mt-6 border-t border-slate-700 shadow-[0_-10px_15px_-3px_rgba(15,23,42,0.8)]">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-full md:w-1/3">
                    <label className="block text-sm text-slate-300 mb-1">Advance Amount Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div className="w-full md:w-1/3 flex flex-col">
                    <label className="flex items-center gap-2 text-sm text-slate-300 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasGST}
                        onChange={(e) => setHasGST(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-950"
                      />
                      Add GST Number
                    </label>
                    {hasGST ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Enter GST Number"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyGST}
                            disabled={verifyingGST || !gstNumber}
                            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {verifyingGST ? "..." : "Verify"}
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Company Address"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-[46px]"></div>
                    )}
                  </div>
                  <div className="w-full md:w-1/3 flex gap-3 self-end">
                    <button
                      type="button"
                      onClick={() => setShowCheckInModal(false)}
                      className="flex-1 py-3 mt-1 text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploadingDoc !== ""}
                      className="flex-1 py-3 mt-1 text-slate-900 bg-amber-500 rounded-xl hover:bg-amber-400 font-bold transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Checking In..." : "Check In"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Out Modal */}
      {showCheckOutModal && activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gold-800/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl text-center">
            <h3 className="text-xl font-bold text-amber-500 mb-4 border-b border-slate-700 pb-2">
              Check-Out: Room {selectedRoom?.roomNumber} <span className="text-sm text-slate-400 font-normal ml-2">({selectedRoom?.beds || 1} Bed{selectedRoom?.beds > 1 ? 's' : ''})</span>
            </h3>
            <div className="text-slate-300 space-y-2 mb-4 text-left bg-slate-950 p-4 rounded-xl border border-slate-700">
              <p><strong>Primary Guest:</strong> {activeBooking.guests && activeBooking.guests[0] ? activeBooking.guests[0].name : 'N/A'}</p>
              <p><strong>Check-In:</strong> {new Date(activeBooking.checkInTime).toLocaleString()}</p>
              <p><strong>Tariff:</strong> ₹{selectedRoom?.price} / night</p>
              <p className="text-emerald-400"><strong>Advance Paid:</strong> ₹{activeBooking.advanceAmount || 0}</p>
            </div>
            <div className="mb-4 text-left">
              <label className="block text-sm text-slate-300 mb-1">Final Total Amount (₹)</label>
              <input
                type="number"
                value={manualTotalAmount}
                onChange={(e) => setManualTotalAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-amber-500 font-bold text-lg"
              />
              <p className="text-xs text-slate-500 mt-1">You can manually adjust the final price before billing.</p>
            </div>
            
            {activeBooking.restaurantBills && activeBooking.restaurantBills.length > 0 && (
              <div className="mb-6 text-left bg-slate-950 p-3 rounded-xl border border-slate-700">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={splitBill}
                    onChange={(e) => setSplitBill(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-slate-900"
                  />
                  Split Room & Restaurant Bills (Print Separately)
                </label>
              </div>
            )}
            
            <div className="flex justify-between items-center bg-slate-900 border border-slate-700 rounded-xl p-3 mb-6">
              <span className="text-sm text-slate-300">Rest Amount to Collect:</span>
              <span className="text-xl font-bold text-emerald-400">₹{Math.max(0, manualTotalAmount - (activeBooking.advanceAmount || 0))}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckOutModal(false)}
                className="flex-1 py-3 text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckOut}
                disabled={submitting}
                className="flex-1 py-3 text-slate-900 bg-amber-500 rounded-xl hover:bg-amber-400 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Check Out & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {activeWebcam !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-bold text-amber-500 mb-4">Capture Photo for Person {activeWebcam + 1}</h3>
            <div className="rounded-xl overflow-hidden mb-4 border-2 border-slate-700 w-full bg-black">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: "user" }}
              />
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setActiveWebcam(null)}
                className="flex-1 py-3 text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => captureWebcamPhoto(activeWebcam)}
                className="flex-1 py-3 text-slate-900 bg-amber-500 rounded-xl hover:bg-amber-400 font-bold transition-colors"
              >
                Capture & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <PremiumRoomInvoice 
          booking={activeBooking} 
          isSplit={splitBill}
          onClose={() => {
            setShowInvoice(false);
            setActiveBooking(null);
            setSplitBill(false);
          }} 
        />
      )}
    </div>
  );
}
