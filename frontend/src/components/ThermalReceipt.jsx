import React, { useEffect } from "react";

export default function ThermalReceipt({ invoice, onClose, isKot = false }) {
  useEffect(() => {
    // Automatically trigger print dialogue when mounted
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    // Optional: detect print close to automatically unmount
    const afterPrint = () => {
      onClose();
    };
    window.addEventListener("afterprint", afterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, [onClose]);

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-white text-black flex justify-center items-start overflow-auto pb-10 print:static print:bg-white print:overflow-visible">
      
      {/* Non-print UI buttons */}
      <div className="fixed top-4 right-4 no-print flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded font-bold shadow-lg"
        >
          Print Now
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white rounded font-bold shadow-lg"
        >
          Close
        </button>
      </div>

      {/* 
        Thermal Receipt Container 
        Standard 80mm roll width is approx 302px (80mm = ~3.15 inches, @ 96dpi = ~302px)
      */}
      <div className="w-[300px] bg-white p-4 font-mono text-sm leading-tight text-black print:w-[80mm] print:m-0 print:p-0">
        
        {/* Header */}
        <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
          <h1 className="font-bold text-xl uppercase tracking-wider mb-1">
            {isKot ? "KITCHEN KOT" : "ROYAL MAJESTIC"}
          </h1>
          {!isKot && (
            <>
              <p className="text-xs">Premium Hotel & Restaurant</p>
              <p className="text-xs mt-1">SRIRAM PARA ROAD, NAPIT PARA,</p>
              <p className="text-xs mb-1">Dumka, Jharkhand 814101</p>
            </>
          )}
        </div>

        {/* Info Details */}
        <div className="mb-4 text-xs space-y-1 border-b border-black pb-2 border-dashed">
          {!isKot && (
            <div className="flex justify-between">
              <span>Bill No:</span>
              <span className="font-bold">{invoice.invoiceNumber || 'NEW'}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(invoice.createdAt || Date.now()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="font-bold">{invoice.customerName || invoice.tableNo}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4 border-b border-black pb-2 border-dashed text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 w-2/3">Item</th>
                <th className={`py-1 ${isKot ? 'text-right' : 'text-center'}`}>Qty</th>
                {!isKot && <th className="py-1 text-right">Amt</th>}
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-dotted border-gray-400">
                  <td className="py-1">{item.name}</td>
                  <td className={`py-1 font-bold ${isKot ? 'text-right text-base' : 'text-center'}`}>{item.quantity}</td>
                  {!isKot && <td className="py-1 text-right">{(item.price * item.quantity).toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals - Only for final bill */}
        {!isKot && (
          <div className="space-y-1 text-xs mb-4 border-b border-black pb-2 border-dashed">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span>₹{invoice.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black">
              <span>GRAND TOTAL:</span>
              <span>₹{invoice.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs">
          {isKot ? (
            <p className="font-bold uppercase tracking-widest mt-2">Please Prepare Items</p>
          ) : (
            <>
              <p>Thank You for Visiting!</p>
              <p>Have a nice day!</p>
            </>
          )}
        </div>

      </div>

      {/* Global styles for print format */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .print\\:static, .print\\:static * {
            visibility: visible;
          }
          .print\\:static {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0;
            size: 80mm auto;
          }
        }
      `}</style>
    </div>
  );
}
