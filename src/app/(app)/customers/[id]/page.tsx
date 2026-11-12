import type { Metadata } from "next";
import { CustomerDetailView } from "@/components/customers/CustomerDetailView";
import { RecordRecentOpen } from "@/components/shared/RecordRecentOpen";
import { getCustomerDetail } from "@/lib/customers/detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getCustomerDetail(id, false);
  return {
    title: detail.customerName || "Customer",
  };
}

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getCustomerDetail(id, false);

  return (
    <>
      {detail.available && detail.customerName ? (
        <RecordRecentOpen
          id={detail.id}
          kind="customer"
          title={detail.customerName}
          subtitle={detail.location}
          href={detail.href}
        />
      ) : null}
      <CustomerDetailView initialData={detail} />
    </>
  );
}
