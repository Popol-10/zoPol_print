import { useMemo, useState } from "react";
import { BadgeDollarSign, Download, Gem, RefreshCw } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import ico from "@/assets/material-icon-theme_pdf.png";
import ico1 from "@/assets/Frame 532.png";
import ico2 from "@/assets/Frame 696.png";
import ico3 from "@/assets/Frame 532 (1).png";


interface FinanceRow {
  id: string;
  date: string;
  amount: string;
  status: string;
  paymentMode: string;
}

const transactions: FinanceRow[] = [
  {
    id: "tx-1",
    date: "19/12/2025",
    amount: "500€",
    status: "Payé",
    paymentMode: "Carte bancaire",
  },
  {
    id: "tx-2",
    date: "05/06/2025",
    amount: "300€",
    status: "Payé",
    paymentMode: "Virement bancaire",
  },
  {
    id: "tx-3",
    date: "12/02/2025",
    amount: "450€",
    status: "Payé",
    paymentMode: "Carte bancaire",
  },
];

const FinanceGouvernance = () => {
  const [planName, setPlanName] = useState<"PREMIUM" | "PRO">("PREMIUM");
  const totalPaid = useMemo(
    () => transactions.reduce((sum, item) => sum + Number(item.amount.replace("€", "")), 0),
    []
  );

  const sanitizePdfText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()\\]/g, " ");

  const createPdfBlob = (lines: string[]) => {
    const escapedLines = lines.map((line) => sanitizePdfText(line));
    const textOps = escapedLines
      .map((line, index) => `${index === 0 ? "72 790 Td" : "0 -18 Td"} (${line}) Tj`)
      .join("\n");
    const stream = `BT\n/F1 12 Tf\n${textOps}\nET`;

    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
      `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    ];

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += obj;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const openPdf = (lines: string[]) => {
    const file = createPdfBlob(lines);
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const downloadPdf = (filename: string, lines: string[]) => {
    const file = createPdfBlob(lines);
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
    const csv = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const openTransactionPreview = (id: string) => {
    const tx = transactions.find((item) => item.id === id);
    if (!tx) return;
    openPdf([
      "SWEETHOME - APERCU TRANSACTION",
      "",
      `Date: ${tx.date}`,
      `Montant: ${tx.amount}`,
      `Statut: ${tx.status}`,
      `Mode de paiement: ${tx.paymentMode}`,
    ]);
  };

  const changePlan = () => {
    setPlanName((prev) => (prev === "PREMIUM" ? "PRO" : "PREMIUM"));
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="FINANCE ET GOUVERNANCE" />

        <section className="mx-auto w-full max-w-[1120px] space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              {/* <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#ff2d74] bg-[#ffdfea] text-[#ff2d74]">
                <BadgeDollarSign className="h-5 w-5" />
              </div> */}
              <img src={ico1} alt="" className="h-11 w-11" />

              <h3 className="mt-4 text-[20px] font-bold text-[#16161b]">Réservation</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] leading-tight text-[#33333b]">Nombre de reservations sur période</p>
                  <p className="text-[20px] font-semibold text-[#111116]">5</p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] leading-tight text-[#33333b]">Total des brut inclus</p>
                  <p className="text-[20px] font-bold leading-none text-[#111116]">3500€</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    "reservations.csv",
                    ["Periode", "Nombre reservations", "Total brut inclus"],
                    [["2025", 5, "3500€"]]
                  )
                }
                className="mt-6 h-10 min-w-[170px] rounded-xl bg-[#23b03f] px-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1b9735]"
              >
                Export CSV
              </button>
            </article>

            <article className="rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              {/* <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#177cf1] bg-[#d8eaff] text-[#177cf1]">
                <BadgeDollarSign className="h-5 w-5" />
              </div> */}
              <img src={ico2} alt="" className="h-11 w-11" />
              <h3 className="mt-4 text-[20px] font-bold text-[#16161b]">Paiement</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] text-[#33333b]">Paiement effectué</p>
                  <p className="text-[20px] font-bold leading-none text-[#111116]">25</p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] text-[#33333b]">Paiement échoué</p>
                  <p className="text-[15px] font-bold leading-none text-[#111116]">1</p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] text-[#33333b]">Paiement reçu</p>
                  <p className="text-[20px] font-bold leading-none text-[#111116]">15500€</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    "paiements-sage-ac.csv",
                    ["Paiement effectue", "Paiement echoue", "Paiement recu"],
                    [[25, 1, "15500€"]]
                  )
                }
                className="mt-6 h-10 min-w-[190px] rounded-xl bg-[#177cf1] px-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f6bd1]"
              >
                Format Sage/AC
              </button>
            </article>

            <article className="rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              {/* <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#b49c12] bg-[#f4efcc] text-[#b49c12]">
                <RefreshCw className="h-5 w-5" />
              </div> */}
              <img src={ico3} alt="" className="h-11 w-11"/>
              <h3 className="mt-4 text-[20px] font-bold text-[#16161b]">Remboursements</h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] text-[#33333b]">Nombre de remboursement</p>
                  <p className="text-[20px] font-bold leading-none text-[#111116]">5</p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-[15px] text-[#33333b]">Montant total</p>
                  <p className="text-[20px] font-bold leading-none text-[#111116]">200€</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    "remboursements.csv",
                    ["Nombre remboursements", "Montant total"],
                    [[5, "200€"]]
                  )
                }
                className="mt-6 h-10 min-w-[170px] rounded-xl bg-[#23b03f] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#1b9735]"
              >
                Export CSV
              </button>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2.3fr_1.1fr]">
            <section className="rounded-[18px] border border-[#d4d4da] bg-[#fff] p-2.5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[300px]">
                  <thead>
                    <tr className="border-b border-[#d7d7dd] text-left">
                      <th className="px-2 py-2.5 text-[15px] font-semibold text-[#1b1b21]">Date</th>
                      <th className="px-2 py-2.5 text-[15px] font-semibold text-[#1b1b21]">Montant</th>
                      <th className="px-2 py-2.5 text-[15px] font-semibold text-[#1b1b21]">Statut</th>
                      <th className="px-2 py-2.5 text-[15px] font-semibold text-[#1b1b21]">Mode de paiement</th>
                      <th className="px-2 py-2.5 text-[15px] font-semibold text-[#1b1b21]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((row) => (
                      <tr key={row.id}>
                        <td className="px-2 py-3 text-[15px] font-semibold text-[#1f1f26]">{row.date}</td>
                        <td className="px-2 py-3 text-[15px] font-semibold text-[#1f1f26]">{row.amount}</td>
                        <td className="px-2 py-3 text-[15px] font-semibold text-[#1f1f26]">{row.status}</td>
                        <td className="px-2 py-3 text-[15px] font-semibold text-[#1f1f26]">{row.paymentMode}</td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => openTransactionPreview(row.id)}
                            className="h-9 min-w-[86px] rounded-md bg-[#1f1f24] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-black"
                          >
                            Aperçu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm font-medium text-[#4b4b53]">Total encaissé : {totalPaid}€</p>
            </section>

            <aside className="rounded-[18px] bg-[#1d1d21] p-5 text-white shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)]">
              <p className="text-[15px] text-white/90">Mon plan acuel</p>
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-[20px] font-semibold leading-none">{planName}</h3>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#ff1f72]">
                  <Gem className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-2 h-px bg-white/20" />

              <p className="mt-2 text-[13px] italic">Nombre de logements autorisés : <span className="font-semibold not-italic">illimité</span></p>
              <p className="mt-1.5 text-[13px] italic">Préstataire : <span className="font-semibold not-italic">Tout</span></p>
              <p className="mt-1 text-[13px] italic">Prix mensuel : <span className="font-semibold not-italic">320€</span></p>

              <p className="mt-4 text-[13px] italic">Prochaine facturation : <span className="font-semibold not-italic">30 Fevrier 2024</span></p>

              <button
                type="button"
                onClick={changePlan}
                className="mt-4 h-11 w-full rounded-xl bg-[#ff1f72] text-[15px] font-semibold text-white transition-colors hover:bg-[#e11263]"
              >
                Changer de plan
              </button>
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:grid-cols-[1.2fr_1fr] lg:p-7">
            <div>
              <h3 className="text-[15px] font-bold uppercase leading-tight text-[#141419]">RÈGLES REMBOURSEMENT</h3>
              <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-[#24242c]">
                Gorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.
              </p>
            </div>

            <div className="space-y-4 lg:pt-2">
              <button
                type="button"
                onClick={() =>
                  openPdf([
                    "SWEETHOME - REGLES REMBOURSEMENT",
                    "",
                    "Gorem ipsum dolor sit amet, consectetur adipiscing elit.",
                    "Nunc vulputate libero et velit interdum, ac aliquet odio mattis.",
                  ])
                }
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#cfcfd6] bg-[#fbfbfc] text-[15px] font-semibold text-[#191920] transition-colors hover:bg-[#f1f1f4]"
              >
                Voir un aperçu PDF
                <img src={ico} className="h-7 w-7 text-[#eb1111]" />
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadPdf("regles-remboursement.pdf", [
                    "SWEETHOME - REGLES REMBOURSEMENT",
                    "",
                    "Gorem ipsum dolor sit amet, consectetur adipiscing elit.",
                    "Nunc vulputate libero et velit interdum, ac aliquet odio mattis.",
                  ])
                }
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#177cf1] text-[15px] font-semibold text-white transition-colors hover:bg-[#0f6bd1]"
              >
                Télécharger directement
                <Download className="h-6 w-6" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FinanceGouvernance;
