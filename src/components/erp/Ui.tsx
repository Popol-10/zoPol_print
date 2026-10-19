import type { ElementType, ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Search,
} from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ElementType;
  className?: string;
  disabled?: boolean;
}

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  icon: ElementType;
  tone?: "pink" | "blue" | "violet" | "green" | "amber";
  detail?: string;
}

const toneStyles = {
  pink: "bg-rose-50 text-[#ff226d] dark:bg-rose-950/35",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/35",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/35",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/35",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ff226d]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[27px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-nowrap">
          {action}
        </div>
      )}
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon: Icon,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps & { type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff226d] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_20px_-12px_rgba(255,34,109,.85)] transition hover:-translate-y-0.5 hover:bg-[#e91f63] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {Icon && <Icon className="h-[18px] w-[18px]" />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  icon: Icon,
  className = "",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-[#ffb0ca] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
    >
      {Icon && <Icon className="h-[18px] w-[18px]" />}
      {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone = "pink",
  detail,
}: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <article className="surface-card group min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-extrabold ${
              isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-5 truncate text-[13px] font-bold text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[24px]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {detail ?? "vs période précédente"}
      </p>
    </article>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-[#ff9fbe] focus-within:ring-4 focus-within:ring-rose-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-rose-950 sm:min-w-[230px] md:flex-none">
      <Search className="h-[18px] w-[18px] shrink-0" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
      />
    </label>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-[13px]">
            {description}
          </p>
        )}
      </div>
      {action ?? (
        <button className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-[#ff226d] hover:underline sm:text-[13px]">
          Voir tout <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
