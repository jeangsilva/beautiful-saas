// ===========================
// backend/src/models/Booking.js (7/7)
// ===========================
module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
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
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      professional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id'
        }
      },
      
      // Data e horário
      booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Data do agendamento deve ser uma data válida' },
          isAfter: { args: new Date().toISOString().split('T')[0], msg: 'Data do agendamento deve ser futura' }
        }
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          is: { args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:?[0-5]?[0-9]?$/, msg: 'Horário de início deve estar no formato HH:MM' }
        }
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
          is: { args: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:?[0-5]?[0-9]?$/, msg: 'Horário de fim deve estar no formato HH:MM' }
        }
      },
      
      // Valores
      original_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0, msg: 'Preço original não pode ser negativo' }
        }
      },
      final_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: { args: 0, msg: 'Preço final não pode ser negativo' }
        }
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        validate: {
          min: { args: 0, msg: 'Desconto não pode ser negativo' }
        }
      },
      discount_reason: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      
      // Status
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']],
            msg: 'Status deve ser: pending, confirmed, in_progress, completed, cancelled ou no_show'
          }
        }
      },
      payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'partial', 'refunded'),
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending', 'paid', 'partial', 'refunded']],
            msg: 'Status de pagamento deve ser: pending, paid, partial ou refunded'
          }
        }
      },
      
      // Observações
      customer_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 500], msg: 'Observações do cliente devem ter no máximo 500 caracteres' }
        }
      },
      internal_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 1000], msg: 'Observações internas devem ter no máximo 1000 caracteres' }
        }
      },
      cancellation_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      
      // Timestamps importantes
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      // Controle de notificações
      reminder_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      confirmation_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'bookings',
      timestamps: true,
      indexes: [
        { fields: ['company_id', 'booking_date'] },
        { fields: ['professional_id', 'booking_date'] },
        { fields: ['customer_id', 'booking_date'] },
        { fields: ['service_id'] },
        { fields: ['status'] },
        { fields: ['booking_date', 'start_time'] }
      ],
      hooks: {
        beforeValidate: (booking) => {
          // Validar se horário de fim é depois do início
          if (booking.start_time && booking.end_time) {
            const start = new Date(`2000-01-01 ${booking.start_time}`);
            const end = new Date(`2000-01-01 ${booking.end_time}`);
            
            if (end <= start) {
              throw new Error('Horário de fim deve ser posterior ao horário de início');
            }
          }
          
          // Calcular desconto automaticamente
          if (booking.original_price && booking.final_price) {
            booking.discount_amount = booking.original_price - booking.final_price;
          }
        }
      }
    });
  
    // Métodos da instância
    Booking.prototype.getFormattedDate = function() {
      return new Date(this.booking_date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
  
    Booking.prototype.getFormattedTime = function() {
      return `${this.start_time.substring(0, 5)} às ${this.end_time.substring(0, 5)}`;
    };
  
    Booking.prototype.getDurationMinutes = function() {
      const start = new Date(`2000-01-01 ${this.start_time}`);
      const end = new Date(`2000-01-01 ${this.end_time}`);
      return Math.round((end - start) / (1000 * 60));
    };
  
    Booking.prototype.canBeCancelled = function() {
      const now = new Date();
      const bookingDateTime = new Date(`${this.booking_date} ${this.start_time}`);
      return ['pending', 'confirmed'].includes(this.status) && bookingDateTime > now;
    };
  
    Booking.prototype.isUpcoming = function() {
      const now = new Date();
      const bookingDateTime = new Date(`${this.booking_date} ${this.start_time}`);
      return bookingDateTime > now && ['pending', 'confirmed'].includes(this.status);
    };
  
    return Booking;
  };
  