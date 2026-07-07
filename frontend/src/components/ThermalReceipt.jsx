import React, { useEffect } from "react";
import { Printer, X, CheckCircle } from "lucide-react";

export default function ThermalReceipt({ invoice, onClose, isKot = false }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);
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

  const checkInDate = new Date(invoice.createdAt || Date.now());
  const dateStr = checkInDate.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: '2-digit' });
  const timeStr = checkInDate.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  
  const safeId = invoice._id ? invoice._id.toString() : "NEW123";
  const kotNo = invoice.kotNumber || invoice.invoiceNumber || safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase();
  const billNo = invoice.invoiceNumber || safeId.substring(Math.max(0, safeId.length - 6)).toUpperCase();
  const tableNo = invoice.table ? invoice.table.tableNumber : invoice.tableNo || 'N/A';

  let subTotal = 0;
  if (invoice.items) {
    invoice.items.forEach(item => {
      subTotal += item.price * item.quantity;
    });
  }

  let cgst = 0;
  let sgst = 0;
  if (invoice.tax) {
    cgst = invoice.tax / 2;
    sgst = invoice.tax / 2;
  }

  const netAmount = subTotal + cgst + sgst;

  const ReceiptContent = () => (
    <div className="bg-white text-black font-mono mx-auto p-4" style={{ width: '80mm', minHeight: '100mm', fontSize: '12px', lineHeight: '1.2' }}>
      <div className="text-center mb-1">
        <h1 className="text-xl font-bold tracking-wide">{isKot ? "KITCHEN KOT" : "ROYAL MAJESTIC"}</h1>
        {!isKot && (
          <>
            <p>Near Town Police Station</p>
            <p>, Dumka Jharkhand-814101</p>
            <p>PHONE:- +91 9905901361/62</p>
            <p>FSSAI-LIC:-11121019000037</p>
            <p>GST IN:-20AAXFR0731N1ZX</p>
            <h2 className="font-bold underline mt-1 text-sm">Tax Invoice</h2>
          </>
        )}
      </div>

      <div className="border-t border-b border-black border-dashed my-1 py-1 flex justify-center">
        <span className="font-semibold mr-2">Kot No:</span>
        <span className="font-semibold">{kotNo}</span>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        <div className="flex justify-between font-semibold">
          <div className="w-[20%]">Bill No:</div>
          <div className="w-[30%] text-center">Table No:</div>
          <div className="w-[25%] text-center">Date:</div>
          <div className="w-[25%] text-right">Time:</div>
        </div>
        <div className="flex justify-between">
          <div className="w-[20%]">{billNo}</div>
          <div className="w-[30%] text-center">{tableNo !== 'N/A' ? tableNo : ''}</div>
          <div className="w-[25%] text-center">{dateStr}</div>
          <div className="w-[25%] text-right">{timeStr}</div>
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1 font-semibold">
        <div className="flex justify-between">
          <div className={`w-[45%] ${isKot ? 'w-[70%]' : ''}`}>Item Name</div>
          <div className={`w-[15%] text-center ${isKot ? 'w-[30%] text-right' : ''}`}>Qty.</div>
          {!isKot && <div className="w-[20%] text-right">Rate</div>}
          {!isKot && <div className="w-[20%] text-right">Amount</div>}
        </div>
      </div>

      <div className="border-b border-black border-dashed pb-1 mb-1">
        {invoice.items && invoice.items.map((item, i) => (
          <div key={i} className="flex justify-between mb-1">
            <div className={`w-[45%] break-words pr-1 ${isKot ? 'w-[70%]' : ''}`}>{item.name}</div>
            <div className={`w-[15%] text-center font-bold ${isKot ? 'w-[30%] text-right text-base' : ''}`}>{(item.quantity).toFixed(3)}</div>
            {!isKot && <div className="w-[20%] text-right">{(item.price).toFixed(2)}</div>}
            {!isKot && <div className="w-[20%] text-right">{(item.price * item.quantity).toFixed(2)}</div>}
          </div>
        ))}
      </div>

      {!isKot && (
        <>
          <div className="flex flex-col items-end w-full mb-1 border-b border-black border-dashed pb-1">
            <div className="flex justify-end w-full font-semibold">
              <div className="w-[60%] text-right pr-4">Total:</div>
              <div className="w-[40%] text-right">{subTotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-end w-full">
              <div className="w-[60%] text-right pr-4">CGST 2.5%:</div>
              <div className="w-[40%] text-right">{cgst.toFixed(2)}</div>
            </div>
            <div className="flex justify-end w-full">
              <div className="w-[60%] text-right pr-4">SGST 2.5%:</div>
              <div className="w-[40%] text-right">{sgst.toFixed(2)}</div>
            </div>
            <div className="flex justify-end w-full font-bold mt-1 text-sm">
              <div className="w-[60%] text-right pr-4">Net Amount:</div>
              <div className="w-[40%] text-right">{netAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-2 font-semibold">
            <span className="mr-4">Cashier:</span>
            <span>ROYAL</span>
          </div>

          <div className="mt-1 font-bold underline text-sm">
            Terms & Conditions
          </div>
          <div className="text-[11px] leading-tight mt-1">
            <p>1.All Disputes are Subject to DUMKA<br/>Jurisdiction only.</p>
            <p className="mt-1">2.If you are satisfied tell others, If not tell us</p>
          </div>
        </>
      )}

      {isKot && (
        <div className="mt-2 text-center font-bold uppercase tracking-widest text-lg">
          Please Prepare Items
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[99999] bg-white text-black flex justify-center items-start overflow-auto pb-10 print:static print:bg-white print:overflow-visible">
      
      {/* Non-print UI buttons */}
      <div className="fixed top-4 right-4 no-print flex gap-2 z-[100000]">
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

      <div className="w-[300px] bg-white p-4 font-mono text-sm leading-tight text-black print:w-[80mm] print:m-0 print:p-0">
        <ReceiptContent />
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
