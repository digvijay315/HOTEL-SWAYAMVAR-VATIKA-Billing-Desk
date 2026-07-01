import React, { useState } from "react";
import { Printer, Download, X, CheckCircle } from "lucide-react";
import { showError } from "../utils/alerts";

export default function PremiumInvoice({ invoice, onClose }) {
  if (!invoice) return null;

  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector(".printable-sheet");
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
        filename:     `invoice_${invoice.invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await window.html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      showError("Error", "Failed to generate PDF. Please try using the Print option.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-slate-900 border border-gold-800/30 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col my-8 no-print">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Invoice Generated Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for Preview */}
        <div className="p-8 overflow-y-auto max-h-[70vh]" id="invoice-preview">
          
          {/* PREMIUM PRINTABLE INVOICE SHEET */}
          <div className="bg-white text-slate-900 p-8 rounded-xl border border-slate-200 shadow-sm font-sans printable-sheet">
            
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img src="/logo.jpg" alt="Logo" className="w-12 h-12 object-contain rounded-md" />
                  <h2 className="text-2xl font-black font-serif tracking-tight text-amber-800">
                    ROYAL MAJESTIC
                  </h2>
                </div>
                <h3 className="text-md font-semibold text-slate-700 italic">
                  Premium Hotel & Restaurant
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-tight">
                  SRIRAM PARA ROAD, NAPIT PARA,<br />Dumka, Jharkhand 814101
                </p>
                <p className="text-xs text-slate-500">
                  Owner: Rahul Chandan | Hotel & Restaurant
                </p>
              </div>
              <div className="text-right sm:text-right">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase">
                  Tax Invoice
                </span>
                <p className="text-sm font-bold text-slate-800 mt-2">
                  Invoice #: <span className="font-mono">{invoice.invoiceNumber}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Date: {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {invoice.createdBy && (
                  <p className="text-xs text-slate-500">
                    Billed By: {invoice.createdBy.name || invoice.createdBy}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="my-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Billed To (Customer Details)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Name:</p>
                  <p className="font-semibold text-slate-800">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Mobile:</p>
                  <p className="font-semibold text-slate-800">{invoice.customerMobile}</p>
                </div>
                {invoice.customerEmail && (
                  <div className="sm:col-span-2 mt-1">
                    <p className="text-slate-500">Email:</p>
                    <p className="font-semibold text-slate-850 font-mono text-xs">{invoice.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Items Table */}
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 font-semibold">
                  <th className="py-3 font-semibold">Dish/Item Description</th>
                  <th className="py-3 text-center font-semibold">Qty</th>
                  <th className="py-3 text-right font-semibold">Price</th>
                  <th className="py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, index) => (
                  <tr key={index} className="text-slate-800">
                    <td className="py-3 font-medium">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">₹{item.price.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary calculations */}
            <div className="border-t border-slate-200 pt-4 mt-6 flex justify-end">
              <div className="w-64 text-sm divide-y divide-slate-150">
                <div className="flex justify-between py-2 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{(invoice.subTotal || invoice.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-slate-600">
                  <span>CGST and SGST (5%):</span>
                  <span className="font-mono">₹{(invoice.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-slate-900 text-base">
                  <span>Grand Total:</span>
                  <span className="font-mono text-amber-800">₹{(invoice.grandTotal || invoice.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Invoice Footer terms */}
            <div className="border-t border-slate-100 pt-6 mt-8 text-center text-xs text-slate-400">
              <p className="font-medium">Thank you for dining with us!</p>
              <p className="mt-1">Visit again to ROYAL MAJESTIC</p>
              <div className="flex justify-between items-end mt-8">
                <div className="text-left">
                  <p className="text-[10px] text-slate-350 uppercase">Customer Signature</p>
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

        {/* Modal Footer Controls */}
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

      {/* THERMAL RECEIPT COPY ONLY RENDERED ON WINDOW PRINTING PROCESS */}
      <div className="print-only hidden font-mono">
        <div className="bg-white text-black p-2 mx-auto" style={{ width: '100%', maxWidth: '300px' }}>
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <h2 className="text-lg font-bold text-black uppercase leading-tight">
              ROYAL MAJESTIC
            </h2>
            <p className="text-[10px] font-bold mt-0.5">Premium Hotel & Restaurant</p>
            <p className="text-[9px] mt-0.5 leading-tight">SRIRAM PARA ROAD, NAPIT PARA,<br/>Dumka, Jharkhand 814101</p>
            <p className="text-[10px] mt-1 font-bold">TAX INVOICE</p>
          </div>
          
          <div className="text-[10px] mb-2 border-b border-dashed border-gray-400 pb-2">
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Inv #:</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            {invoice.createdBy && (
              <div className="flex justify-between">
                <span>Billed By:</span>
                <span>{invoice.createdBy.name || invoice.createdBy}</span>
              </div>
            )}
            <div className="mt-1 border-t border-dashed border-gray-200 pt-1">
              <p>Customer: {invoice.customerName}</p>
              <p>Mobile: {invoice.customerMobile}</p>
            </div>
          </div>

          <table className="w-full text-left text-[10px] mb-2">
            <thead>
              <tr className="border-b border-dashed border-gray-400">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1 align-top w-1/2">
                    {item.name} <br/> 
                    <span className="text-[8px] text-gray-500">@₹{item.price.toFixed(2)}</span>
                  </td>
                  <td className="py-1 text-center align-top">{item.quantity}</td>
                  <td className="py-1 text-right align-top">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-400 pt-2 text-[10px]">
            <div className="flex justify-between py-0.5">
              <span>Subtotal:</span>
              <span>₹{(invoice.subTotal || invoice.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>GST (5%):</span>
              <span>₹{(invoice.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold text-[12px] border-t border-dashed border-gray-400 mt-1 pt-1">
              <span>Total:</span>
              <span>₹{(invoice.grandTotal || invoice.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 pt-2 mt-2 text-center text-[10px]">
            <p>Thank you for dining with us!</p>
            <p>Visit again</p>
          </div>
        </div>
      </div>
    </div>
  );
}
