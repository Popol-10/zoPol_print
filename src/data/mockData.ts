import type {
  Customer,
  Employee,
  Machine,
  Order,
  Product,
  ProductionTask,
  StockItem,
  Transaction,
} from "@/types/erp";

const names = [
  "Aina Rakoto",
  "Miora Andria",
  "Tiana Randria",
  "Mamy Design",
  "Kanto Création",
  "Soa Events",
  "Niry Ravel",
  "Vahatra Studio",
  "Lova Textiles",
  "Mada Print",
  "Hery Razaf",
  "Tselatra Co.",
  "Anjara Plus",
  "Fara Boutique",
  "Toky Pro",
  "Sariaka Mode",
  "Mina Concept",
  "Noro Art",
  "Tana Sport",
  "Mahery Group",
];
const companies = [
  "Atelier Aina",
  "Miora Créations",
  "Tiana & Co",
  "Mamy Design",
  "Kanto Création",
  "Soa Events",
  "Ravel Studio",
  "Vahatra Studio",
  "Lova Textiles",
  "Mada Print",
];

export const customers: Customer[] = names.map((name, index) => ({
  id: `CL-${String(index + 1).padStart(3, "0")}`,
  name,
  company: companies[index % companies.length],
  phone: `+261 3${2 + (index % 3)} ${String(10000000 + index * 39481).slice(0, 2)} ${String(10000000 + index * 39481).slice(2, 5)} ${String(10000000 + index * 39481).slice(5)}`,
  email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@example.mg`,
  city: ["Antananarivo", "Antsirabe", "Toamasina", "Fianarantsoa"][index % 4],
  type: (["Particulier", "Entreprise", "Revendeur"] as const)[index % 3],
  orders: 1 + ((index * 3) % 18),
  revenue: 180000 + index * 93500,
  balance: index % 4 === 0 ? 45000 + index * 10000 : 0,
  initials: name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2),
}));

const productSeeds: Array<
  [string, Product["category"], number, number, string, string]
> = [
  ["T-shirt DTF personnalisé", "DTF", 35000, 18500, "Presse à chaud", "8 min"],
  ["Planche logos DTF A3", "DTF", 28000, 13500, "DTF Pro 60", "12 min"],
  ["Hoodie imprimé", "Textile", 75000, 42000, "Presse à chaud", "15 min"],
  ["Gourde gravée inox", "Laser", 48000, 21000, "Laser CO₂ 80W", "14 min"],
  ["Porte-clés acrylique", "Acrylique", 8500, 2600, "Laser CO₂ 80W", "4 min"],
  ["Plaque bois gravée", "Bois", 32000, 11200, "Laser CO₂ 80W", "18 min"],
  [
    "Mug personnalisé",
    "Personnalisation",
    28000,
    13000,
    "Presse à chaud",
    "10 min",
  ],
  ["Tote bag imprimé", "Textile", 22000, 9800, "Presse à chaud", "9 min"],
  ["Stickers découpés", "Accessoires", 15000, 4200, "Laser CO₂ 80W", "7 min"],
];
const colors = [
  "#fce7f3",
  "#dbeafe",
  "#ede9fe",
  "#dcfce7",
  "#fef3c7",
  "#ffe4e6",
];
export const products: Product[] = Array.from({ length: 30 }, (_, index) => {
  const seed = productSeeds[index % productSeeds.length];
  return {
    id: `PR-${String(index + 1).padStart(3, "0")}`,
    name: index < 10 ? seed[0] : `${seed[0]} ${index + 1}`,
    reference: `ART-${String(101 + index).padStart(3, "0")}`,
    category: seed[1],
    price: seed[2] + Math.floor(index / 10) * 2000,
    cost: seed[3] + Math.floor(index / 10) * 1000,
    stock: (index * 7 + 9) % 78,
    unit: "unité",
    machine: seed[4],
    duration: seed[5],
    color: colors[index % colors.length],
  };
});

const orderStatuses: Order["status"][] = [
  "Nouveau",
  "Confirmé",
  "À produire",
  "En production",
  "Contrôle qualité",
  "Prêt",
  "Livré",
  "Terminé",
  "En attente",
  "Bloqué",
];
export const orders: Order[] = Array.from({ length: 30 }, (_, index) => {
  const product = products[index % 12];
  const quantity = 2 + ((index * 3) % 24);
  const total = product.price * quantity;
  return {
    id: `CMD-${String(2401 + index).padStart(4, "0")}`,
    customer: customers[index % customers.length].name,
    product: product.name,
    quantity,
    total,
    paid: index % 3 === 0 ? Math.round(total * 0.5) : total,
    status: orderStatuses[index % orderStatuses.length],
    priority: (["Normale", "Haute", "Urgente"] as const)[
      index % 7 === 0 ? 2 : index % 4 === 0 ? 1 : 0
    ],
    date: `${String(2 + (index % 23)).padStart(2, "0")} sept. 2026`,
    dueDate: `${String(12 + (index % 14)).padStart(2, "0")} sept.`,
    operator: ["Fanja", "Hery", "Tovo", "Miora"][index % 4],
    machine: product.machine,
  };
});

const taskStages: ProductionTask["stage"][] = [
  "À produire",
  "En production",
  "Contrôle qualité",
  "Terminé",
];
export const productionTasks: ProductionTask[] = Array.from(
  { length: 20 },
  (_, index) => {
    const order = orders[index + 2];
    return {
      id: `TASK-${index + 1}`,
      order: order.id,
      customer: order.customer,
      product: order.product,
      quantity: order.quantity,
      machine: order.machine,
      operator: order.operator,
      priority: order.priority,
      deadline: `${String(12 + (index % 9)).padStart(2, "0")} sept., ${9 + (index % 7)}h00`,
      stage: taskStages[index % 4],
    };
  },
);

const stockSeeds: Array<
  [string, string, number, string, number, StockItem["status"], number]
> = [
  [
    "Film DTF Premium 60 cm",
    "Consommables",
    3,
    "rouleaux",
    5,
    "Critique",
    144000,
  ],
  ["Encre blanche DTF", "Consommables", 7, "litres", 5, "En stock", 294000],
  ["Poudre adhésive", "Consommables", 2, "kg", 4, "Stock faible", 64000],
  ["T-shirt blanc S", "Textile", 28, "unités", 15, "En stock", 280000],
  ["T-shirt noir M", "Textile", 9, "unités", 15, "Stock faible", 99000],
  ["Mug blanc 11 oz", "Supports", 0, "unités", 12, "Rupture", 0],
  [
    "Acrylique transparent 3 mm",
    "Matières",
    14,
    "plaques",
    8,
    "En stock",
    420000,
  ],
  ["Contreplaqué 4 mm", "Matières", 5, "plaques", 6, "Critique", 225000],
  ["Gourde inox", "Supports", 18, "unités", 10, "En stock", 396000],
  ["Tote bag naturel", "Textile", 22, "unités", 12, "En stock", 154000],
  [
    "Papier de protection",
    "Consommables",
    11,
    "rouleaux",
    5,
    "En stock",
    88000,
  ],
  ["Aimants ronds", "Accessoires", 4, "lots", 6, "Stock faible", 24000],
  ["Plaques MDF", "Matières", 17, "plaques", 8, "En stock", 323000],
  ["Boîtes cadeau", "Packaging", 8, "unités", 10, "Critique", 56000],
  [
    "Vinyle thermocollant",
    "Consommables",
    10,
    "rouleaux",
    5,
    "En stock",
    220000,
  ],
];
export const stockItems: StockItem[] = stockSeeds.map((item, index) => ({
  id: `STK-${index + 1}`,
  name: item[0],
  category: item[1],
  quantity: item[2],
  unit: item[3],
  minimum: item[4],
  status: item[5],
  value: item[6],
  updated: `Aujourd’hui, ${8 + (index % 7)}h${index % 2 ? "30" : "00"}`,
}));

export const employees: Employee[] = [
  ["Fanja Ranaivo", "Responsable production"],
  ["Hery Rakoto", "Opérateur DTF"],
  ["Tovo Rabe", "Opérateur laser"],
  ["Miora Andry", "Commerciale"],
  ["Aina Rasoanaivo", "Graphiste"],
  ["Sitraka Randria", "Contrôle qualité"],
  ["Lova Rakotoniaina", "Magasinier"],
  ["Noro Andriam", "Comptable"],
  ["Tahina Ravel", "Opératrice presse"],
  ["Mahery Rakoto", "Livreur"],
  ["Soa Rija", "Assistante commerciale"],
  ["Kanto Razaf", "Technicienne"],
  ["Tiana Rabe", "Designer"],
  ["Fara Andria", "Acheteuse"],
  ["Mamy Rakoto", "Directeur"],
].map(([name, role], index) => ({
  id: `EMP-${index + 1}`,
  name,
  role,
  presence: (["Présent", "Présent", "Présent", "Retard", "Congé"] as const)[
    index % 5
  ],
  hours: `${index % 5 === 3 ? "6h45" : "8h00"}`,
  tasks: 2 + (index % 7),
  performance: 72 + ((index * 3) % 26),
  salary: 650000 + (index % 5) * 90000,
  initials: name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2),
}));

export const machines: Machine[] = [
  {
    id: "MAC-01",
    name: "DTF Pro 60",
    type: "Imprimante DTF",
    status: "ACTIVE",
    usage: 78,
    lastMaintenance: "02 sept. 2026",
    nextMaintenance: "02 oct. 2026",
    production: 128,
    incidents: 0,
  },
  {
    id: "MAC-02",
    name: "Laser CO₂ 80W",
    type: "Découpe & gravure",
    status: "ATTENTION",
    usage: 91,
    lastMaintenance: "16 août 2026",
    nextMaintenance: "16 sept. 2026",
    production: 94,
    incidents: 1,
  },
  {
    id: "MAC-03",
    name: "Presse à chaud 40×60",
    type: "Presse à chaud",
    status: "ACTIVE",
    usage: 52,
    lastMaintenance: "29 août 2026",
    nextMaintenance: "29 nov. 2026",
    production: 186,
    incidents: 0,
  },
  {
    id: "MAC-04",
    name: "Presse mugs",
    type: "Presse à mugs",
    status: "MAINTENANCE",
    usage: 24,
    lastMaintenance: "10 sept. 2026",
    nextMaintenance: "18 sept. 2026",
    production: 42,
    incidents: 2,
  },
  {
    id: "MAC-05",
    name: "Plotter de découpe",
    type: "Découpe vinyle",
    status: "OFFLINE",
    usage: 0,
    lastMaintenance: "03 juil. 2026",
    nextMaintenance: "À planifier",
    production: 0,
    incidents: 3,
  },
];

export const transactions: Transaction[] = Array.from(
  { length: 20 },
  (_, index) => ({
    id: `TX-${index + 1}`,
    label:
      index % 3 === 0
        ? "Achat consommables DTF"
        : index % 3 === 1
          ? `Paiement ${orders[index].id}`
          : "Frais de livraison",
    category:
      index % 3 === 1 ? "Vente" : index % 3 === 0 ? "Achats" : "Logistique",
    amount: 48000 + index * 33500,
    type: index % 3 === 1 ? "income" : "expense",
    method: (["Caisse", "Banque", "Mobile Money"] as const)[index % 3],
    date: `${String(10 - (index % 9)).padStart(2, "0")} sept. 2026`,
  }),
);

export const revenueSeries = [
  { label: "Avr", revenue: 7800000, expense: 4100000, profit: 3700000 },
  { label: "Mai", revenue: 9200000, expense: 4900000, profit: 4300000 },
  { label: "Juin", revenue: 8600000, expense: 4300000, profit: 4300000 },
  { label: "Juil", revenue: 10400000, expense: 5100000, profit: 5300000 },
  { label: "Août", revenue: 11900000, expense: 6100000, profit: 5800000 },
  { label: "Sept", revenue: 12850000, expense: 5740000, profit: 7110000 },
];

export const categorySales = [
  { name: "DTF", value: 38, color: "#ff226d" },
  { name: "Textile", value: 24, color: "#4f8df7" },
  { name: "Laser", value: 21, color: "#8b5cf6" },
  { name: "Personnalisation", value: 17, color: "#f59e0b" },
];
