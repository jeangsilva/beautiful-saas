// ===========================
// backend/src/models/ServiceCategory.js (5/7)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const ServiceCategory = sequelize.define('ServiceCategory', {
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
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Nome da categoria é obrigatório' },
          len: { args: [2, 50], msg: 'Nome deve ter entre 2 e 50 caracteres' }
        }
      },
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          is: { args: /^[a-z0-9-]+$/, msg: 'Slug deve conter apenas letras minúsculas, números e hífens' }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 500], msg: 'Descrição deve ter no máximo 500 caracteres' }
        }
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Emoji ou classe de ícone para exibição'
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          is: { args: /^#[0-9A-F]{6}$/i, msg: 'Cor deve estar no formato hexadecimal #FFFFFF' }
        }
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: { args: 0, msg: 'Ordem não pode ser negativa' }
        }
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'service_categories',
      timestamps: true,
      indexes: [
        { fields: ['company_id'] },
        { unique: true, fields: ['company_id', 'slug'] },
        { fields: ['sort_order'] },
        { fields: ['is_active'] }
      ],
      hooks: {
        beforeValidate: (category) => {
          // Gerar slug automaticamente se não fornecido
          if (category.name && !category.slug) {
            category.slug = category.name
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
  
    return ServiceCategory;
  };