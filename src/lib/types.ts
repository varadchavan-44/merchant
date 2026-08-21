export type OrderStatus =
  | "pending_verification"
  | "verified"
  | "locked_for_print"
  | "ready_for_pickup"
  | "picked_up"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export type SizeStatus = "collecting" | "locked_for_print" | "failed" | "extended";

export interface ProductSize {
  id: string;
  size_label: string;
  commit_threshold: number;
  commit_count: number;
  status: SizeStatus;
}

export interface ProductImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_paise: number;
  is_customizable: boolean;
  requires_number: boolean;
  sizes: ProductSize[];
  images: ProductImage[];
}

export interface UnitCustomization {
  name: string;
  number?: string;
}

export interface DropConfig {
  cutoff_at: string;
  extended: boolean;
  upi_id: string | null;
  qr_image_url: string | null;
}

export interface CartItem {
  lineId: string;
  productId: string;
  productName: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
  unitPricePaise: number;
  // One entry per unit, only present for customizable products.
  customizations?: UnitCustomization[];
}

export interface BuyerDetails {
  name: string;
  mobile: string;
  idNumber: string;
  enrolmentNumber: string;
  dayScholar: boolean;
  hostelName: string;
  roomNumber: string;
}
