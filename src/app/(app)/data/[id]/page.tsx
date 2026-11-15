import type { Metadata } from "next";
import { DataEntryView } from "@/components/data/DataEntryView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Add Data",
};

export const dynamic = "force-dynamic";

export default async function DataEntryPage({ params }: PageProps) {
  const { id } = await params;
  return <DataEntryView fileId={id} />;
}
