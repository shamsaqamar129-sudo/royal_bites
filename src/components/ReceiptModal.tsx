import React, { useEffect, useState } from 'react';
import { CheckCircle2, Printer, X } from 'lucide-react';
import { fetchOrderLineItems } from '../lib/firestoreService';
import { OrderLineRecord, OrderRecord, OrderStatus } from '../types';

interface ReceiptModalProps {
  order: OrderRecord | null;
  isAdmin: boolean;
  onClose: () => void;
}

const TRACKING_STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.COMPLETED,
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isAdmin, onClose }) => {
  const [lineItems, setLineItems] = useState<OrderLineRecord[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  useEffect(() => {
    if (!order) return;
    let active = true;
    setLoadingLines(true);
    fetchOrderLineItems(order.id, order.userId, isAdmin)
      .then((items) => {
        if (active) setLineItems(items);
      })
      .catch(() => {
        if (active) setLineItems([]);
      })
      .finally(() => {
        if (active) setLoadingLines(false);
      });
    return () => {
      active = false;
    };
  }, [order, isAdmin]);

  if (!order) return null;

  const currentStepIndex = TRACKING_STEPS.indexOf(order.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.orderNumber} Receipt and Status`}
    >
      <div className="fixed inset-0 no-print" onClick={onClose} />

      <div
        id="printable-receipt"
        className="relative z-10 w-full max-w-2xl rb-surface border rb-border rounded-lg p-6 sm:p-8 shadow-2xl my-8 space-y-6"
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b rb-border">
          <div>
            <p className="text-xs rb-accent font-semibold tracking-wide">
              Royal Bites Official Order Receipt
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold rb-text mt-0.5">
              Order {order.orderNumber}
            </h2>
          </div>

          <div className="flex items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#E5C76B] transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close receipt"
              className="w-10 h-10 inline-flex items-center justify-center rounded-md border rb-border rb-text hover:border-[#D4AF37] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Status Tracker */}
        <div className="p-4 sm:p-5 rounded-md rb-bg-alt border rb-border space-y-3 no-print">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold rb-text">Order Progress</span>
            <span className="rb-accent font-semibold">{order.status}</span>
          </div>

          {order.status === OrderStatus.CANCELLED ? (
            <p className="text-xs text-red-500 font-medium">
              This order has been cancelled.
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-2 pt-1">
              {TRACKING_STEPS.map((step, idx) => {
                const reached = currentStepIndex >= idx;
                return (
                  <div key={step} className="space-y-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        reached ? 'bg-[#D4AF37]' : 'bg-neutral-500/25'
                      }`}
                    />
                    <p
                      className={`text-[11px] leading-tight ${
                        reached ? 'rb-text font-semibold' : 'rb-text-subtle'
                      }`}
                    >
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer & Delivery Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <p className="rb-text-subtle text-xs">Customer</p>
            <p className="font-semibold rb-text">{order.customerName}</p>
            <p className="font-mono text-xs rb-text-muted">{order.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="rb-text-subtle text-xs">Delivery Destination</p>
            <p className="font-semibold rb-text">{order.address}</p>
            <p className="text-xs rb-text-muted">
              {order.zoneName} · {order.channel}
            </p>
          </div>
          <div className="space-y-1">
            <p className="rb-text-subtle text-xs">Placed</p>
            <p className="font-mono text-xs rb-text">{order.createdAtLabel}</p>
          </div>
          <div className="space-y-1">
            <p className="rb-text-subtle text-xs">Settlement</p>
            <p className="text-xs rb-text">
              Pay on Delivery (No online card charge processed)
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border-t border-b rb-border py-4 space-y-3">
          <h3 className="font-serif text-lg font-semibold rb-text">Itemized Culinary Order</h3>
          {loadingLines ? (
            <p className="text-xs rb-text-muted py-2">Loading itemized customizations...</p>
          ) : lineItems.length > 0 ? (
            <div className="space-y-2.5">
              {lineItems.map((line) => (
                <div key={line.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold rb-text">
                      {line.quantity} × {line.dishName}
                    </p>
                    <p className="text-xs rb-text-muted">
                      {line.sizeLabel}
                      {line.extrasSummary ? ` · ${line.extrasSummary}` : ''}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums rb-text shrink-0">
                    ${line.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm rb-text-muted">{order.itemSummary}</p>
          )}
        </div>

        {/* Totals Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between rb-text-muted">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-500">
              <span>Promotional Discount ({order.couponCode})</span>
              <span className="font-mono tabular-nums">-${order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between rb-text-muted">
            <span>VAT / Hospitality Tax</span>
            <span className="font-mono tabular-nums">${order.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between rb-text-muted">
            <span>Chauffeur Delivery</span>
            <span className="font-mono tabular-nums">
              {order.deliveryFee === 0 ? 'Complimentary' : `$${order.deliveryFee.toFixed(2)}`}
            </span>
          </div>
          <div className="pt-3 border-t rb-border flex justify-between text-base font-semibold rb-text">
            <span>Total Due on Delivery</span>
            <span className="font-mono tabular-nums rb-accent">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs rb-text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 rb-accent" />
            <span>Royal Bites Hospitality · 14 Berkeley Square, Mayfair</span>
          </span>
          <span className="font-mono">{order.orderNumber}</span>
        </div>
      </div>
    </div>
  );
};
