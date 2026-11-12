import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata: Metadata = {
  title: "Favorites",
};

export default function FavoritesPage() {
  return (
    <PagePlaceholder
      title="Favorites"
      description="Pinned files and customers will appear here later. Favorites storage is not implemented yet."
    />
  );
}
