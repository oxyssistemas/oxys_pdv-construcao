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

/** Mesma escala usada nas políticas de RLS (public.role_rank). */
export const ROLE_RANK: Record<string, number> = {
  owner: 100,
  gerente: 80,
  supervisor: 60,
  financeiro: 50,
  rh: 50,
  estoque: 40,
  caixa: 30,
  atendente: 20,
};

export const ROLE_SCOPE: Record<string, string> = {
  gerente: "Acesso total da empresa, incluindo equipe e cadastros",
  supervisor: "Operação completa e cadastro de fornecedores",
  financeiro: "Vendas, caixa e clientes",
  rh: "Equipe e dados administrativos",
  estoque: "Produtos, categorias e movimentações de estoque",
  caixa: "PDV, caixa, vendas e clientes",
  atendente: "Consulta de vendas e produtos da empresa",
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
