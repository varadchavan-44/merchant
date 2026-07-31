import { redirect } from "next/navigation";

// Catalog is removed — home is the primary shopping surface now.
export default function CatalogRedirect() {
  redirect("/");
}
