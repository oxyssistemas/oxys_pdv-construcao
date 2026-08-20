# 🛒 SaaS PDV

Sistema completo de **Ponto de Venda (PDV) e gestão empresarial**, desenvolvido para centralizar vendas, produtos, estoque, caixa, clientes, fornecedores e informações financeiras em uma única plataforma.

O projeto foi desenvolvido com foco em **simplicidade, velocidade, segurança e escalabilidade**, permitindo que diferentes tipos de negócios utilizem a plataforma de acordo com suas necessidades.

---

## 🚀 Sobre o Projeto

O **SaaS PDV** é uma plataforma baseada no modelo **Software as a Service (SaaS)**, permitindo que diferentes empresas utilizem o sistema de forma independente, com seus próprios usuários, produtos, vendas e informações.

A solução foi pensada para atender pequenos e médios negócios que precisam de uma ferramenta moderna para controlar sua operação.

### 🎯 Objetivos

* Centralizar a operação da empresa
* Facilitar o processo de vendas
* Controlar produtos e estoque
* Gerenciar clientes e fornecedores
* Controlar entradas e saídas
* Administrar o caixa
* Acompanhar resultados financeiros
* Gerar relatórios gerenciais
* Permitir múltiplos usuários e níveis de acesso
* Criar uma plataforma escalável para diferentes segmentos

---

## ✨ Principais Funcionalidades

### 🖥️ Ponto de Venda

* Abertura de vendas
* Busca de produtos
* Leitor de código de barras
* Inclusão e remoção de itens
* Alteração de quantidade
* Descontos
* Acréscimos
* Diferentes formas de pagamento
* Cancelamento de vendas
* Histórico de vendas
* Impressão de comprovantes

### 📦 Produtos

* Cadastro de produtos
* Categorias
* Código de barras
* SKU
* Preço de custo
* Preço de venda
* Margem de lucro
* Controle de estoque
* Estoque mínimo
* Produtos ativos/inativos

### 📊 Estoque

* Entrada de produtos
* Saída de produtos
* Ajuste de estoque
* Transferências
* Histórico de movimentações
* Controle de estoque mínimo
* Alertas de produtos com estoque baixo
* Inventário

### 👥 Clientes

* Cadastro de clientes
* Histórico de compras
* Dados de contato
* Endereço
* CPF/CNPJ
* Limite de crédito
* Controle de relacionamento

### 🚚 Fornecedores

* Cadastro de fornecedores
* Produtos fornecidos
* Histórico de compras
* Dados de contato
* Controle de informações comerciais

### 💰 Caixa

* Abertura de caixa
* Fechamento de caixa
* Sangria
* Suprimento
* Entradas
* Saídas
* Conferência de valores
* Histórico de movimentações

### 💳 Financeiro

* Contas a pagar
* Contas a receber
* Fluxo de caixa
* Categorias financeiras
* Controle de despesas
* Controle de receitas
* Relatórios financeiros

### 📈 Dashboard

Painel central com indicadores importantes do negócio:

* Faturamento
* Número de vendas
* Ticket médio
* Produtos mais vendidos
* Lucro estimado
* Estoque
* Contas a pagar
* Contas a receber
* Desempenho por período

### 👑 Painel Administrativo

Área destinada ao gerenciamento completo da empresa:

* Usuários
* Funcionários
* Produtos
* Clientes
* Fornecedores
* Estoque
* Financeiro
* Configurações
* Permissões
* Relatórios

---

## 🏢 Arquitetura SaaS

O sistema foi projetado para utilizar uma arquitetura **multi-tenant**, permitindo que diferentes empresas utilizem a mesma plataforma mantendo seus dados separados.

```text
SaaS PDV
│
├── Empresa A
│   ├── Usuários
│   ├── Produtos
│   ├── Clientes
│   ├── Vendas
│   ├── Estoque
│   └── Financeiro
│
├── Empresa B
│   ├── Usuários
│   ├── Produtos
│   ├── Clientes
│   ├── Vendas
│   ├── Estoque
│   └── Financeiro
│
└── Master Admin
    ├── Empresas
    ├── Usuários
    ├── Planos
    ├── Assinaturas
    └── Monitoramento
```

---

## 🛠️ Tecnologias

### Front-end

* React
* TypeScript
* Vite
* Tailwind CSS

### Back-end

* Supabase
* PostgreSQL
* Supabase Authentication
* Row Level Security (RLS)
* Supabase Storage

### Infraestrutura

* Vercel
* Git
* GitHub

---

## 🔐 Segurança

O projeto utiliza mecanismos de segurança para proteger os dados das empresas e usuários.

* Autenticação
* Controle de permissões
* Row Level Security (RLS)
* Isolamento de dados por empresa
* Controle de acesso por função
* Proteção de informações sensíveis
* Estrutura multi-tenant

---

## 👥 Perfis de Usuário

| Perfil           | Acesso                              |
| ---------------- | ----------------------------------- |
| 👑 Master Admin  | Administração global da plataforma  |
| 🏢 Administrador | Gestão completa da empresa          |
| 📊 Gerente       | Gestão e acompanhamento da operação |
| 💰 Caixa         | Vendas e operações de caixa         |
| 👨‍💼 Vendedor   | Realização de vendas                |
| 📦 Estoquista    | Controle de estoque                 |

---

## 💳 Modelo SaaS

A plataforma foi estruturada para trabalhar com diferentes planos de assinatura.

### 🆓 Free

Para pequenos negócios que desejam conhecer o sistema.

### 🚀 Pro

Para empresas que precisam de mais recursos e maior capacidade operacional.

### 💎 Premium

Plano completo com recursos avançados, relatórios, integrações e funcionalidades exclusivas.

---

## 📈 Roadmap

### Concluído

* [x] Estrutura inicial do sistema
* [x] Autenticação
* [x] Dashboard
* [x] Cadastro de produtos
* [x] Gestão de usuários
* [x] PDV
* [x] Gestão de clientes
* [x] Controle de estoque
* [x] Controle de caixa
* [x] Gestão financeira
* [x] Relatórios
* [x] Sistema de assinaturas

### Em desenvolvimento

* [x] Integração fiscal
* [x] Emissão de NF-e/NFC-e
* [x] Integração com impressoras
* [x] Integração com leitores de código de barras
* [x] Aplicativo mobile
* [x] Melhorias no módulo financeiro

### Futuras implementações

* [ ] Integração com marketplaces
* [ ] Integração com e-commerce
* [ ] Integração com WhatsApp
* [ ] Programa de fidelidade
* [ ] Inteligência artificial para análise de vendas
* [ ] Multi-lojas
* [ ] Gestão de franquias
* [ ] White Label
* [ ] API pública
* [ ] Integrações com contabilidade

---

## 🎯 Segmentos

O SaaS PDV pode ser utilizado por diferentes tipos de negócios:

* 🛒 Mercados
* 👕 Lojas de roupas
* 👟 Lojas de calçados
* 📱 Lojas de eletrônicos
* 💄 Lojas de cosméticos
* 🛠️ Lojas de ferramentas
* 🏪 Lojas de conveniência
* 💻 Assistências técnicas
* 🏬 Comércio em geral
* 🧰 Prestadores de serviços

---

## 📂 Estrutura do Projeto

```text
src/
│
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── contexts/
├── lib/
├── types/
└── utils/
```

---

## ⚙️ Instalação

### 1. Clone o repositório

```bash
git clone SEU_REPOSITORIO
```

### 2. Entre na pasta

```bash
cd seu-projeto
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure o ambiente

Crie um arquivo `.env`:

```env
VITE_SUPABASE_URL=seu_supabase_url
VITE_SUPABASE_ANON_KEY=sua_supabase_anon_key
```

### 5. Execute o projeto

```bash
npm run dev
```

---

## 📌 Status

🚧 **Em desenvolvimento**

O projeto está em evolução contínua, com novos módulos, integrações e melhorias sendo adicionados.

---

## 🔮 Visão do Produto

A visão do **SaaS PDV** é oferecer uma plataforma completa para gestão de pequenos e médios negócios, reunindo:

**PDV + Estoque + Caixa + Financeiro + Clientes + Fornecedores + Relatórios + Gestão**

em uma única solução.

No futuro, a plataforma poderá evoluir para um ecossistema completo de gestão empresarial, com integrações fiscais, e-commerce, marketplaces, aplicativos, APIs e recursos de inteligência artificial.

---

## 👨‍💻 Desenvolvimento

Projeto desenvolvido com foco em:

* Desenvolvimento de aplicações web
* Arquitetura SaaS
* Sistemas multi-tenant
* Banco de dados
* Segurança
* Gestão empresarial
* Experiência do usuário

---

## 📄 Licença

Este projeto possui código e funcionalidades proprietárias.

A utilização, distribuição ou comercialização do sistema depende da autorização do proprietário do projeto.
