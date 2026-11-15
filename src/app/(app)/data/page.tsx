import type { Metadata } from "next";
import { DataView } from "@/components/data/DataView";
import { getFilesListSnapshot } from "@/lib/files/list";

export const metadata: Metadata = {
  title: "Data",
};

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const initialData = await getFilesListSnapshot(false);
  return <DataView initialData={initialData} />;
}
