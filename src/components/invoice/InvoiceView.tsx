import React from 'react';
import { Invoice, CompanySettings } from '../../types';
import { UYGarmentsLogo } from '../../assets/logo';
import { Button } from '../common/Button';
import { Printer, Download, ArrowLeft } from 'lucide-react';

interface InvoiceViewProps {
  invoice: Invoice;
  settings: CompanySettings;
  onBack?: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, settings, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const currency = settings.currencySymbol || '$';

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-neutral-200 rounded-xl no-print">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={onBack}>
              Back
            </Button>
          )}
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Invoice #{invoice.invoiceNumber}
            </h2>
            <p className="text-xs text-neutral-500">
              Linked to Order: {invoice.orderNumber} · Customer: {invoice.customerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
            Print / Save PDF (A4)
          </Button>
        </div>
      </div>

      {/* A4 Printable Sheet Container */}
      <div className="print-container bg-white border border-neutral-200 rounded-xl shadow-xs max-w-4xl mx-auto p-8 md:p-12 text-neutral-900">
        {/* Header: Company & Logo + Invoice Meta */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pb-8 border-b-2 border-neutral-900">
          <div>
            {/* Logo preserving original green & gold artwork */}
            <UYGarmentsLogo size="lg" showText={true} customUrl={settings.customLogoUrl} />
            
            <div className="mt-4 text-xs text-neutral-600 space-y-1 max-w-xs">
              <p className="font-semibold text-neutral-900">{settings.companyName}</p>
              <p>{settings.address}</p>
              <p>Phone: {settings.phone}</p>
              <p>Email: {settings.email} · Web: {settings.website}</p>
              {settings.taxRegistrationNumber && (
                <p className="font-mono text-[11px] text-neutral-700">
                  Tax/NTN: {settings.taxRegistrationNumber}
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right space-y-1.5 min-w-[200px]">
            <div className="text-3xl font-black tracking-tight text-neutral-950 uppercase">
              TAX INVOICE
            </div>
            <div className="font-mono text-sm font-bold text-neutral-900">
              #{invoice.invoiceNumber}
            </div>
            
            <div className="pt-2 text-xs space-y-1 text-neutral-600">
              <div>
                <span className="text-neutral-400 font-medium">Invoice Date:</span>{' '}
                <span className="font-semibold text-neutral-900">{invoice.invoiceDate}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">Due Date:</span>{' '}
                <span className="font-semibold text-neutral-900">{invoice.dueDate}</span>
              </div>
              <div>
                <span className="text-neutral-400 font-medium">Order Ref:</span>{' '}
                <span className="font-mono font-bold text-neutral-900">{invoice.orderNumber}</span>
              </div>
              <div className="pt-1">
                <span className="text-neutral-400 font-medium">Payment Status:</span>{' '}
                <span className="font-bold uppercase tracking-wider text-neutral-900">
                  {invoice.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Customer Details */}
        <div className="py-6 border-b border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Billed To Customer
            </div>
            <div className="text-sm font-bold text-neutral-950">
              {invoice.customerCompany || invoice.customerName}
            </div>
            {invoice.customerCompany && (
              <div className="text-neutral-700 font-medium">Attn: {invoice.customerName}</div>
            )}
            <div className="text-neutral-600 mt-1 leading-relaxed">
              {invoice.customerAddress || 'Direct Commercial Dispatch'}
            </div>
            <div className="text-neutral-600 mt-1">
              Phone: {invoice.customerPhone || 'N/A'}
            </div>
            {invoice.customerEmail && (
              <div className="text-neutral-600">Email: {invoice.customerEmail}</div>
            )}
          </div>

          <div className="sm:text-right">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Banking & Remittance
            </div>
            <div className="text-neutral-800 font-medium">
              {settings.bankDetails.bankName}
            </div>
            <div className="text-neutral-600">
              Account Title: <span className="font-medium text-neutral-900">{settings.bankDetails.accountTitle}</span>
            </div>
            <div className="font-mono text-neutral-800">
              A/C: {settings.bankDetails.accountNumber}
            </div>
            <div className="font-mono text-neutral-600 text-[11px]">
              IBAN: {settings.bankDetails.iban}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-900 font-bold uppercase tracking-wider text-[11px] text-neutral-900">
                <th className="py-2.5 pr-2">#</th>
                <th className="py-2.5 px-2">Collection & Article Description</th>
                <th className="py-2.5 px-2 text-center">Colour</th>
                <th className="py-2.5 px-2 text-center">Size</th>
                <th className="py-2.5 px-2 text-right">Quantity</th>
                <th className="py-2.5 px-2 text-right">Rate ({currency})</th>
                <th className="py-2.5 pl-2 text-right">Line Total ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx} className="text-neutral-800">
                  <td className="py-3 pr-2 font-mono text-neutral-400">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <div className="font-bold text-neutral-950">{item.productName}</div>
                    <div className="text-[11px] text-neutral-500">Collection: {item.collection}</div>
                  </td>
                  <td className="py-3 px-2 text-center">{item.colour}</td>
                  <td className="py-3 px-2 text-center font-semibold">{item.size}</td>
                  <td className="py-3 px-2 text-right font-mono font-medium">{item.quantity.toLocaleString()} pcs</td>
                  <td className="py-3 px-2 text-right font-mono">{currency}{item.rate.toFixed(2)}</td>
                  <td className="py-3 pl-2 text-right font-mono font-bold text-neutral-950">
                    {currency}{item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Totals */}
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="w-full sm:max-w-xs space-y-2 text-xs">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Terms & Instructions
            </div>
            <p className="text-neutral-600 leading-relaxed italic">
              {invoice.notes || 'Goods once sold are subject to inspection at delivery bay. All garments are pre-shrunk.'}
            </p>
          </div>

          <div className="w-full sm:w-80 space-y-2 text-xs divide-y divide-neutral-100">
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-neutral-900">{currency}{invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Discount:</span>
                <span className="font-mono text-neutral-900">- {currency}{invoice.discount.toFixed(2)}</span>
              </div>
            )}

            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Additional Charges:</span>
                <span className="font-mono text-neutral-900">+ {currency}{invoice.additionalCharges.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 text-sm font-extrabold text-neutral-950 border-t-2 border-neutral-900">
              <span className="uppercase">Grand Total:</span>
              <span className="font-mono text-base">{currency}{invoice.grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 text-neutral-600">
              <span>Advance Received:</span>
              <span className="font-mono text-neutral-900">{currency}{invoice.advanceReceived.toFixed(2)}</span>
            </div>

            {invoice.subsequentPayments > 0 && (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>Subsequent Payments:</span>
                <span className="font-mono text-neutral-900">{currency}{invoice.subsequentPayments.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 font-semibold text-neutral-900">
              <span>Total Payments Received:</span>
              <span className="font-mono">{currency}{invoice.totalReceived.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 text-sm font-black border-t-2 border-neutral-900">
              <span className="uppercase text-neutral-900">Remaining Balance:</span>
              <span className="font-mono text-base text-neutral-950">
                {currency}{invoice.remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signature & Authorized Representative Area */}
        <div className="mt-16 pt-8 border-t border-neutral-200 grid grid-cols-2 gap-12 text-xs">
          <div>
            <div className="h-14 border-b border-neutral-300"></div>
            <div className="pt-2 font-semibold text-neutral-800">Customer Receiver Signature</div>
            <div className="text-[10px] text-neutral-400">Date & Company Stamp</div>
          </div>

          <div className="text-right">
            <div className="h-14 border-b border-neutral-300 flex items-end justify-end pb-1">
              <span className="text-[11px] font-serif italic text-neutral-400">UY Garments Authorized Signatory</span>
            </div>
            <div className="pt-2 font-bold text-neutral-900">For UY GARMENTS</div>
            <div className="text-[10px] text-neutral-400">Chief Executive / Authorized Accounts</div>
          </div>
        </div>

        {/* Print Footer Notice */}
        <div className="mt-8 text-[10px] text-neutral-400 border-t border-neutral-100 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>This is an authentic system generated invoice by UY Garments Management Software.</span>
          <span className="font-normal text-neutral-400">Developed by Muhammad Mubashir</span>
        </div>
      </div>
    </div>
  );
};
