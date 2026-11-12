import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export const metadata: Metadata = {
  title: "All Files",
};

export default function FilesPage() {
  return (
    <PagePlaceholder
      title="All Files"
      description="Drive workbooks will be listed here after Google Drive integration. This page is a route placeholder."
    />
  );
}
