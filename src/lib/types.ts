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

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_paise: number;
  sizes: ProductSize[];
}

export interface DropConfig {
  cutoff_at: string;
  extended: boolean;
}
