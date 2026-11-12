import type { Metadata } from "next";
import { FilesView } from "@/components/files/FilesView";
import { getFilesListSnapshot } from "@/lib/files/list";

export const metadata: Metadata = {
  title: "All Files",
};

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const initialData = await getFilesListSnapshot(false);
  return <FilesView initialData={initialData} />;
}
