export type OrderStatus =
  | "Nouveau"
  | "Confirmé"
  | "À produire"
  | "En production"
  | "Contrôle qualité"
  | "Prêt"
  | "Livré"
  | "Terminé"
  | "En attente"
  | "Bloqué"
  | "Annulé";
export type Priority = "Normale" | "Haute" | "Urgente";
export type StockStatus = "En stock" | "Stock faible" | "Critique" | "Rupture";

export interface Customer {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  type: "Particulier" | "Entreprise" | "Revendeur";
  orders: number;
  revenue: number;
  balance: number;
  initials: string;
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  category:
    | "DTF"
    | "Textile"
    | "Laser"
    | "Acrylique"
    | "Bois"
    | "Personnalisation"
    | "Accessoires";
  price: number;
  cost: number;
  stock: number;
  unit: string;
  machine: string;
  duration: string;
  color: string;
}

export interface Order {
  id: string;
  customer: string;
  product: string;
  quantity: number;
  total: number;
  paid: number;
  status: OrderStatus;
  priority: Priority;
  date: string;
  dueDate: string;
  operator: string;
  machine: string;
}

export interface ProductionTask {
  id: string;
  order: string;
  customer: string;
  product: string;
  quantity: number;
  machine: string;
  operator: string;
  priority: Priority;
  deadline: string;
  stage: "À produire" | "En production" | "Contrôle qualité" | "Terminé";
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimum: number;
  status: StockStatus;
  value: number;
  updated: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  presence: "Présent" | "Absent" | "Retard" | "Congé";
  hours: string;
  tasks: number;
  performance: number;
  salary: number;
  initials: string;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  status: "ACTIVE" | "MAINTENANCE" | "OFFLINE" | "ATTENTION";
  usage: number;
  lastMaintenance: string;
  nextMaintenance: string;
  production: number;
  incidents: number;
}

export interface Transaction {
  id: string;
  label: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  method: "Caisse" | "Banque" | "Mobile Money";
  date: string;
}
