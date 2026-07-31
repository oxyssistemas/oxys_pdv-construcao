export const COMPANY_CATEGORIES = [
  "Loja de Varejo",
  "Mercado",
  "Supermercado",
  "Mini Mercado",
  "Atacado",
  "Distribuidora",
  "Pet Shop",
  "Agropecuária",
  "Farmácia",
  "Padaria",
  "Lanchonete",
  "Restaurante",
  "Pizzaria",
  "Açougue",
  "Auto Peças",
  "Oficina",
  "Loja de Roupas",
  "Loja de Calçados",
  "Loja de Cosméticos",
  "Loja de Informática",
  "Loja de Celulares",
  "Material de Construção",
  "Papelaria",
  "Sorveteria",
  "Ótica",
  "Adega",
  "Loja de Conveniência",
  "Floricultura",
  "Academia",
  "Clínica",
  "Consultório",
  "Prestadora de Serviços",
  "Loja de Móveis",
  "Loja de Eletrônicos",
  "Loja de Presentes",
  "Loja de Utilidades",
  "Assistência Técnica",
] as const;

export const COMPANY_PLANS = ["trial", "essencial", "profissional", "enterprise"] as const;

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  gerente: "Gerente",
  supervisor: "Supervisor",
  caixa: "Caixa",
  atendente: "Atendente",
  estoque: "Estoque",
  rh: "RH",
  financeiro: "Financeiro",
};

export const STATUS_LABELS: Record<string, string> = {
  ativa: "Ativa",
  bloqueada: "Bloqueada",
  suspensa: "Suspensa",
  trial: "Trial",
  cancelada: "Cancelada",
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
