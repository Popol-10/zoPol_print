import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import LogementCard from "@/components/LogementCard";
import { loadLogements } from "@/lib/logementsStore";

const ITEMS_PER_PAGE = 6;

const buildPagination = (currentPage: number, totalPages: number): Array<number | "..."> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

const Logements = () => {
  const [logements, setLogements] = useState(() => loadLogements());
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(logements.length / ITEMS_PER_PAGE));

  const paginatedLogements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return logements.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, logements]);

  const paginationItems = useMemo(
    () => buildPagination(currentPage, totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    setLogements(loadLogements());
  }, []);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, Math.ceil(logements.length / ITEMS_PER_PAGE))));
  }, [logements.length]);

  const goToPreviousPage = () => setCurrentPage((page) => Math.max(1, page - 1));
  const goToNextPage = () => setCurrentPage((page) => Math.min(totalPages, page + 1));

  return (
    <div className="page-shell flex min-h-screen bg-[#edeef7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="LOGEMENT" />

          <div className="mt-7 flex items-center justify-end">
            <Link
              to="/logements/create"
              state={{ mode: "create" }}
              className="flex items-center gap-2 rounded-xl bg-[#007BFF] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Créer un logement
            </Link>
          </div>

          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedLogements.map((logement) => (
              <LogementCard key={logement.id} {...logement} />
            ))}
          </section>

          {logements.length === 0 ? (
            <p className="mt-8 text-center text-[15px] text-[#5a5a62]">Aucun logement cree pour le moment.</p>
          ) : null}

          {totalPages > 1 && (
            <nav className="mt-10 mb-4 flex items-center justify-center gap-3 text-[20px] font-medium text-[#1f1f1f]">
            <button
              type="button"
              aria-label="Page précédente"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-full border border-[#2e2e2e] text-[#2e2e2e] flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {paginationItems.map((item, index) =>
              item === "..." ? (
                <span key={`ellipsis-${index}`}>...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                  className={item === currentPage ? "text-[#ff1f72]" : ""}
                  aria-label={`Aller à la page ${item}`}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              aria-label="Page suivante"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-full bg-[#ff1f72] text-white flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
};

export default Logements;
