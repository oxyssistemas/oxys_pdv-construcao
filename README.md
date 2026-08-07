# Oxys PDV

OXYS PDV — PROMPT MASTER PARA DESENVOLVIMENTO DO ERP/PDV SAAS
1. OBJETIVO DO PROJETO

Desenvolva um sistema SaaS completo de gestão comercial, ERP e PDV chamado Oxys PDV.

O sistema deverá ser:

Multiempresa / Multi-tenant
Multiusuário
Multi-filial
Multi-caixa
Multi-estoque
Responsivo
Mobile First
Dark Theme
Moderno
Premium
Rápido
Seguro
Escalável
Modular
Preparado para produção
Preparado para futura aplicação mobile
Preparado para integrações externas

O sistema deverá atender desde pequenos comércios até redes de lojas.

O objetivo é criar uma plataforma profissional semelhante aos melhores sistemas modernos de ERP, gestão comercial e PDV, mas com identidade própria Oxys PDV.

2. REFERÊNCIA VISUAL OBRIGATÓRIA

Utilize como referência visual principal o design fornecido junto deste prompt.

A interface deve seguir o conceito visual apresentado na referência:

Fundo predominantemente escuro
Preto profundo próximo de #0D0D0D
Azul principal próximo de #1565FF
Azul elétrico para ações e destaques
Branco para textos principais
Cinza escuro para superfícies
Cards escuros com contraste sutil
Bordas discretamente iluminadas
Cantos arredondados
Sombras suaves
Glow azul muito discreto
Ícones modernos
Gráficos modernos
Tipografia limpa
Layout profissional de SaaS
Sidebar moderna
Header compacto
Cards de indicadores
Dashboards com gráficos
Componentes com estados hover/focus/active
Animações suaves
IMPORTANTE

A imagem fornecida não deve ser tratada apenas como inspiração genérica.

Use-a como referência de direção visual e composição da interface, mantendo:

hierarquia visual;
organização dos cards;
estilo dos gráficos;
aparência do sidebar;
aparência dos menus;
estrutura dos dashboards;
estilo do PDV;
estilo dos aplicativos mobile;
padrão de botões;
padrão dos campos;
padrão dos modais;
padrão das notificações;
linguagem visual geral.

Porém, não copie literalmente textos, dados, imagens ou elementos proprietários da referência.

A identidade final deve ser própria do Oxys PDV.

3. IDENTIDADE VISUAL
Marca

Nome:

Oxys PDV

Criar uma identidade visual profissional para o produto.

Paleta principal
Preto:       #0D0D0D
Azul:        #1565FF
Branco:      #FFFFFF
Cinza escuro: #161A22
Cinza:       #8B93A7

Usar azul principalmente para:

Botões primários
Links
Estados ativos
Indicadores
Gráficos
Ícones de destaque
Focus
Progress bars
Elementos selecionados

Evitar exagero no azul.

A interface deve parecer premium, elegante e tecnológica, e não excessivamente chamativa.

4. SISTEMA DE DESIGN

Criar um Design System global e reutilizável.

Componentes:

Button
IconButton
Input
Select
Combobox
DatePicker
DateRangePicker
Checkbox
Radio
Switch
Textarea
Form
Modal
Drawer
Sheet
Dialog
Tooltip
Dropdown
Tabs
Accordion
Card
Table
DataTable
Pagination
Badge
Avatar
Breadcrumb
Sidebar
Header
Navbar
Toast
Notification
Skeleton
Empty State
Loading State
Error State
Confirmation Dialog
Command Menu
Search
Charts
KPI Cards
Timeline
Activity Feed
File Upload
Image Upload
Barcode Scanner UI

Utilizar:

React
Next.js
TypeScript
Tailwind CSS
shadcn/ui
5. RESPONSIVIDADE

O sistema deve ser:

Mobile First.

Breakpoints:

Mobile
Tablet
Desktop
Large Desktop

No desktop:

Sidebar fixa ou recolhível.

No mobile:

Sidebar deve transformar-se em:

Drawer
Bottom Navigation quando apropriado

Dashboards devem adaptar automaticamente:

Desktop:

4 ou mais cards por linha

Tablet:

2 cards por linha

Mobile:

1 card por linha

Tabelas devem possuir:

scroll horizontal;
modo responsivo;
ou transformação para cards no mobile.
6. LOGIN

Criar tela de login premium.

Layout desktop dividido em duas áreas.

Área esquerda

Login:

Logo Oxys PDV

Texto:

"Bem-vindo de volta!"

Campos:

Email
Senha

Opções:

Lembrar-me
Esqueci minha senha

Botão:

Entrar

Adicionar estados:

Loading
Erro
Sucesso
Validação
Área direita

Painel visual mostrando indicadores fictícios/ilustrativos do sistema:

Empresas ativas
Usuários
Vendas
Transações
Crescimento

Criar gráficos e elementos visuais discretos.

No mobile:

Esconder/reduzir o painel lateral e priorizar o formulário.

7. AUTENTICAÇÃO

Implementar:

JWT
Access Token
Refresh Token
Expiração de sessão
Logout
Recuperação de senha
Alteração de senha
Sessões ativas
Revogação de sessão
2FA opcional
Proteção contra brute force
Rate limiting
Hash seguro de senha
8. MULTI-TENANT

O Oxys PDV será um sistema SaaS multiempresa.

Existe uma conta:

OWNER

O Owner administra todas as empresas cadastradas no SaaS.

Cada empresa possui seus próprios:

Usuários
Produtos
Clientes
Fornecedores
Estoques
Filiais
Caixas
Vendas
Compras
Financeiro
Funcionários
Relatórios
Configurações
REGRA CRÍTICA

Nenhuma empresa poderá acessar dados de outra empresa.

Todas as entidades de negócio devem possuir:

companyId

Quando aplicável, utilizar também:

branchId
warehouseId
cashRegisterId
userId

Implementar isolamento de tenant no backend.

Nunca confiar apenas no frontend para segurança multi-tenant.

9. PORTAL MASTER — OWNER

Criar painel exclusivo do proprietário do SaaS.

O Owner possui visão global da plataforma.

Dashboard

Cards:

Empresas cadastradas
Empresas ativas
Empresas bloqueadas
Empresas em teste
Clientes inadimplentes
Receita mensal
Receita anual
Usuários
Vendas totais
Total movimentado

Gráficos:

Receita mensal
Crescimento de empresas
Crescimento de usuários
Vendas por empresa
Receita por plano
Empresas por categoria
Churn
MRR
ARR

Criar aparência semelhante ao dashboard da referência visual.

10. CADASTRO DE EMPRESAS

Campos:

Razão Social
Nome Fantasia
CNPJ
Inscrição Estadual
Telefone
WhatsApp
Email
Endereço
CEP
Cidade
Estado
País
Plano
Data de vencimento
Status
Logo
Categoria
Gerente responsável

Status:

Ativa
Bloqueada
Suspensa
Trial
Cancelada
11. CATEGORIAS DE EMPRESA

Disponibilizar categorias padrão:

Loja de Varejo
Mercado
Supermercado
Mini Mercado
Atacado
Distribuidora
Pet Shop
Agropecuária
Farmácia
Padaria
Lanchonete
Restaurante
Pizzaria
Açougue
Auto Peças
Oficina
Loja de Roupas
Loja de Calçados
Loja de Cosméticos
Loja de Informática
Loja de Celulares
Material de Construção
Papelaria
Sorveteria
Ótica
Adega
Loja de Conveniência
Floricultura
Academia
Clínica
Consultório
Prestadora de Serviços
Loja de Móveis
Loja de Eletrônicos
Loja de Presentes
Loja de Utilidades
Assistência Técnica

Permitir categorias personalizadas.

12. PORTAL GERENTE

O Gerente possui acesso completo à sua empresa.

Dashboard:

Vendas do dia
Vendas do mês
Lucro
Produtos em estoque
Produtos em falta
Clientes
Funcionários
Fluxo de caixa
Metas
Últimas vendas
Notificações

Gráficos:

Vendas
Lucro
Despesas
Fluxo de caixa
Produtos mais vendidos
Vendas por período
Vendas por funcionário
Formas de pagamento
13. USUÁRIOS E PERFIS

Criar perfis:

Owner
Gerente
Supervisor
Caixa
Atendente
Estoque
RH
Financeiro

Implementar RBAC extremamente detalhado.

Permissões devem poder ser configuradas individualmente.

Exemplos:

products.create
products.read
products.update
products.delete

sales.create
sales.read
sales.cancel
sales.refund
sales.discount

cash.open
cash.close
cash.withdraw
cash.supply

financial.payables
financial.receivables
financial.reports

users.create
users.update
users.delete
users.permissions

Permitir:

Perfil padrão
Permissões customizadas
Permissões por módulo
Permissões por ação
Permissões por filial
Permissões por estoque
Permissões por caixa
14. SUPERVISOR

Pode:

Acompanhar vendas
Visualizar estoque
Aprovar descontos
Cancelar vendas
Autorizar devoluções
Visualizar relatórios
Acompanhar desempenho
Gerenciar filas
Monitorar caixas
Receber notificações
15. CAIXA / PDV

Criar uma interface extremamente rápida.

O design do PDV deve seguir a referência visual fornecida.

Tela dividida em:

Área de produtos
Busca rápida
Categorias
Produtos
Imagens
Preços
Estoque
Código de barras
Área do carrinho
Produto
Quantidade
Preço
Desconto
Subtotal
Total
Área de pagamento

Métodos:

Dinheiro
PIX
Cartão
Vale
Voucher
Outros

Suportar:

Pagamento único
Múltiplos pagamentos
Pagamento parcial
Troco

Ações:

Finalizar venda
Cancelar
Suspender
Recuperar venda
Emitir comprovante
Imprimir
Enviar comprovante

Atalhos:

F2 = Buscar produto
F4 = Cliente
F5 = Finalizar
F6 = Desconto
F8 = Suspender
ESC = Cancelar
16. OPERAÇÕES DE CAIXA

Implementar:

Abrir caixa
Fechar caixa
Sangria
Suprimento
Conferência
Histórico
Resumo do turno
Diferenças
Fechamento por operador
17. ATENDENTE

Pode:

Cadastrar cliente
Editar cliente
Consultar cliente
Pesquisar produto
Consultar estoque
Consultar preço
Montar orçamento
Criar pedido
Criar pré-venda
Reservar produto
Adicionar observações
Salvar venda

Não pode finalizar pagamento.

Pagamento somente pelo Caixa.

18. ESTOQUE

Cadastro de produto:

Código
Código de barras
SKU
Nome
Descrição
Categoria
Fornecedor
Marca
Preço de compra
Preço de venda
Margem
Quantidade
Estoque mínimo
Estoque máximo
Localização
Lote
Validade
Peso
Unidade
Imagem
Múltiplas imagens

Variações:

Cor
Tamanho
Modelo
Voltagem
Outros atributos

Movimentações:

Entrada
Saída
Transferência
Inventário
Perda
Ajuste

Registrar histórico completo.

Alertas:

Estoque baixo
Produto vencendo
Produto vencido
Reposição necessária
19. COMPRAS

Criar módulo completo de compras:

Solicitação de compra
Cotação
Pedido de compra
Recebimento
Entrada de estoque
Fornecedor
Histórico
Custos
Impostos
Frete
Descontos
Contas a pagar
20. FORNECEDORES

Cadastro:

Razão Social
Nome Fantasia
CNPJ/CPF
Inscrição Estadual
Telefone
WhatsApp
Email
Endereço
Contatos
Produtos fornecidos
Histórico
Financeiro
21. CLIENTES

Cadastro completo:

Nome
CPF
CNPJ
Endereço
Email
Telefone
WhatsApp
Limite de crédito
Aniversário
Observações
Histórico de compras
Pontuação
Fidelidade
Cashback

Criar histórico visual do cliente.

22. PROGRAMA DE FIDELIDADE

Implementar:

Pontos
Cashback
Níveis de cliente
Recompensas
Cupons
Promoções
Histórico de pontos
Regras por produto
Regras por categoria
Regras por valor gasto
23. FINANCEIRO

Criar módulo completo.

Contas a pagar
Cadastro
Vencimento
Categoria
Centro de custo
Fornecedor
Status
Baixa
Parcelamento
Contas a receber
Cliente
Venda
Vencimento
Parcelas
Status
Recebimento
Outros
Fluxo de caixa
Centro de custos
Plano de contas
Receitas
Despesas
Conciliação bancária
Boletos
PIX
DRE
Lucro
Prejuízo
Indicadores

Dashboard financeiro visual e moderno.

24. RH

Criar módulo completo.

Cadastro de funcionários:

Dados pessoais
Documentos
Cargo
Departamento
Salário
Banco
PIX
Contato
Dependentes
Benefícios
Histórico
Treinamentos
Advertências
Férias
Licenças
Documentos
Upload
Assinaturas

Recursos:

Folha
Ponto
Horas extras
Escalas
Banco de horas
Avaliações
Contratações
Desligamentos
Aniversariantes
Relatórios
25. FISCAL

Preparar arquitetura para:

NF-e
NFC-e
NFS-e
SAT
MDF-e
CT-e

Criar arquitetura de integração desacoplada.

Preparar adapters/providers para APIs fiscais futuras.

Não deixar regras fiscais espalhadas pelo sistema.

26. RELATÓRIOS

Criar central de relatórios.

Categorias:

Vendas
Produtos
Estoque
Clientes
Fornecedores
Funcionários
Financeiro
Compras
Lucro
Caixas
Comissões
Despesas
Fluxo de caixa
Fidelidade
Metas

Filtros:

Período
Filial
Usuário
Produto
Categoria
Cliente
Forma de pagamento

Exportação:

PDF
Excel
CSV
27. NOTIFICAÇÕES

Criar Central de Notificações.

Notificações:

Estoque baixo
Produto vencendo
Produto vencido
Novo pedido
Nova venda
Meta atingida
Conta vencendo
Pagamento recebido
Funcionário aniversariante
Avisos administrativos

Implementar:

Notificação em tempo real
Badge
Toast
Central de notificações
Marcar como lida
Marcar todas como lidas
Histórico

Usar WebSocket / Socket.IO.

28. AUDITORIA

Registrar todas as ações importantes.

Cada registro deve possuir:

userId
companyId
action
entity
entityId
timestamp
ip
device
userAgent
oldValue
newValue

Criar tela de auditoria com filtros.

29. SEGURANÇA

Implementar:

JWT
Refresh Token
Hash de senha
RBAC
2FA
Rate limiting
Validação de entrada
Sanitização
Proteção contra SQL Injection
Proteção contra XSS
Proteção CSRF quando aplicável
Logs
Auditoria
Backup
LGPD
Isolamento multi-tenant

Nunca confiar em dados enviados pelo frontend para determinar:

companyId
userId
permissões
tenant
valores financeiros
descontos
autorização de cancelamento

Tudo deve ser validado no backend.

30. PESQUISA GLOBAL

Criar pesquisa global no header.

Permitir pesquisar:

Produtos
Clientes
Fornecedores
Vendas
Pedidos
Funcionários
Documentos
Relatórios
Páginas do sistema

Atalho:

Ctrl + K

Criar Command Palette moderna.

31. DASHBOARDS

Cada perfil possui dashboard próprio.

Dashboard deve possuir:

KPI Cards
Gráficos
Indicadores
Filtros
Pesquisa
Período
Atualização em tempo real
Skeleton loading
Empty states

Gráficos:

Linha
Barra
Área
Pizza
Donut
Comparação
Ranking

Usar Recharts.

32. CONFIGURAÇÃO VISUAL POR EMPRESA

Cada empresa poderá configurar:

Logo
Nome
Cor principal
Cor secundária
Tema
Dados fiscais
Impressão
Comprovante
Identidade visual

O sistema deve permitir aplicar a identidade visual da empresa sem comprometer a usabilidade ou acessibilidade.

33. MULTI-FILIAL

Uma empresa poderá possuir várias filiais.

Cada filial poderá possuir:

Usuários
Estoques
Caixas
Produtos
Vendas
Clientes
Financeiro

Criar seletor de filial no header.

Permitir:

Todas as filiais
Filial 01
Filial 02
Filial 03
...
34. MULTI-ESTOQUE

Suportar:

Estoque principal
Estoque secundário
Estoque por filial
Estoque virtual
Transferências
Inventário
Reservas
35. COMISSÕES

Criar sistema de comissões.

Regras por:

Funcionário
Produto
Categoria
Venda
Meta
Percentual
Valor fixo

Dashboard de comissão.

36. METAS

Permitir metas:

Diárias
Semanais
Mensais
Anuais

Metas por:

Empresa
Filial
Equipe
Funcionário
Produto
Categoria

Exibir progresso visual.

37. AGENDA E TAREFAS

Criar módulo:

Tarefas
Responsáveis
Prioridade
Status
Prazo
Comentários
Checklist
Notificações
38. IA — ESTRUTURA PREPARADA

Preparar arquitetura para inteligência artificial.

A IA deverá futuramente analisar:

Vendas
Produtos
Estoque
Lucro
Clientes
Tendências
Metas

Possíveis insights:

"Seu produto X vendeu 32% mais nesta semana."

"Você possui 14 produtos próximos do estoque mínimo."

"Suas vendas caíram 8% às segundas-feiras."

"Este cliente não compra há 47 dias."

"Esta categoria apresenta margem abaixo da média."

Criar arquitetura desacoplada para futura integração com provedores de IA.

39. INTEGRAÇÕES FUTURAS

Preparar arquitetura para:

WhatsApp
Mercado Pago
Stripe
Gateways de pagamento
Gateways fiscais
Bancos
APIs externas
E-commerce
Marketplace

Utilizar arquitetura baseada em adapters/providers.

40. API

Criar API REST documentada com Swagger/OpenAPI.

Organizar endpoints por domínio:

/auth
/users
/companies
/branches
/products
/categories
/inventory
/customers
/suppliers
/sales
/orders
/cash-registers
/purchases
/finance
/hr
/reports
/notifications
/audit
/settings
41. STACK TECNOLÓGICA
Frontend
React
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod
Recharts
Backend
Node.js
NestJS
Prisma ORM
Banco
PostgreSQL
Cache
Redis
Mensageria
BullMQ
WebSocket
Socket.IO
Storage
S3 compatível
42. ARQUITETURA

Utilizar:

Clean Architecture
SOLID
DDD
Modular Architecture
Repository Pattern
Service Layer
DTOs
Dependency Injection
Domain Events
Event-driven architecture quando apropriado

Separar claramente:

Domain
Application
Infrastructure
Presentation

Evitar código monolítico.

Criar módulos independentes e reutilizáveis.

43. ESTRUTURA DO FRONTEND

Organizar por módulos.

Exemplo:

app/
  dashboard/
  empresas/
  produtos/
  estoque/
  vendas/
  pdv/
  clientes/
  fornecedores/
  compras/
  financeiro/
  rh/
  relatorios/
  configuracoes/

Criar componentes compartilhados:

components/
  ui/
  charts/
  tables/
  forms/
  layouts/
  dashboard/
  notifications/
44. UX

O sistema deve priorizar:

Poucos cliques
Feedback imediato
Busca rápida
Atalhos de teclado
Confirmações somente quando necessárias
Loading states
Skeletons
Empty states
Error states
Toasts
Modais rápidos
Navegação clara

Evitar telas excessivamente carregadas.

45. ANIMAÇÕES

Usar animações suaves e profissionais.

Exemplos:

Fade
Slide
Scale
Hover
Modal transition
Sidebar transition
Dropdown transition
Skeleton
Loading

As animações não devem prejudicar performance.

Respeitar:

prefers-reduced-motion
46. PERFORMANCE

Priorizar:

Server Components quando fizer sentido
Lazy loading
Code splitting
Cache
Redis
TanStack Query
Paginação
Virtualização de tabelas
Debounce de pesquisas
Otimização de imagens
Índices no PostgreSQL
Queries eficientes
Background jobs com BullMQ

O PDV deve possuir sensação de resposta instantânea.

47. BANCO DE DADOS

Criar schema Prisma completo.

Todas as entidades multi-tenant devem possuir isolamento adequado.

Criar relacionamentos:

Owner
  ↓
Companies
  ↓
Branches
  ↓
Users
  ↓
Roles
  ↓
Permissions

E:

Company
 ├── Products
 ├── Categories
 ├── Customers
 ├── Suppliers
 ├── Employees
 ├── Warehouses
 ├── CashRegisters
 ├── Sales
 ├── Purchases
 ├── FinancialTransactions
 ├── Notifications
 └── AuditLogs

Criar:

Índices
Unique constraints
Foreign keys
Soft delete quando apropriado
Timestamps
Auditoria
48. SEED

Criar seed inicial com:

Owner
owner@oxys.local
Empresa demo

Criar uma empresa fictícia.

Usuários demo

Criar:

Gerente
Supervisor
Caixa
Atendente
Estoque
RH
Financeiro
Dados demo

Criar:

Produtos
Categorias
Clientes
Fornecedores
Vendas
Compras
Financeiro
Funcionários
Estoque

Isso permitirá testar todos os dashboards imediatamente.

49. ESTADOS DA INTERFACE

Todas as páginas devem possuir:

Loading

Skeleton moderno.

Empty

Exemplo:

"Você ainda não possui produtos cadastrados."

Botão:

"Adicionar produto"

Error

Mensagem amigável.

Botão:

"Tentar novamente"

Success

Toast ou feedback visual.

50. SIDEBAR

Sidebar seguindo o conceito da referência visual.

Itens organizados:

Dashboard

Operações
  PDV
  Vendas
  Pedidos
  Orçamentos

Cadastros
  Produtos
  Categorias
  Clientes
  Fornecedores

Estoque
  Estoque
  Movimentações
  Inventário
  Transferências

Compras
  Compras
  Pedidos de compra

Financeiro
  Contas a pagar
  Contas a receber
  Fluxo de caixa
  DRE

RH
  Funcionários
  Ponto
  Férias
  Folha

Relatórios

Notificações

Configurações

Menus devem aparecer conforme as permissões do usuário.

51. HEADER

Header moderno contendo:

Logo
Pesquisa global
Seletor de empresa/filial quando aplicável
Notificações
Tema
Ajuda
Avatar
Nome do usuário
Perfil
Logout
52. DASHBOARD VISUAL

O dashboard deve seguir o conceito da referência visual.

Criar cards como:

Vendas hoje
R$ 8.450,00
↑ 12,3%
Vendas do mês
R$ 245.850,00
↑ 8,7%
Lucro
R$ 45.230,00
↑ 13,2%
Produtos em estoque
1.248
↓ 3,1%

Utilizar dados fictícios apenas para demonstração.

53. PDV VISUAL

A tela de PDV deve possuir aparência extremamente profissional.

Estrutura:

┌────────────────────────────────────────────────────┐
│ Oxys PDV | Busca | Caixa 01 | Operador             │
├───────────────────────┬────────────────────────────┤
│                       │                            │
│ Produtos              │ Carrinho                   │
│                       │                            │
│ Categorias            │ Produto                    │
│                       │ Quantidade                  │
│ Cards de produtos     │ Preço                       │
│                       │                            │
│                       │ Subtotal                    │
│                       │ Desconto                    │
│                       │ Total                       │
│                       │                            │
│                       │ PIX | Cartão | Dinheiro    │
│                       │                            │
│                       │ FINALIZAR VENDA             │
└───────────────────────┴────────────────────────────┘

No mobile adaptar completamente para uso em touchscreen.

54. MOBILE

Criar também telas mobile seguindo a referência visual.

Aplicativo mobile deve permitir:

Dashboard
Vendas
Produtos
Estoque
Clientes
Notificações
Indicadores

Navigation inferior:

Início
Vendas
Produtos
Clientes
Mais
55. NOTIFICAÇÕES MOBILE

Criar tela de notificações com cards:

Estoque baixo
Produto vencendo
Nova venda
Meta atingida
Conta vencendo

Cada notificação deve possuir:

Ícone
Título
Descrição
Tempo
Estado lido/não lido
56. ACESSIBILIDADE

Implementar:

Navegação por teclado
Focus states
ARIA
Contraste adequado
Labels
Screen reader
Reduced motion
Tamanhos adequados para touch
57. PRODUÇÃO

Preparar para:

Docker
Docker Compose
PostgreSQL
Redis
S3
Workers
CI/CD
Environment variables
Logging
Monitoring
Health checks

Criar:

.env.example

Nunca colocar secrets diretamente no código.

58. DOCUMENTAÇÃO

Criar documentação:

README.md
ARCHITECTURE.md
API.md
DATABASE.md
SECURITY.md
DEPLOYMENT.md

Documentar decisões arquiteturais importantes.

59. TESTES

Preparar testes:

Backend
Unit
Integration
E2E
Frontend
Component
Integration
E2E

Testar principalmente:

Login
Permissões
Multi-tenancy
PDV
Venda
Pagamento
Estoque
Financeiro
Cancelamento
Auditoria
60. REGRAS IMPORTANTES PARA A IA DE DESENVOLVIMENTO

Não criar somente protótipos visuais.

Construir funcionalidade real.

Não criar botões falsos que não fazem nada.

Não criar páginas vazias apenas para aparentar que o sistema está pronto.

Quando uma funcionalidade for criada, implementar:

Frontend
Backend
Banco
Validação
Permissão
Feedback
Estados
Tratamento de erros

Sempre que possível, utilizar dados reais vindos da API.

61. DESENVOLVIMENTO INCREMENTAL

Caso não seja possível construir todo o sistema em uma única execução, desenvolver em fases.

FASE 1 — CORE

Construir primeiro:

Arquitetura
Banco
Autenticação
Multi-tenant
Owner
Empresa
Usuários
RBAC
Dashboard
FASE 2 — OPERAÇÃO

Depois:

Produtos
Categorias
Estoque
Clientes
Fornecedores
Compras
FASE 3 — PDV

Depois:

Caixa
PDV
Vendas
Pagamentos
Cancelamentos
Devoluções
Comprovantes
FASE 4 — FINANCEIRO

Depois:

Contas a pagar
Contas a receber
Fluxo de caixa
DRE
Centro de custos
FASE 5 — RH

Depois:

Funcionários
Ponto
Férias
Folha
Benefícios
FASE 6 — AVANÇADO

Depois:

Fidelidade
Cashback
Comissões
Metas
Multi-filial
Multi-estoque
Auditoria
Notificações
IA
Integrações
62. CRITÉRIO VISUAL FINAL

Antes de considerar qualquer módulo concluído, verificar:

O layout segue o Design System?
Está visualmente próximo da referência fornecida?
Funciona em desktop?
Funciona em tablet?
Funciona em mobile?
Possui loading?
Possui empty state?
Possui error state?
Possui feedback?
Possui validação?
Possui permissões?
Possui isolamento de tenant?
Possui boa performance?
Possui acessibilidade?
63. RESULTADO ESPERADO

O resultado final deve ser um ERP + PDV SaaS profissional chamado Oxys PDV.

A interface deve transmitir:

Tecnologia + Segurança + Velocidade + Organização + Profissionalismo.

O usuário deve sentir que está utilizando um produto SaaS premium.

A experiência visual deve seguir o conceito da referência fornecida:

Dashboard escuro premium
Azul tecnológico
Cards modernos
Gráficos elegantes
PDV rápido
Mobile moderno
Sidebar profissional
Notificações
Indicadores
Animações suaves

Não criar uma interface genérica de administração.

Criar um produto com identidade própria.

64. INSTRUÇÃO FINAL PARA A IA

Comece pelo projeto funcional e não apenas pelo mockup.

Primeiro estabeleça a arquitetura base, banco de dados, autenticação e multi-tenancy.

Depois construa o Design System e o layout principal.

Em seguida implemente os módulos por fases.

Sempre mantenha o design visual consistente com a referência fornecida.

Priorize:

Segurança
Multi-tenancy
Performance
UX
Responsividade
Escalabilidade
Manutenibilidade
Design premium

O resultado deverá parecer um produto SaaS comercial real, pronto para evolução e operação em produção, e não apenas um template administrativo.

Nome do produto: OXYS PDV

Estilo: Premium SaaS / ERP / POS

Tema: Dark

Cor principal: #1565FF

Cor de fundo: #0D0D0D

Arquitetura: Clean Architecture + DDD + SOLID

Stack: Next.js + React + TypeScript + Tailwind + shadcn/ui + NestJS + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO

Referência visual: utilizar a imagem anexada como direção visual principal de UI/UX.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ff8b01d1-dbef-4356-b2ee-b9de10c4304b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
