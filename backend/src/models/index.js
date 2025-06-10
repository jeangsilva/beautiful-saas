// ===========================
// backend/src/models/index.js (1/7)
// ===========================
const { Sequelize } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Importar models
const Company = require('./Company')(sequelize, Sequelize.DataTypes);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
const Service = require('./Service')(sequelize, Sequelize.DataTypes);
const ServiceCategory = require('./ServiceCategory')(sequelize, Sequelize.DataTypes);
const Booking = require('./Booking')(sequelize, Sequelize.DataTypes);
const Subscription = require('./Subscription')(sequelize, Sequelize.DataTypes);

// Objeto com todos os models
const models = {
  Company,
  User,
  Customer,
  Service,
  ServiceCategory,
  Booking,
  Subscription,
  sequelize,
  Sequelize
};

// ===========================
// RELACIONAMENTOS
// ===========================

// Company (1:N)
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });
Company.hasMany(Customer, { foreignKey: 'company_id', as: 'customers' });
Company.hasMany(Service, { foreignKey: 'company_id', as: 'services' });
Company.hasMany(ServiceCategory, { foreignKey: 'company_id', as: 'categories' });
Company.hasMany(Booking, { foreignKey: 'company_id', as: 'bookings' });
Company.hasOne(Subscription, { foreignKey: 'company_id', as: 'subscription' });

// User (N:1)
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
User.hasMany(Booking, { foreignKey: 'professional_id', as: 'professionalBookings' });

// Customer (N:1)
Customer.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Customer.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings' });

// Service (N:1)
Service.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Service.belongsTo(ServiceCategory, { foreignKey: 'category_id', as: 'category' });
Service.hasMany(Booking, { foreignKey: 'service_id', as: 'bookings' });

// ServiceCategory (N:1)
ServiceCategory.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
ServiceCategory.hasMany(Service, { foreignKey: 'category_id', as: 'services' });

// Booking (N:1)
Booking.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Booking.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Booking.belongsTo(User, { foreignKey: 'professional_id', as: 'professional' });
Booking.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Subscription (1:1)
Subscription.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

// Executar associações se existirem
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;