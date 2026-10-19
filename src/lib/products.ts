import { apiRequest, withBearer } from "@/lib/api";

export type ProductCategory =
  | "DTF"
  | "Textile"
  | "Laser"
  | "Acrylique"
  | "Bois"
  | "Personnalisation"
  | "Accessoires";

export interface ProductRecord {
  id: string;
  name: string;
  reference: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  machine: string;
  duration: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<ProductRecord, "id" | "createdAt" | "updatedAt">;

export const productsApi = {
  list: (accessToken: string) =>
    apiRequest<ProductRecord[]>("/products", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: ProductInput) =>
    apiRequest<ProductRecord>("/products", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  update: (accessToken: string, productId: string, input: Partial<ProductInput>) =>
    apiRequest<ProductRecord>(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  archive: (accessToken: string, productId: string) =>
    apiRequest<void>(`/products/${productId}`, {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};
