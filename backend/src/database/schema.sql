-- Beautiful SaaS (Olivyx) - Database Schema
-- Sistema de agendamento para beleza
-- Created: 2025

-- Create database
CREATE DATABASE IF NOT EXISTS olivyx_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE olivyx_saas;

-- Users table (Sistema de usuários multi-tenant)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(500),
    role ENUM('super_admin', 'salon_owner', 'employee', 'client') DEFAULT 'client',
    isActive BOOLEAN DEFAULT true,
    emailVerified BOOLEAN DEFAULT false,
    emailVerificationToken VARCHAR(255),
    passwordResetToken VARCHAR(255),
    passwordResetExpires DATETIME,
    lastLogin DATETIME,
    preferences JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (isActive)
);

-- Salons table (Salões de beleza)
CREATE TABLE salons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ownerId INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zipCode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Brazil',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    logo VARCHAR(500),
    coverImage VARCHAR(500),
    gallery JSON,
    socialMedia JSON,
    businessHours JSON,
    timezone VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    isActive BOOLEAN DEFAULT true,
    isPremium BOOLEAN DEFAULT false,
    subscriptionStatus ENUM('trial', 'active', 'past_due', 'canceled', 'incomplete') DEFAULT 'trial',
    subscriptionId VARCHAR(255),
    trialEndsAt DATETIME,
    settings JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (ownerId),
    INDEX idx_slug (slug),
    INDEX idx_active (isActive),
    INDEX idx_city (city),
    INDEX idx_subscription (subscriptionStatus)
);

-- Salon Members table (Funcionários do salão)
CREATE TABLE salon_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT NOT NULL,
    userId INT NOT NULL,
    role ENUM('owner', 'manager', 'employee') DEFAULT 'employee',
    permissions JSON,
    isActive BOOLEAN DEFAULT true,
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_salon_user (salonId, userId),
    INDEX idx_salon (salonId),
    INDEX idx_user (userId),
    INDEX idx_role (role)
);

-- Services table (Serviços do salão)
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- em minutos
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    image VARCHAR(500),
    isActive BOOLEAN DEFAULT true,
    onlineBooking BOOLEAN DEFAULT true,
    requirements TEXT,
    preparationTime INT DEFAULT 0, -- tempo de preparação em minutos
    cleanupTime INT DEFAULT 0, -- tempo de limpeza em minutos
    maxAdvanceBooking INT DEFAULT 30, -- dias máximos para agendamento
    minAdvanceBooking INT DEFAULT 0, -- horas mínimas para agendamento
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salonId),
    INDEX idx_category (category),
    INDEX idx_active (isActive),
    INDEX idx_price (price)
);

-- Service Providers table (Quem pode realizar cada serviço)
CREATE TABLE service_providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    serviceId INT NOT NULL,
    userId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_service_provider (serviceId, userId),
    INDEX idx_service (serviceId),
    INDEX idx_provider (userId)
);

-- Appointments table (Agendamentos)
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT NOT NULL,
    clientId INT NOT NULL,
    serviceId INT NOT NULL,
    providerId INT NOT NULL,
    appointmentDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    internalNotes TEXT,
    price DECIMAL(10, 2),
    paymentStatus ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    paymentMethod VARCHAR(50),
    stripePaymentIntentId VARCHAR(255),
    cancelledAt DATETIME,
    cancelledBy INT,
    cancelReason TEXT,
    reminderSent BOOLEAN DEFAULT false,
    reviewRequested BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (providerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cancelledBy) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_salon (salonId),
    INDEX idx_client (clientId),
    INDEX idx_provider (providerId),
    INDEX idx_date (appointmentDate),
    INDEX idx_status (status),
    INDEX idx_payment (paymentStatus),
    INDEX idx_datetime (appointmentDate, startTime)
);

-- Reviews table (Avaliações)
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointmentId INT NOT NULL,
    salonId INT NOT NULL,
    clientId INT NOT NULL,
    providerId INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    respondedAt DATETIME,
    respondedBy INT,
    isVisible BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (providerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (respondedBy) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_salon (salonId),
    INDEX idx_client (clientId),
    INDEX idx_provider (providerId),
    INDEX idx_rating (rating),
    INDEX idx_visible (isVisible)
);

-- Availability table (Disponibilidade dos profissionais)
CREATE TABLE availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    salonId INT NOT NULL,
    dayOfWeek INT NOT NULL CHECK (dayOfWeek >= 0 AND dayOfWeek <= 6), -- 0 = Domingo
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_salon (salonId),
    INDEX idx_day (dayOfWeek)
);

-- Availability Exceptions table (Exceções de disponibilidade)
CREATE TABLE availability_exceptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    salonId INT NOT NULL,
    date DATE NOT NULL,
    startTime TIME,
    endTime TIME,
    isAvailable BOOLEAN DEFAULT false,
    reason VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_salon (salonId),
    INDEX idx_date (date)
);

-- Notifications table (Notificações)
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    isRead BOOLEAN DEFAULT false,
    readAt DATETIME,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_type (type),
    INDEX idx_read (isRead),
    INDEX idx_created (createdAt)
);

-- Subscriptions table (Assinaturas Stripe)
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT NOT NULL,
    stripeSubscriptionId VARCHAR(255) UNIQUE NOT NULL,
    stripeCustomerId VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    planId VARCHAR(100) NOT NULL,
    planName VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    currentPeriodStart DATETIME NOT NULL,
    currentPeriodEnd DATETIME NOT NULL,
    trialStart DATETIME,
    trialEnd DATETIME,
    canceledAt DATETIME,
    cancelAtPeriodEnd BOOLEAN DEFAULT false,
    metadata JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salonId),
    INDEX idx_stripe_subscription (stripeSubscriptionId),
    INDEX idx_status (status),
    INDEX idx_period_end (currentPeriodEnd)
);

-- Payment Methods table (Métodos de pagamento salvos)
CREATE TABLE payment_methods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    stripePaymentMethodId VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(50),
    last4 VARCHAR(4),
    expMonth INT,
    expYear INT,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_stripe_pm (stripePaymentMethodId),
    INDEX idx_default (isDefault)
);

-- Audit Log table (Log de auditoria)
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT,
    salonId INT,
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50) NOT NULL,
    entityId INT,
    oldData JSON,
    newData JSON,
    ipAddress VARCHAR(45),
    userAgent TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_salon (salonId),
    INDEX idx_action (action),
    INDEX idx_entity (entityType, entityId),
    INDEX idx_created (createdAt)
);

-- System Settings table (Configurações do sistema)
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description VARCHAR(255),
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    isPublic BOOLEAN DEFAULT false,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key_name),
    INDEX idx_public (isPublic)
);

-- File Uploads table (Uploads de arquivos)
CREATE TABLE file_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT,
    salonId INT,
    originalName VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    entityType VARCHAR(50),
    entityId INT,
    isPublic BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_salon (salonId),
    INDEX idx_entity (entityType, entityId),
    INDEX idx_filename (filename)
);

-- Email Templates table (Templates de email)
CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    htmlContent TEXT NOT NULL,
    textContent TEXT,
    type VARCHAR(50) NOT NULL,
    isActive BOOLEAN DEFAULT true,
    variables JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salonId),
    INDEX idx_type (type),
    INDEX idx_active (isActive)
);

-- Session Storage table (Sessões de usuário)
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    userId INT,
    data TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_expires (expiresAt)
);

-- Salon Statistics table (Estatísticas do salão)
CREATE TABLE salon_statistics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salonId INT NOT NULL,
    date DATE NOT NULL,
    totalAppointments INT DEFAULT 0,
    completedAppointments INT DEFAULT 0,
    cancelledAppointments INT DEFAULT 0,
    noShowAppointments INT DEFAULT 0,
    totalRevenue DECIMAL(10, 2) DEFAULT 0,
    totalClients INT DEFAULT 0,
    newClients INT DEFAULT 0,
    averageRating DECIMAL(3, 2) DEFAULT 0,
    totalReviews INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salonId) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salonId),
    INDEX idx_date (date),
    UNIQUE KEY unique_salon_date (salonId, date)
);