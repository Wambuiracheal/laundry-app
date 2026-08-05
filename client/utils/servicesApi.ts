import { getJson } from "@/utils/apiClient";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price_type: string | null;
  base_price: string | null;
  created_at: string;
};

export async function listServices(): Promise<Service[]> {
  return getJson<Service[]>("/services");
}
