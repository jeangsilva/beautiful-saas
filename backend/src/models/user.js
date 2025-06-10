
  // ===========================
  // backend/src/models/User.js (3/7)
  // ===========================
  const bcrypt = require('bcryptjs');
  
  module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'company_admin', 'professional', 'receptionist'),
        allowNull: false,
        defaultValue: 'professional',
        validate: {
          isIn: {
            args: [['super_admin', 'company_admin', 'professional', 'receptionist']],
            msg: 'Role deve ser: super_admin, company_admin, professional ou receptionist'
          }
        }
      },
      
      // Dados profissionais (para profissionais)
      specialty: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Especialidade do profissional (ex: Barbeiro, Manicure, etc.)'
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 500], msg: 'Bio deve ter no máximo 500 caracteres' }
        }
      },
      experience_years: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: { args: 0, msg: 'Anos de experiência não pode ser negativo' },
          max: { args: 50, msg: 'Anos de experiência não pode exceder 50' }
        }
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00,
        validate: {
          min: { args: 0, msg: 'Avaliação mínima é 0' },
          max: { args: 5, msg: 'Avaliação máxima é 5' }
        }
      },
      total_reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: 'Total de avaliações não pode ser negativo' }
        }
      },
      
      // Configurações de notificação
      notifications_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      notifications_sms: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      notifications_whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      
      // Controle de acesso
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'users',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['company_id', 'role'] },
        { fields: ['role'] },
        { fields: ['is_active'] }
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password_hash')) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        }
      }
    });
  
    // Métodos da instância
    User.prototype.checkPassword = async function(password) {
      return bcrypt.compare(password, this.password_hash);
    };
  
    User.prototype.getPublicProfile = function() {
      const profile = this.toJSON();
      delete profile.password_hash;
      delete profile.email_verified_at;
      delete profile.last_login_at;
      return profile;
    };
  
    User.prototype.canManageCompany = function() {
      return ['super_admin', 'company_admin'].includes(this.role);
    };
  
    User.prototype.canManageBookings = function() {
      return ['super_admin', 'company_admin', 'receptionist'].includes(this.role);
    };
  
    return User;
  };