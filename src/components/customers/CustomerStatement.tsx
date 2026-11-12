import { formatBDT } from "@/lib/dashboard/format";
import type { CustomerDetailSnapshot } from "@/lib/customers/detail-types";
import { siteConfig } from "@/config/site";

type CustomerStatementProps = {
  detail: CustomerDetailSnapshot;
};

function money(value: number | null) {
  if (value == null) return "Unavailable";
  return formatBDT(value);
}

export function CustomerStatement({ detail }: CustomerStatementProps) {
  const statementDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <article className="customer-statement hidden print:block" aria-hidden="true">
      <header className="border-b border-black/15 pb-4">
        <p className="text-xs tracking-[0.18em] uppercase">{siteConfig.name}</p>
        <h1 className="mt-2 text-2xl font-semibold">Customer statement</h1>
        <p className="mt-2 text-sm">Statement date {statementDate}</p>
      </header>

      <section className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <p>
          <span className="text-black/60">Customer</span>
          <br />
          <strong>{detail.customerName || "—"}</strong>
        </p>
        <p>
          <span className="text-black/60">Location</span>
          <br />
          <strong>{detail.location || "—"}</strong>
        </p>
        <p>
          <span className="text-black/60">File</span>
          <br />
          {detail.fileName || "—"}
        </p>
        <p>
          <span className="text-black/60">Last modified</span>
          <br />
          {detail.lastModified}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-4 gap-3 text-sm">
        <p>
          Opening
          <br />
          <strong>{money(detail.openingBalance)}</strong>
        </p>
        <p>
          Credit
          <br />
          <strong>{money(detail.totalCredit)}</strong>
        </p>
        <p>
          Debit
          <br />
          <strong>{money(detail.totalDebit)}</strong>
        </p>
        <p>
          Closing
          <br />
          <strong>{money(detail.balance)}</strong>
        </p>
      </section>

      <table className="mt-6 w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-2 pr-2 font-medium">Date</th>
            <th className="py-2 pr-2 font-medium">Description</th>
            <th className="py-2 pr-2 font-medium">File No</th>
            <th className="py-2 pr-2 text-right font-medium">Debit</th>
            <th className="py-2 pr-2 text-right font-medium">Credit</th>
            <th className="py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {detail.transactions.map((item) => (
            <tr key={item.id} className="border-b border-black/10">
              <td className="py-1.5 pr-2 align-top">{item.date}</td>
              <td className="py-1.5 pr-2 align-top">{item.description}</td>
              <td className="py-1.5 pr-2 align-top">{item.fileNo}</td>
              <td className="py-1.5 pr-2 text-right align-top tabular-nums">
                {item.debit ? formatBDT(item.debit) : "—"}
              </td>
              <td className="py-1.5 pr-2 text-right align-top tabular-nums">
                {item.credit ? formatBDT(item.credit) : "—"}
              </td>
              <td className="py-1.5 text-right align-top tabular-nums">
                {item.balance == null ? "—" : formatBDT(item.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
