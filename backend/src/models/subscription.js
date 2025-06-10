// ===========================
// backend/src/models/Subscription.js (8/7 - BÔNUS)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define('Subscription', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      stripe_subscription_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      stripe_customer_id: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      plan: {
        type: DataTypes.ENUM('starter', 'professional', 'business'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid'),
        allowNull: false
      },
      current_period_start: {
        type: DataTypes.DATE,
        allowNull: false
      },
      current_period_end: {
        type: DataTypes.DATE,
        allowNull: false
      },
      cancel_at_period_end: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      canceled_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      trial_start: {
        type: DataTypes.DATE,
        allowNull: true
      },
      trial_end: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'subscriptions',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['company_id'] },
        { unique: true, fields: ['stripe_subscription_id'] },
        { fields: ['status'] },
        { fields: ['plan'] }
      ]
    });
  
    // Métodos da instância
    Subscription.prototype.isActive = function() {
      return ['trialing', 'active'].includes(this.status);
    };
  
    Subscription.prototype.isInTrial = function() {
      return this.status === 'trialing';
    };
  
    Subscription.prototype.willCancelAtPeriodEnd = function() {
      return this.cancel_at_period_end;
    };
  
    Subscription.prototype.getRemainingDays = function() {
      const now = new Date();
      const endDate = new Date(this.current_period_end);
      const diffTime = Math.abs(endDate - now);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
  
    return Subscription;
  };