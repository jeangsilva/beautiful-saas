# 🎨 Beautiful SaaS (Olivyx)

Sistema de agendamento para salões de beleza, barbearias, manicures e áreas da beleza.

## 🚀 Tecnologias

### Backend
- **Node.js** + Express
- **MySQL** + Sequelize ORM
- **Stripe** para pagamentos
- **JWT** para autenticação
- **Nodemailer** para emails

### Frontend (Em desenvolvimento)
- **React** + Vite
- **Tailwind CSS**
- **React Router**
- **Axios** para API

### Infraestrutura
- **NGINX** (Windows)
- **Subdomínios** configurados

## 🎯 Arquitetura

```
🌐 clientbeautiful.olivyx.com.br (porta 5100)
   ↓ Interface para clientes agendarem
   
🏪 empresabeautiful.olivyx.com.br (porta 5101)  
   ↓ Dashboard para donos de salão
   
📡 Backend API (porta 8000)
   ↓ Node.js + Express + MySQL
```

## 🎨 Design System

- **Cor Principal:** `#070fef` (azul vibrante)
- **Cor Secundária:** Branco
- **Estilo:** Moderno, clean, minimalista
- **Responsivo:** Desktop + Mobile

## ✅ Status do Projeto

- ✅ **Backend** (43/78 arquivos) - FUNCIONANDO
- 🔄 **Frontend Cliente** (0/35 arquivos) - EM DESENVOLVIMENTO  
- ⏳ **Frontend Empresa** (0/35 arquivos) - PLANEJADO
- ✅ **Banco de Dados** - Schema + Seeds prontos
- ✅ **NGINX** - Configurado e funcionando

## 🛠️ Configuração

### Pré-requisitos
- Node.js 18+
- MySQL 8+
- NGINX

### Instalação Backend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/beautiful-saas.git
cd beautiful-saas/backend

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
mysql -u root -p
CREATE DATABASE olivyx_saas;
exit

# Executar schema e seeds
mysql -u root -p olivyx_saas < database/schema.sql
mysql -u root -p olivyx_saas < database/seeds.sql

# Rodar servidor
npm start
```

### Endpoints da API

```
✅ http://localhost:8000/health      - Health check
✅ http://localhost:8000/api         - API info
✅ http://localhost:8000/api/test    - Teste com dados
✅ http://localhost:8000/api/docs    - Documentação
```

## 🌍 Subdomínios (via NGINX)

```
👤 http://clientbeautiful.olivyx.com.br  - Interface cliente
🏪 http://empresabeautiful.olivyx.com.br - Dashboard empresa
```

## 📊 Funcionalidades

### Interface Cliente
- 🎨 Landing page elegante
- 📅 Seleção de serviços
- 👨‍💼 Escolha de profissional
- ⏰ Seleção de data/horário
- 📝 Formulário de agendamento
- ✅ Confirmação automática

### Dashboard Empresa
- 🏪 Painel administrativo
- 📊 Analytics e relatórios
- 👥 Gestão de clientes
- 📅 Calendário de agendamentos
- ⚙️ Configurações do salão
- 💳 Gestão de assinaturas
- 👨‍💼 Gestão de funcionários

## 🗄️ Banco de Dados

### Tabelas Principais
- `users` - Usuários (clientes, funcionários, donos)
- `salons` - Salões de beleza
- `services` - Serviços oferecidos
- `appointments` - Agendamentos
- `reviews` - Avaliações
- `subscriptions` - Assinaturas Stripe

## 🔒 Segurança

- ✅ CORS configurado
- ✅ Helmet para headers de segurança
- ✅ Rate limiting
- ✅ JWT para autenticação
- ✅ Validação de dados
- ✅ Sanitização de inputs

## 📈 Monetização

### Planos de Assinatura
- **Trial** - 14 dias gratuitos
- **Starter** - R$ 29/mês
- **Professional** - R$ 59/mês  
- **Business** - R$ 99/mês

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

- **Projeto:** Beautiful SaaS
- **Empresa:** Olivyx
- **GitHub:** [beautiful-saas](https://github.com/seu-usuario/beautiful-saas)

---

**Desenvolvido com ❤️ para a comunidade de beleza**
