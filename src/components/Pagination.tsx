import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Pagination component matching the design with pink active page and arrow buttons */
const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2);
      if (currentPage > 3) pages.push("...");
      if (currentPage > 2 && currentPage < totalPages - 1) pages.push(currentPage);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1, totalPages);
    }
    return [...new Set(pages)];
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {/* Prev button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
        aria-label="Page précédente"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) =>
        typeof page === "string" ? (
          <span key={`dots-${idx}`} className="text-sm text-muted-foreground px-1">
            {page}
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
              page === currentPage
                ? "text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        aria-label="Page suivante"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
