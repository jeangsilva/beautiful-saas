-- Beautiful SaaS (Olivyx) - Database Seeds
-- Sistema de agendamento para beleza
-- Dados iniciais para desenvolvimento e demonstração

USE olivyx_saas;

-- Disable foreign key checks for seeding
SET FOREIGN_KEY_CHECKS = 0;

-- System Settings (Configurações do sistema)
INSERT INTO system_settings (key_name, value, description, type, isPublic) VALUES
('app_name', 'Olivyx', 'Nome da aplicação', 'string', true),
('app_version', '1.0.0', 'Versão da aplicação', 'string', true),
('company_name', 'Beautiful SaaS', 'Nome da empresa', 'string', true),
('support_email', 'suporte@olivyx.com', 'Email de suporte', 'string', false),
('default_timezone', 'America/Sao_Paulo', 'Timezone padrão', 'string', true),
('default_currency', 'BRL', 'Moeda padrão', 'string', true),
('trial_days', '14', 'Dias de trial gratuito', 'number', false),
('max_appointments_per_day', '50', 'Máximo de agendamentos por dia', 'number', false),
('email_verification_required', 'true', 'Verificação de email obrigatória', 'boolean', false),
('maintenance_mode', 'false', 'Modo de manutenção', 'boolean', true),
('google_maps_api_key', '', 'Chave da API do Google Maps', 'string', false),
('stripe_webhook_secret', '', 'Secret do webhook do Stripe', 'string', false);

-- Users (Usuários de demonstração)
INSERT INTO users (email, password, firstName, lastName, phone, role, isActive, emailVerified, preferences) VALUES
-- Super Admin
('admin@olivyx.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Admin', 'Sistema', '+5511999999999', 'super_admin', true, true, '{"theme": "light", "language": "pt-BR", "notifications": {"email": true, "push": true}}'),

-- Salon Owner 1
('maria@salaobela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Maria', 'Silva', '+5511987654321', 'salon_owner', true, true, '{"theme": "light", "language": "pt-BR", "notifications": {"email": true, "push": true}}'),

-- Salon Owner 2
('carlos@espacobeleza.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Carlos', 'Santos', '+5511876543210', 'salon_owner', true, true, '{"theme": "dark", "language": "pt-BR", "notifications": {"email": true, "push": false}}'),

-- Employees
('ana@salaobela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Ana', 'Costa', '+5511765432109', 'employee', true, true, '{"theme": "light", "language": "pt-BR"}'),
('joao@salaobela.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'João', 'Oliveira', '+5511654321098', 'employee', true, true, '{"theme": "light", "language": "pt-BR"}'),
('juliana@espacobeleza.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Juliana', 'Ferreira', '+5511543210987', 'employee', true, true, '{"theme": "light", "language": "pt-BR"}'),

-- Clients
('cliente1@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Fernanda', 'Lima', '+5511432109876', 'client', true, true, '{"theme": "light", "language": "pt-BR"}'),
('cliente2@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Roberto', 'Alves', '+5511321098765', 'client', true, true, '{"theme": "dark", "language": "pt-BR"}'),
('cliente3@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Camila', 'Rocha', '+5511210987654', 'client', true, true, '{"theme": "light", "language": "pt-BR"}'),
('cliente4@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMrhEL3T5UB4KvK', 'Pedro', 'Mendes', '+5511109876543', 'client', true, true, '{"theme": "light", "language": "pt-BR"}');

-- Salons (Salões de demonstração)
INSERT INTO salons (ownerId, name, slug, description, phone, email, address, city, state, zipCode, businessHours, settings, isPremium, subscriptionStatus) VALUES
(2, 'Salão Bella Vita', 'salao-bella-vita', 'Seu espaço de beleza e bem-estar no coração da cidade. Oferecemos os melhores tratamentos com profissionais qualificados.', '+5511987654321', 'contato@salaobela.com', 'Rua das Flores, 123 - Centro', 'São Paulo', 'SP', '01234-567', 
'{"monday": {"open": "09:00", "close": "19:00", "closed": false}, "tuesday": {"open": "09:00", "close": "19:00", "closed": false}, "wednesday": {"open": "09:00", "close": "19:00", "closed": false}, "thursday": {"open": "09:00", "close": "19:00", "closed": false}, "friday": {"open": "09:00", "close": "20:00", "closed": false}, "saturday": {"open": "08:00", "close": "18:00", "closed": false}, "sunday": {"closed": true}}',
'{"booking_advance_days": 30, "cancellation_hours": 24, "auto_confirm": true, "payment_required": false}', true, 'active'),

(3, 'Espaço Beleza & Arte', 'espaco-beleza-arte', 'Transformamos sua beleza em arte. Especialistas em cortes modernos, coloração e tratamentos capilares.', '+5511876543210', 'contato@espacobeleza.com', 'Av. Paulista, 456 - Bela Vista', 'São Paulo', 'SP', '01310-100',
'{"monday": {"open": "10:00", "close": "20:00", "closed": false}, "tuesday": {"open": "10:00", "close": "20:00", "closed": false}, "wednesday": {"open": "10:00", "close": "20:00", "closed": false}, "thursday": {"open": "10:00", "close": "20:00", "closed": false}, "friday": {"open": "10:00", "close": "21:00", "closed": false}, "saturday": {"open": "09:00", "close": "19:00", "closed": false}, "sunday": {"open": "10:00", "close": "16:00", "closed": false}}',
'{"booking_advance_days": 45, "cancellation_hours": 12, "auto_confirm": false, "payment_required": true}', false, 'trial');

-- Salon Members (Funcionários dos salões)
INSERT INTO salon_members (salonId, userId, role) VALUES
-- Salão Bella Vita
(1, 2, 'owner'),
(1, 4, 'employee'),
(1, 5, 'employee'),
-- Espaço Beleza & Arte
(2, 3, 'owner'),
(2, 6, 'employee');

-- Services (Serviços dos salões)
INSERT INTO services (salonId, name, description, duration, price, category, isActive, onlineBooking) VALUES
-- Salão Bella Vita
(1, 'Corte Feminino', 'Corte personalizado de acordo com o formato do rosto e estilo pessoal', 60, 45.00, 'Cabelo', true, true),
(1, 'Corte Masculino', 'Corte moderno e tradicional para todos os estilos', 30, 25.00, 'Cabelo', true, true),
(1, 'Escova Progressiva', 'Alisamento natural que reduz o volume e o frizz', 180, 120.00, 'Cabelo', true, true),
(1, 'Coloração Completa', 'Mudança completa da cor dos cabelos com produtos de qualidade', 120, 80.00, 'Cabelo', true, true),
(1, 'Manicure', 'Cuidado completo das unhas das mãos com esmaltação', 45, 20.00, 'Unhas', true, true),
(1, 'Pedicure', 'Cuidado completo das unhas dos pés com esmaltação', 60, 25.00, 'Unhas', true, true),
(1, 'Limpeza de Pele', 'Limpeza profunda facial com extração e hidratação', 90, 60.00, 'Estética', true, true),
(1, 'Massagem Relaxante', 'Massagem corporal para alívio do estresse e tensões', 60, 70.00, 'Bem-estar', true, true),

-- Espaço Beleza & Arte
(2, 'Corte + Escova', 'Corte personalizado + finalização com escova', 90, 55.00, 'Cabelo', true, true),
(2, 'Hidratação Capilar', 'Tratamento intensivo para cabelos ressecados', 60, 40.00, 'Cabelo', true, true),
(2, 'Luzes + Matização', 'Mechas com tonalizante para um visual moderno', 150, 100.00, 'Cabelo', true, true),
(2, 'Sobrancelha Design', 'Design personalizado com henna ou micropigmentação', 30, 30.00, 'Sobrancelha', true, true),
(2, 'Unha em Gel', 'Aplicação de unhas em gel com design personalizado', 90, 45.00, 'Unhas', true, true),
(2, 'Drenagem Linfática', 'Massagem modeladora para redução de medidas', 90, 80.00, 'Estética', true, true);

-- Service Providers (Quem pode realizar cada serviço)
INSERT INTO service_providers (serviceId, userId) VALUES
-- Ana pode fazer todos os serviços de cabelo e unhas do Salão Bella Vita
(1, 4), (2, 4), (3, 4), (4, 4), (5, 4), (6, 4),
-- João pode fazer cortes e alguns serviços do Salão Bella Vita
(1, 5), (2, 5), (8, 5),
-- Juliana pode fazer todos os serviços do Espaço Beleza & Arte
(9, 6), (10, 6), (11, 6), (12, 6), (13, 6), (14, 6);

-- Availability (Disponibilidade dos profissionais)
INSERT INTO availability (userId, salonId, dayOfWeek, startTime, endTime, isActive) VALUES
-- Ana - Segunda a Sábado
(4, 1, 1, '09:00:00', '18:00:00', true), -- Segunda
(4, 1, 2, '09:00:00', '18:00:00', true), -- Terça
(4, 1, 3, '09:00:00', '18:00:00', true), -- Quarta
(4, 1, 4, '09:00:00', '18:00:00', true), -- Quinta
(4, 1, 5, '09:00:00', '19:00:00', true), -- Sexta
(4, 1, 6, '08:00:00', '17:00:00', true), -- Sábado

-- João - Segunda a Sexta
(5, 1, 1, '10:00:00', '19:00:00', true), -- Segunda
(5, 1, 2, '10:00:00', '19:00:00', true), -- Terça
(5, 1, 3, '10:00:00', '19:00:00', true), -- Quarta
(5, 1, 4, '10:00:00', '19:00:00', true), -- Quinta
(5, 1, 5, '10:00:00', '20:00:00', true), -- Sexta

-- Juliana - Todos os dias
(6, 2, 1, '10:00:00', '20:00:00', true), -- Segunda
(6, 2, 2, '10:00:00', '20:00:00', true), -- Terça
(6, 2, 3, '10:00:00', '20:00:00', true), -- Quarta
(6, 2, 4, '10:00:00', '20:00:00', true), -- Quinta
(6, 2, 5, '10:00:00', '21:00:00', true), -- Sexta
(6, 2, 6, '09:00:00', '19:00:00', true), -- Sábado
(6, 2, 0, '10:00:00', '16:00:00', true); -- Domingo

-- Appointments (Agendamentos de exemplo)
INSERT INTO appointments (salonId, clientId, serviceId, providerId, appointmentDate, startTime, endTime, status, notes, price, paymentStatus) VALUES
-- Agendamentos para hoje e próximos dias
(1, 7, 1, 4, CURDATE(), '10:00:00', '11:00:00', 'confirmed', 'Cliente preferiu corte mais curto', 45.00, 'pending'),
(1, 8, 2, 5, CURDATE(), '14:00:00', '14:30:00', 'scheduled', '', 25.00, 'pending'),
(1, 9, 5, 4, CURDATE(), '15:00:00', '15:45:00', 'confirmed', 'Cor: vermelho escuro', 20.00, 'paid'),

-- Agendamentos para amanhã
(1, 10, 3, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '12:00:00', 'scheduled', 'Primeira vez fazendo progressiva', 120.00, 'pending'),
(2, 7, 9, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '12:30:00', 'confirmed', '', 55.00, 'pending'),
(2, 8, 12, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:00:00', '16:30:00', 'scheduled', 'Design mais marcado', 30.00, 'pending'),

-- Agendamentos concluídos (últimos 7 dias)
(1, 7, 4, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:00:00', '12:00:00', 'completed', 'Coloração loira', 80.00, 'paid'),
(1, 9, 7, 4, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '14:00:00', '15:30:00', 'completed', '', 60.00, 'paid'),
(2, 10, 11, 6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '15:00:00', '17:30:00', 'completed', 'Luzes platinadas', 100.00, 'paid'),

-- Agendamento cancelado
(1, 8, 8, 5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '16:00:00', '17:00:00', 'cancelled', 'Reagendamento solicitado', 70.00, 'refunded');

-- Reviews (Avaliações dos serviços concluídos)
INSERT INTO reviews (appointmentId, salonId, clientId, providerId, rating, comment, isVisible) VALUES
(7, 1, 7, 4, 5, 'Adorei o resultado! Ana é uma excelente profissional, super atenciosa e cuidadosa. Recomendo!', true),
(8, 1, 9, 4, 4, 'Limpeza de pele muito bem feita, pele ficou lisinha. Só achei o ambiente um pouco barulhento.', true),
(9, 2, 10, 6, 5, 'Juliana fez um trabalho incrível nas luzes! Ficou exatamente como eu queria. Voltarei com certeza!', true);

-- Email Templates (Templates de email padrão)
INSERT INTO email_templates (salonId, name, subject, htmlContent, textContent, type, variables) VALUES
-- Templates globais (salonId = NULL)
(NULL, 'Confirmação de Agendamento', 'Seu agendamento foi confirmado - {{salon_name}}', 
'<h2>Agendamento Confirmado!</h2><p>Olá {{client_name}},</p><p>Seu agendamento foi confirmado:</p><ul><li><strong>Serviço:</strong> {{service_name}}</li><li><strong>Data:</strong> {{appointment_date}}</li><li><strong>Horário:</strong> {{appointment_time}}</li><li><strong>Profissional:</strong> {{provider_name}}</li><li><strong>Valor:</strong> R$ {{price}}</li></ul><p>Endereço: {{salon_address}}</p><p>Em caso de dúvidas, entre em contato: {{salon_phone}}</p>',
'Agendamento Confirmado!\n\nOlá {{client_name}},\n\nSeu agendamento foi confirmado:\n- Serviço: {{service_name}}\n- Data: {{appointment_date}}\n- Horário: {{appointment_time}}\n- Profissional: {{provider_name}}\n- Valor: R$ {{price}}\n\nEndereço: {{salon_address}}\nTelefone: {{salon_phone}}',
'appointment_confirmation', 
'["client_name", "service_name", "appointment_date", "appointment_time", "provider_name", "price", "salon_name", "salon_address", "salon_phone"]'),

(NULL, 'Lembrete de Agendamento', 'Lembrete: Seu agendamento é amanhã - {{salon_name}}',
'<h2>Lembrete de Agendamento</h2><p>Olá {{client_name}},</p><p>Lembramos que você tem um agendamento amanhã:</p><ul><li><strong>Serviço:</strong> {{service_name}}</li><li><strong>Data:</strong> {{appointment_date}}</li><li><strong>Horário:</strong> {{appointment_time}}</li><li><strong>Profissional:</strong> {{provider_name}}</li></ul><p>Nos vemos em breve!</p><p>{{salon_name}}<br>{{salon_phone}}</p>',
'Lembrete de Agendamento\n\nOlá {{client_name}},\n\nLembramos que você tem um agendamento amanhã:\n- Serviço: {{service_name}}\n- Data: {{appointment_date}}\n- Horário: {{appointment_time}}\n- Profissional: {{provider_name}}\n\nNos vemos em breve!\n\n{{salon_name}}\n{{salon_phone}}',
'appointment_reminder',
'["client_name", "service_name", "appointment_date", "appointment_time", "provider_name", "salon_name", "salon_phone"]'),

(NULL, 'Agendamento Cancelado', 'Seu agendamento foi cancelado - {{salon_name}}',
'<h2>Agendamento Cancelado</h2><p>Olá {{client_name}},</p><p>Informamos que seu agendamento foi cancelado:</p><ul><li><strong>Serviço:</strong> {{service_name}}</li><li><strong>Data:</strong> {{appointment_date}}</li><li><strong>Horário:</strong> {{appointment_time}}</li></ul><p>{{cancel_reason}}</p><p>Para reagendar, entre em contato conosco.</p><p>{{salon_name}}<br>{{salon_phone}}</p>',
'Agendamento Cancelado\n\nOlá {{client_name}},\n\nInformamos que seu agendamento foi cancelado:\n- Serviço: {{service_name}}\n- Data: {{appointment_date}}\n- Horário: {{appointment_time}}\n\n{{cancel_reason}}\n\nPara reagendar, entre em contato conosco.\n\n{{salon_name}}\n{{salon_phone}}',
'appointment_cancelled',
'["client_name", "service_name", "appointment_date", "appointment_time", "cancel_reason", "salon_name", "salon_phone"]'),

-- Templates específicos do Salão Bella Vita
(1, 'Boas-vindas Bella Vita', 'Bem-vindo ao Salão Bella Vita!',
'<h2>Bem-vindo ao Salão Bella Vita!</h2><p>Olá {{client_name}},</p><p>É um prazer tê-lo(a) como nosso cliente! Estamos aqui para cuidar da sua beleza com todo carinho e profissionalismo.</p><p>Nossos serviços incluem cortes, coloração, tratamentos capilares, manicure, pedicure e muito mais.</p><p>Horário de funcionamento:<br>Segunda a Sexta: 9h às 19h<br>Sábado: 8h às 18h</p><p>Até breve!<br>Equipe Bella Vita</p>',
'Bem-vindo ao Salão Bella Vita!\n\nOlá {{client_name}},\n\nÉ um prazer tê-lo(a) como nosso cliente! Estamos aqui para cuidar da sua beleza com todo carinho e profissionalismo.\n\nNossos serviços incluem cortes, coloração, tratamentos capilares, manicure, pedicure e muito mais.\n\nHorário de funcionamento:\nSegunda a Sexta: 9h às 19h\nSábado: 8h às 18h\n\nAté breve!\nEquipe Bella Vita',
'welcome_new_client',
'["client_name"]');

-- Notifications (Notificações de exemplo)
INSERT INTO notifications (userId, type, title, message, data, isRead) VALUES
-- Notificações para os proprietários
(2, 'new_appointment', 'Novo Agendamento', 'Fernanda Lima agendou um Corte Feminino para hoje às 10:00', '{"appointmentId": 1, "clientName": "Fernanda Lima", "serviceName": "Corte Feminino"}', false),
(2, 'appointment_cancelled', 'Agendamento Cancelado', 'Roberto Alves cancelou a Massagem Relaxante de ontem', '{"appointmentId": 10, "clientName": "Roberto Alves", "serviceName": "Massagem Relaxante"}', true),
(2, 'new_review', 'Nova Avaliação', 'Fernanda Lima deixou uma avaliação de 5 estrelas', '{"reviewId": 1, "rating": 5, "clientName": "Fernanda Lima"}', false),

(3, 'trial_ending', 'Trial Terminando', 'Seu período de teste termina em 5 dias. Assine agora!', '{"daysRemaining": 5}', false),
(3, 'new_appointment', 'Novo Agendamento', 'Fernanda Lima agendou um Corte + Escova para amanhã', '{"appointmentId": 5, "clientName": "Fernanda Lima", "serviceName": "Corte + Escova"}', false),

-- Notificações para funcionários
(4, 'schedule_reminder', 'Lembrete de Horário', 'Você tem 3 agendamentos hoje', '{"appointmentCount": 3}', true),
(6, 'appointment_update', 'Agendamento Atualizado', 'Roberto Alves reagendou o Design de Sobrancelha', '{"appointmentId": 6, "clientName": "Roberto Alves"}', false);

-- Salon Statistics (Estatísticas dos últimos 30 dias)
INSERT INTO salon_statistics (salonId, date, totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments, totalRevenue, totalClients, newClients, averageRating, totalReviews) VALUES
-- Salão Bella Vita - últimos 7 dias
(1, CURDATE(), 3, 0, 0, 0, 90.00, 3, 0, 4.50, 2),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 1, 1, 0, 0.00, 2, 0, 4.50, 2),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 1, 0, 0, 80.00, 1, 0, 5.00, 1),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 1, 1, 0, 0, 60.00, 1, 0, 4.00, 1),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 0, 0, 0, 0, 0.00, 0, 0, 0.00, 0),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 2, 2, 0, 0, 105.00, 2, 1, 0.00, 0),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 1, 1, 0, 0, 45.00, 1, 0, 0.00, 0),

-- Espaço Beleza & Arte - últimos 7 dias
(2, CURDATE(), 0, 0, 0, 0, 0.00, 0, 0, 5.00, 1),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 3, 1, 0, 0, 100.00, 2, 0, 5.00, 1),
(2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 1, 0, 0, 55.00, 1, 0, 0.00, 0),
(2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 0, 0, 0, 0, 0.00, 0, 0, 0.00, 0),
(2, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 2, 2, 0, 0, 85.00, 2, 1, 0.00, 0),
(2, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1, 1, 0, 0, 40.00, 1, 0, 0.00, 0),
(2, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 0, 0, 0, 0, 0.00, 0, 0, 0.00, 0);

-- Availability Exceptions (Exceções de disponibilidade - feriados e folgas)
INSERT INTO availability_exceptions (userId, salonId, date, isAvailable, reason) VALUES
-- Próximo feriado - Dia da Independência
(4, 1, '2025-09-07', false, 'Feriado Nacional - Independência do Brasil'),
(5, 1, '2025-09-07', false, 'Feriado Nacional - Independência do Brasil'),
(6, 2, '2025-09-07', false, 'Feriado Nacional - Independência do Brasil'),

-- Folgas programadas
(4, 1, DATE_ADD(CURDATE(), INTERVAL 10 DAY), false, 'Folga solicitada'),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 15 DAY), false, 'Férias programadas');

-- File Uploads (Exemplo de uploads de imagens)
INSERT INTO file_uploads (userId, salonId, originalName, filename, mimetype, size, path, entityType, entityId) VALUES
-- Logos dos salões
(2, 1, 'logo-bella-vita.png', 'salon_1_logo_1625847236.png', 'image/png', 45231, '/storage/uploads/salons/salon_1_logo_1625847236.png', 'salon_logo', 1),
(3, 2, 'logo-espaco-beleza.jpg', 'salon_2_logo_1625847891.jpg', 'image/jpeg', 67894, '/storage/uploads/salons/salon_2_logo_1625847891.jpg', 'salon_logo', 2),

-- Fotos de serviços
(2, 1, 'corte-feminino-1.jpg', 'service_1_photo_1625848123.jpg', 'image/jpeg', 89456, '/storage/uploads/services/service_1_photo_1625848123.jpg', 'service_photo', 1),
(2, 1, 'progressiva-antes-depois.jpg', 'service_3_photo_1625848234.jpg', 'image/jpeg', 156789, '/storage/uploads/services/service_3_photo_1625848234.jpg', 'service_photo', 3),
(3, 2, 'luzes-platinadas.jpg', 'service_11_photo_1625848345.jpg', 'image/jpeg', 123456, '/storage/uploads/services/service_11_photo_1625848345.jpg', 'service_photo', 11);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Final message
SELECT 'Database seeded successfully with sample data for Beautiful SaaS (Olivyx)!' as message;