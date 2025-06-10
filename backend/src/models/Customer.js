// ===========================
// backend/src/models/Customer.js (4/7)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('Customer', {
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Nome é obrigatório' },
          len: { args: [2, 100], msg: 'Nome deve ter entre 2 e 100 caracteres' }
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: { msg: 'Email deve ter um formato válido' }
        }
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Telefone é obrigatório' },
          is: { args: /^\(\d{2}\)\s\d{4,5}-\d{4}$/, msg: 'Telefone deve estar no formato (11) 99999-9999' }
        }
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isDate: { msg: 'Data de nascimento deve ser uma data válida' },
          isBefore: { args: new Date().toISOString(), msg: 'Data de nascimento deve ser no passado' }
        }
      },
      gender: {
        type: DataTypes.ENUM('M', 'F', 'Other'),
        allowNull: true
      },
      
      // Endereço
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
      
      // Preferências
      preferred_professional_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 1000], msg: 'Observações devem ter no máximo 1000 caracteres' }
        }
      },
      
      // Marketing
      accepts_marketing: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Como o cliente chegou ao salão (Google, Instagram, etc.)'
      },
      
      // Estatísticas
      total_bookings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: 'Total de agendamentos não pode ser negativo' }
        }
      },
      total_spent: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        validate: {
          min: { args: 0, msg: 'Total gasto não pode ser negativo' }
        }
      },
      last_booking_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'customers',
      timestamps: true,
      indexes: [
        { fields: ['company_id', 'phone'] },
        { fields: ['company_id', 'email'] },
        { fields: ['company_id', 'name'] },
        { fields: ['preferred_professional_id'] },
        { fields: ['is_active'] }
      ]
    });
  
    // Métodos da instância
    Customer.prototype.getFullAddress = function() {
      const parts = [this.address, this.city, this.state, this.zip_code].filter(Boolean);
      return parts.join(', ');
    };
  
    Customer.prototype.getAge = function() {
      if (!this.birth_date) return null;
      const today = new Date();
      const birthDate = new Date(this.birth_date);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };
  
    Customer.prototype.isFrequent = function() {
      return this.total_bookings >= 5;
    };
  
    return Customer;
  };
  