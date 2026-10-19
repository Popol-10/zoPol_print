import ico1 from "../assets/icoRevmoi.png";
import ico2 from "../assets/icoResAct.png";
import ico3 from "../assets/icotauOc.png";
import ico4 from "../assets/icopro.png";
/** Individual stat card data */
interface StatCard {
  iconSrc: string;
  iconBg: string;
  label: string;
  value: string;
  subtext?: string;
}
const stats: StatCard[] = [
  {
    iconSrc: ico1,
    iconBg: "bg-pink-100",
    label: "Revenu du mois",
    value: "3400€",
  },
  {
    iconSrc: ico2,
    iconBg: "bg-green-100",
    label: "Réservations actives",
    value: "15",
  },
  {
    iconSrc: ico3,
    iconBg: "bg-blue-100",
    label: "Taux d'occupation",
    value: "80%",
  },
  {
    iconSrc: ico4,
    iconBg: "bg-gray-100",
    label: "Prochain check-in",
    value: "",
    subtext: "Demain à 11h35 (20 Septembre 2025)",
  },
];

/** Dashboard KPI stat cards row */
const StatsCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card rounded-2xl border border-border p-5 lg:p-6 flex flex-col gap-3"
        >
          {/* Icon */}
          <div className={`h-11 w-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
            <img src={stat.iconSrc} alt="" className="h-5 w-5 object-contain" />
          </div>

          {/* Label */}
          <span className="text-sm font-semibold text-foreground mt-1">{stat.label}</span>

          {/* Value or subtext */}
          {stat.value ? (
            <span className="text-3xl lg:text-4xl font-extrabold text-foreground">{stat.value}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{stat.subtext}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
