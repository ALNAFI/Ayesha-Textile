import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FilePreviewView } from "@/components/files/FilePreviewView";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { getFilePreview } from "@/lib/files/preview";
import { getFilesListSnapshot } from "@/lib/files/list";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getFilesListSnapshot(false);
  const item = snapshot.items.find((entry) => entry.id === id);
  return {
    title: item?.fileName || "File",
  };
}

export const dynamic = "force-dynamic";

export default async function FileDetailPage({ params }: PageProps) {
  const { id } = await params;
  const list = await getFilesListSnapshot(false);
  const listed = list.items.find((entry) => entry.id === id);

  if (listed?.kind === "customer") {
    redirect(`/customers/${listed.id}`);
  }

  const preview = await getFilePreview(id, false);

  if (preview.kind === "customer") {
    redirect(`/customers/${preview.id}`);
  }

  return (
    <>
      {preview.available ? (
        <RecordRecentOpen
          id={preview.id}
          kind="other"
          title={preview.fileName}
          subtitle="Other Excel file"
          href={preview.href}
        />
      ) : null}
      <FilePreviewView initialData={preview} />
    </>
  );
}
