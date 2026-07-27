"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { formatPrice } from "@/lib/data";
import { BuyerDetails, CartItem } from "@/lib/types";
import {
  cartTotalPaise,
  clearCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from "@/lib/cart";

const EMPTY_BUYER: BuyerDetails = {
  name: "",
  mobile: "",
  idNumber: "",
  enrolmentNumber: "",
  dayScholar: false,
  hostelName: "",
  roomNumber: "",
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyer, setBuyer] = useState<BuyerDetails>(EMPTY_BUYER);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only store on mount, not derived state
    setItems(getCart());
    setLoaded(true);
  }, []);

  function refresh() {
    setItems(getCart());
  }

  function handleProceed(e: React.FormEvent) {
    e.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!buyer.name.trim() || !buyer.mobile.trim() || !buyer.idNumber.trim() || !buyer.enrolmentNumber.trim()) {
      setError("Name, mobile number, ID number, and enrolment number are all required.");
      return;
    }
    if (!buyer.dayScholar && (!buyer.hostelName.trim() || !buyer.roomNumber.trim())) {
      setError("Hostel name and room number are required unless you're a day scholar.");
      return;
    }

    const refCode = sessionStorage.getItem("ref_code") ?? undefined;
    const draft = { items, buyer, refCode };
    sessionStorage.setItem("checkout_draft", JSON.stringify(draft));
    clearCart();
    router.push("/checkout");
  }

  const total = cartTotalPaise(items);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
        <h1 className="font-display font-medium text-2xl mb-8">Your cart</h1>

        {loaded && items.length === 0 && (
          <p className="text-sm text-ink-soft">
            Your cart is empty.{" "}
            <Link href="/catalog" className="underline">
              Browse the catalog.
            </Link>
          </p>
        )}

        {items.length > 0 && (
          <>
            <div className="border border-line divide-y divide-line mb-10">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.sizeId}`}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-ink-soft">size {item.sizeLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateQuantity(item.productId, item.sizeId, item.quantity - 1);
                        refresh();
                      }}
                      className="w-7 h-7 border border-line hover:border-line-strong flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="mono-num w-5 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateQuantity(item.productId, item.sizeId, Math.min(5, item.quantity + 1));
                        refresh();
                      }}
                      className="w-7 h-7 border border-line hover:border-line-strong flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <span className="mono-num text-sm w-20 text-right">
                    {formatPrice(item.unitPricePaise * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(item.productId, item.sizeId);
                      refresh();
                    }}
                    className="text-xs text-ink-soft hover:text-ink underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 mono-num">
                <span className="text-sm font-sans">Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <form onSubmit={handleProceed} className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Your details</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Full name"
                    value={buyer.name}
                    onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                    className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                  />
                  <input
                    placeholder="Mobile number"
                    value={buyer.mobile}
                    onChange={(e) => setBuyer({ ...buyer, mobile: e.target.value })}
                    className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                  />
                  <input
                    placeholder="ID number"
                    value={buyer.idNumber}
                    onChange={(e) => setBuyer({ ...buyer, idNumber: e.target.value })}
                    className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                  />
                  <input
                    placeholder="Enrolment number"
                    value={buyer.enrolmentNumber}
                    onChange={(e) => setBuyer({ ...buyer, enrolmentNumber: e.target.value })}
                    className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm mb-3">
                  <input
                    type="checkbox"
                    checked={buyer.dayScholar}
                    onChange={(e) =>
                      setBuyer({
                        ...buyer,
                        dayScholar: e.target.checked,
                        hostelName: e.target.checked ? "" : buyer.hostelName,
                        roomNumber: e.target.checked ? "" : buyer.roomNumber,
                      })
                    }
                  />
                  I&apos;m a day scholar (not staying in a hostel)
                </label>

                {!buyer.dayScholar && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Hostel name"
                      value={buyer.hostelName}
                      onChange={(e) => setBuyer({ ...buyer, hostelName: e.target.value })}
                      className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                    />
                    <input
                      placeholder="Room number"
                      value={buyer.roomNumber}
                      onChange={(e) => setBuyer({ ...buyer, roomNumber: e.target.value })}
                      className="border border-line px-3 py-2 text-sm bg-paper-raised focus:outline-none focus:border-ink"
                    />
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm" style={{ color: "var(--warn)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-ink text-paper text-sm font-medium hover:opacity-85 transition-opacity self-start"
              >
                Continue to payment
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
