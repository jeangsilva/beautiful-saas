// ===========================
// backend/src/models/Company.js (2/7)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Nome da empresa é obrigatório' },
          len: { args: [2, 100], msg: 'Nome deve ter entre 2 e 100 caracteres' }
        }
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: 'Este slug já está em uso' },
        validate: {
          is: { args: /^[a-z0-9-]+$/, msg: 'Slug deve conter apenas letras minúsculas, números e hífens' },
          len: { args: [3, 100], msg: 'Slug deve ter entre 3 e 100 caracteres' }
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: 'Este email já está em uso' },
        validate: {
          isEmail: { msg: 'Email deve ter um formato válido' }
        }
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: { args: /^\(\d{2}\)\s\d{4,5}-\d{4}$/, msg: 'Telefone deve estar no formato (11) 99999-9999' }
        }
      },
      document: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'CNPJ ou CPF da empresa'
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: { args: [2, 2], msg: 'Estado deve ter 2 caracteres' }
        }
      },
      zip_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          is: { args: /^\d{5}-?\d{3}$/, msg: 'CEP deve estar no formato 00000-000' }
        }
      },
      logo_url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: { msg: 'Website deve ser uma URL válida' }
        }
      },
      instagram: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      whatsapp: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      
      // Configurações de agendamento
      booking_advance_days: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        validate: {
          min: { args: 1, msg: 'Deve permitir agendamento com pelo menos 1 dia de antecedência' },
          max: { args: 365, msg: 'Não pode exceder 365 dias de antecedência' }
        }
      },
      booking_interval_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        validate: {
          isIn: { args: [[15, 30, 60]], msg: 'Intervalo deve ser 15, 30 ou 60 minutos' }
        }
      },
      cancellation_hours: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        validate: {
          min: { args: 0, msg: 'Horas de cancelamento não pode ser negativo' },
          max: { args: 48, msg: 'Não pode exceder 48 horas' }
        }
      },
      working_start_time: {
        type: DataTypes.TIME,
        defaultValue: '08:00:00'
      },
      working_end_time: {
        type: DataTypes.TIME,
        defaultValue: '18:00:00'
      },
      timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'America/Sao_Paulo'
      },
      
      // Stripe e assinatura
      stripe_customer_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
      },
      subscription_status: {
        type: DataTypes.ENUM('trial', 'active', 'past_due', 'canceled', 'suspended'),
        defaultValue: 'trial'
      },
      trial_ends_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      subscription_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      // Status
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'companies',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['slug'] },
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['stripe_customer_id'] },
        { fields: ['subscription_status'] },
        { fields: ['is_active'] }
      ],
      hooks: {
        beforeValidate: (company) => {
          // Gerar slug automaticamente se não fornecido
          if (company.name && !company.slug) {
            company.slug = company.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim('-');
          }
        }
      }
    });
  
    // Métodos da instância
    Company.prototype.getBookingUrl = function() {
      return `${process.env.APP_URL}/${this.slug}`;
    };
  
    Company.prototype.isSubscriptionActive = function() {
      return ['trial', 'active'].includes(this.subscription_status);
    };
  
    Company.prototype.isInTrial = function() {
      return this.subscription_status === 'trial' && 
             this.trial_ends_at && 
             new Date() < this.trial_ends_at;
    };
  
    return Company;
  };
  