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
      <SiteHeader compact />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <h1 className="headline text-3xl mb-10">Your cart</h1>

        {loaded && items.length === 0 && (
          <p className="text-sm text-ink-muted">
            Your cart is empty.{" "}
            <Link href="/" className="underline text-ink">
              Continue shopping.
            </Link>
          </p>
        )}

        {items.length > 0 && (
          <>
            <div className="border border-border divide-y divide-border mb-10">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.sizeId}`}
                  className="flex items-center justify-between gap-4 px-4 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-ink-muted">size {item.sizeLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateQuantity(item.productId, item.sizeId, item.quantity - 1);
                        refresh();
                      }}
                      className="w-7 h-7 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
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
                      className="w-7 h-7 rounded-md border border-border hover:border-ink transition-colors duration-150 flex items-center justify-center"
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
                    className="text-xs text-ink-muted hover:text-ink underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-4 mono-num">
                <span className="text-sm font-body">Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <form onSubmit={handleProceed} className="flex flex-col gap-6">
              <div>
                <p className="eyebrow mb-3">Your details</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Full name"
                    value={buyer.name}
                    onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                    className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
                  />
                  <input
                    placeholder="Mobile number"
                    value={buyer.mobile}
                    onChange={(e) => setBuyer({ ...buyer, mobile: e.target.value })}
                    className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
                  />
                  <input
                    placeholder="ID number"
                    value={buyer.idNumber}
                    onChange={(e) => setBuyer({ ...buyer, idNumber: e.target.value })}
                    className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
                  />
                  <input
                    placeholder="Enrolment number"
                    value={buyer.enrolmentNumber}
                    onChange={(e) => setBuyer({ ...buyer, enrolmentNumber: e.target.value })}
                    className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
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
                      className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
                    />
                    <input
                      placeholder="Room number"
                      value={buyer.roomNumber}
                      onChange={(e) => setBuyer({ ...buyer, roomNumber: e.target.value })}
                      className="rounded-md border border-border px-3 py-2 text-sm bg-bg-raised focus:outline-none focus:border-ink transition-colors duration-150"
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
                className="px-6 py-2.5 rounded-md bg-ink text-on-ink text-sm font-medium hover:opacity-85 transition-opacity duration-150 self-start"
              >
                Checkout
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
