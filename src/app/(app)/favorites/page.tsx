import type { Metadata } from "next";
import { FavoritesView } from "@/components/dashboard/FavoritesView";
import { getFavoriteCatalog } from "@/lib/favorites/catalog";

export const metadata: Metadata = {
  title: "Favorites",
};

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const catalog = await getFavoriteCatalog();

  return (
    <FavoritesView
      catalog={catalog.items}
      catalogAvailable={catalog.available}
      catalogMessage={catalog.message}
    />
  );
}
