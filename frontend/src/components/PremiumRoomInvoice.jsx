import React, { useState } from "react";
import { Printer, Download, X, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

export default function PremiumRoomInvoice({ booking, onClose }) {
  if (!booking) return null;

  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector(".printable-room-sheet");
    if (!element) return;
    
    setDownloading(true);

    try {
      if (!window.html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const opt = {
        margin:       0.4,
        filename:     `room_invoice_${booking._id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await window.html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      Swal.fire("Error", "Failed to generate PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const checkInDate = new Date(booking.checkInTime);
  const checkOutDate = new Date(booking.checkOutTime || Date.now());
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const gracePeriod = 2 * 60 * 60 * 1000;
  const adjustedDiffTime = Math.max(0, diffTime - gracePeriod);
  let diffDays = Math.ceil(adjustedDiffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) diffDays = 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-slate-900 border border-gold-800/30 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col my-8 no-print">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Room Invoice Generated Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh]" id="room-invoice-preview">
          
          <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm font-sans printable-room-sheet">
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 border-slate-100">
              <div>
                <h2 className="text-2xl font-black font-serif tracking-tight text-indigo-800">
                  HOTEL SWAYAMVAR VATIKA
                </h2>
                <h3 className="text-md font-semibold text-slate-700 italic">
                  Premium Hotel & Accommodation
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-tight">
                  near Q complax building, near Daya vatika,<br />Basukinath, Jharkhand 814118
                </p>
                <p className="text-xs text-slate-500">
                  Owner: Rahul Chandan | Hotel & Restaurant
                </p>
              </div>
              <div className="text-right sm:text-right">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                  Room Bill
                </span>
                <p className="text-sm font-bold text-slate-800 mt-2">
                  Booking ID: <span className="font-mono text-xs">{booking._id.substring(booking._id.length - 6)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Date: {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            <div className="my-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Guest Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Primary Guest:</p>
                  <p className="font-semibold text-slate-800">{booking.guests && booking.guests[0] ? booking.guests[0].name : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mobile:</p>
                  <p className="font-semibold text-slate-800">{booking.guests && booking.guests[0] ? booking.guests[0].phone : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">{booking.guests && booking.guests[0] ? booking.guests[0].idType : 'ID'} No:</p>
                  <p className="font-semibold text-slate-850 font-mono text-xs">{booking.guests && booking.guests[0] ? booking.guests[0].idNumber : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total Persons:</p>
                  <p className="font-semibold text-slate-850 font-mono text-xs">{booking.guests ? booking.guests.length : 1}</p>
                </div>
              </div>
            </div>

            <div className="my-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b pb-1">
                Stay Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                <div>
                  <p className="text-slate-500 text-xs">Room No / Type</p>
                  <p className="font-bold text-slate-800">{booking.room?.roomNumber} ({booking.room?.type})</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Check In</p>
                  <p className="font-medium text-slate-800">{checkInDate.toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-slate-500">{checkInDate.toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Check Out</p>
                  <p className="font-medium text-slate-800">{checkOutDate.toLocaleDateString("en-IN")}</p>
                  <p className="text-xs text-slate-500">{checkOutDate.toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Duration</p>
                  <p className="font-bold text-slate-800">{diffDays} Night(s)</p>
                </div>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-sm mt-6">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 font-semibold">
                  <th className="py-3 font-semibold">Description</th>
                  <th className="py-3 text-center font-semibold">Nights</th>
                  <th className="py-3 text-right font-semibold">Tariff/Night</th>
                  <th className="py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="text-slate-800">
                  <td className="py-3 font-medium">Room Stay: {booking.room?.type} ({booking.room?.roomNumber})</td>
                  <td className="py-3 text-center">{diffDays}</td>
                  <td className="py-3 text-right font-mono">₹{booking.room?.price?.toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-medium">
                    ₹{(booking.room?.price * diffDays).toFixed(2)}
                  </td>
                </tr>
                {booking.restaurantBills && booking.restaurantBills.length > 0 && booking.restaurantBills.map((bill, billIndex) => (
                  <React.Fragment key={bill._id}>
                    <tr className="bg-amber-100/50">
                      <td colSpan="4" className="py-2 px-2 text-xs font-bold text-amber-800 border-t border-amber-200">
                        Restaurant Order #{bill.invoiceNumber || bill._id.substring(bill._id.length - 6)}
                      </td>
                    </tr>
                    {bill.items && bill.items.map((item, itemIndex) => (
                      <tr key={`${bill._id}-${itemIndex}`} className="text-slate-700 bg-amber-50/30 text-sm">
                        <td className="py-2 pl-4 font-medium">- {item.name}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right font-mono">₹{item.price?.toFixed(2)}</td>
                        <td className="py-2 text-right font-mono font-medium">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {bill.tax > 0 && (
                      <tr className="text-slate-600 bg-amber-50/30 text-xs">
                        <td colSpan="3" className="py-1 text-right italic">GST (5%)</td>
                        <td className="py-1 text-right font-mono">₹{bill.tax?.toFixed(2)}</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-4 mt-6 flex justify-end">
              <div className="w-64 text-sm divide-y divide-slate-150">
                <div className="flex justify-between py-2 font-bold text-slate-900 text-base">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-800">₹{booking.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 mt-8 text-center text-xs text-slate-400">
              <p className="font-medium">Thank you for staying with us!</p>
              <p className="mt-1">Visit again to Hotel Swayamwar Vatika</p>
              <div className="flex justify-between items-end mt-8">
                <div className="text-left">
                  <p className="text-[10px] text-slate-350 uppercase">Guest Signature</p>
                  <div className="w-24 border-b border-dashed border-slate-300 mt-6"></div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-350 uppercase">Authorized Signatory</p>
                  <p className="text-[10px] font-serif text-slate-600 italic mt-2">Rahul Chandan</p>
                  <div className="w-28 border-b border-dashed border-slate-300 mt-2"></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-905 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            Close
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>{downloading ? "Downloading..." : "Download PDF"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>

      </div>

      <div className="print-only hidden">
        <div className="bg-white text-black p-8 font-sans w-full max-w-full">
          <div className="flex justify-between items-start border-b pb-4 border-gray-300">
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-800 uppercase">
                HOTEL SWAYAMVAR VATIKA
              </h2>
              <p className="text-xs text-gray-600 font-semibold italic">Premium Hotel & Accommodation</p>
              <p className="text-xs text-gray-500 max-w-xs">near Q complax building, near Daya vatika, Basukinath, Jharkhand 814118</p>
            </div>
            <div className="text-right">
              <span className="border border-black px-2 py-0.5 text-xs font-bold uppercase">
                Room Bill
              </span>
              <p className="text-xs font-bold mt-2">
                Booking #: {booking._id.substring(booking._id.length - 6)}
              </p>
            </div>
          </div>
          <div className="my-4 border border-gray-300 p-3 rounded text-xs grid grid-cols-2">
            <p><strong>Primary Guest:</strong> {booking.guests && booking.guests[0] ? booking.guests[0].name : 'N/A'}</p>
            <p><strong>Mobile:</strong> {booking.guests && booking.guests[0] ? booking.guests[0].phone : 'N/A'}</p>
            <p><strong>Total Persons:</strong> {booking.guests ? booking.guests.length : 1}</p>
            <p><strong>Room:</strong> {booking.room?.roomNumber} ({booking.room?.type})</p>
            <p><strong>Check-In:</strong> {checkInDate.toLocaleString("en-IN")}</p>
            <p><strong>Check-Out:</strong> {checkOutDate.toLocaleString("en-IN")}</p>
          </div>
          
          {booking.guests && booking.guests.length > 1 && (
            <div className="mb-4 text-[10px]">
              <p className="font-bold border-b border-black inline-block mb-1">Additional Guests:</p>
              <ul className="list-disc pl-4 text-gray-700">
                {booking.guests.slice(1).map((g, idx) => (
                  <li key={idx}>{g.name} (Age: {g.age}) - {g.idType}: {g.idNumber}</li>
                ))}
              </ul>
            </div>
          )}
          <table className="w-full text-left border-collapse text-xs mt-4">
            <thead>
              <tr className="border-b border-black text-gray-600 font-bold">
                <th className="py-2">Description</th>
                <th className="py-2 text-center">Nights</th>
                <th className="py-2 text-right">Tariff</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">Room {booking.room?.roomNumber} ({booking.room?.type})</td>
                <td className="py-2 text-center">{diffDays}</td>
                <td className="py-2 text-right">₹{booking.room?.price}</td>
                <td className="py-2 text-right">₹{booking.room?.price * diffDays}</td>
              </tr>
              {booking.restaurantBills && booking.restaurantBills.length > 0 && booking.restaurantBills.map((bill) => (
                <React.Fragment key={bill._id}>
                  <tr className="bg-gray-100">
                    <td colSpan="4" className="py-1 px-1 font-bold italic text-gray-700 border-t border-gray-300">
                      Restaurant Order #{bill.invoiceNumber || bill._id.substring(bill._id.length - 6)}
                    </td>
                  </tr>
                  {bill.items && bill.items.map((item, i) => (
                    <tr key={`${bill._id}-${i}`}>
                      <td className="py-1 pl-3 text-gray-700">- {item.name}</td>
                      <td className="py-1 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-1 text-right text-gray-700">₹{item.price}</td>
                      <td className="py-1 text-right text-gray-700">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                  {bill.tax > 0 && (
                    <tr>
                      <td colSpan="3" className="py-1 text-right text-gray-500 italic">GST (5%)</td>
                      <td className="py-1 text-right text-gray-500">₹{bill.tax}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-black pt-2 mt-4 flex justify-end text-xs font-bold">
            <p>Grand Total: ₹{booking.totalAmount}</p>
          </div>
          <div className="border-t border-gray-300 pt-4 mt-6 text-center text-[10px] text-gray-500">
            <p>Thank you for staying with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
