// ===========================
// backend/src/models/Service.js (6/7)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('Service', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'service_categories',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Nome do serviço é obrigatório' },
          len: { args: [2, 100], msg: 'Nome deve ter entre 2 e 100 caracteres' }
        }
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          is: { args: /^[a-z0-9-]+$/, msg: 'Slug deve conter apenas letras minúsculas, números e hífens' }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 1000], msg: 'Descrição deve ter no máximo 1000 caracteres' }
        }
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0.01, msg: 'Preço deve ser maior que zero' },
          max: { args: 9999.99, msg: 'Preço não pode exceder R$ 9.999,99' }
        }
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: 15, msg: 'Duração mínima é 15 minutos' },
          max: { args: 480, msg: 'Duração máxima é 8 horas' }
        }
      },
      buffer_time_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: 'Tempo de intervalo não pode ser negativo' },
          max: { args: 60, msg: 'Tempo de intervalo não pode exceder 60 minutos' }
        }
      },
      
      // Configurações
      requires_deposit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      deposit_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        validate: {
          min: { args: 0, msg: 'Valor do depósito não pode ser negativo' }
        }
      },
      max_advance_booking_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: { args: 1, msg: 'Antecedência mínima é 1 dia' },
          max: { args: 365, msg: 'Antecedência máxima é 365 dias' }
        }
      },
      min_advance_booking_hours: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        validate: {
          min: { args: 0, msg: 'Antecedência mínima não pode ser negativa' },
          max: { args: 168, msg: 'Antecedência mínima não pode exceder 7 dias' }
        }
      },
      
      // SEO e mídia
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 160], msg: 'Meta descrição deve ter no máximo 160 caracteres' }
        }
      },
      
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'services',
      timestamps: true,
      indexes: [
        { fields: ['company_id'] },
        { unique: true, fields: ['company_id', 'slug'] },
        { fields: ['category_id'] },
        { fields: ['price'] },
        { fields: ['duration_minutes'] },
        { fields: ['is_active'] }
      ],
      hooks: {
        beforeValidate: (service) => {
          // Gerar slug automaticamente se não fornecido
          if (service.name && !service.slug) {
            service.slug = service.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim('-');
          }
          
          // Validar depósito
          if (service.requires_deposit && (!service.deposit_amount || service.deposit_amount <= 0)) {
            throw new Error('Valor do depósito é obrigatório quando o serviço requer depósito');
          }
          
          if (service.deposit_amount > service.price) {
            throw new Error('Valor do depósito não pode ser maior que o preço do serviço');
          }
        }
      }
    });
  
    // Métodos da instância
    Service.prototype.getFormattedPrice = function() {
      return `R$ ${this.price.toFixed(2).replace('.', ',')}`;
    };
  
    Service.prototype.getFormattedDuration = function() {
      const hours = Math.floor(this.duration_minutes / 60);
      const minutes = this.duration_minutes % 60;
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}min`;
      }
    };
  
    Service.prototype.getTotalDuration = function() {
      return this.duration_minutes + this.buffer_time_minutes;
    };
  
    return Service;
  };
  