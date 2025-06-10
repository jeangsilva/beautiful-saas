// ===========================
// backend/src/controllers/BookingController.js (2/8)
// ===========================
const { Booking, Customer, User, Service, Company } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const { validateBooking } = require('../utils/validators');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

class BookingController {
  // Listar agendamentos
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        professional_id,
        date_start,
        date_end,
        customer_id
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { company_id: req.company.id };

      // Aplicar filtros
      if (status) where.status = status;
      if (customer_id) where.customer_id = customer_id;
      if (date_start && date_end) {
        where.booking_date = {
          [Op.between]: [date_start, date_end]
        };
      }

      // Se for profissional, só ver seus próprios agendamentos
      if (req.user.role === 'professional') {
        where.professional_id = req.user.id;
      } else if (professional_id) {
        where.professional_id = professional_id;
      }

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where,
        include: [
          { 
            model: Customer, 
            as: 'customer', 
            attributes: ['id', 'name', 'phone', 'email'] 
          },
          { 
            model: User, 
            as: 'professional', 
            attributes: ['id', 'name', 'avatar_url'] 
          },
          { 
            model: Service, 
            as: 'service', 
            attributes: ['id', 'name', 'duration_minutes'] 
          }
        ],
        order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          bookings,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar agendamento
  async store(req, res) {
    try {
      const { error } = validateBooking(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const {
        customer_data,
        professional_id,
        service_id,
        booking_date,
        start_time,
        customer_notes
      } = req.body;

      // Buscar ou criar cliente
      let customer = await Customer.findOne({
        where: {
          company_id: req.company.id,
          [Op.or]: [
            { phone: customer_data.phone },
            ...(customer_data.email ? [{ email: customer_data.email }] : [])
          ]
        }
      });

      if (!customer) {
        customer = await Customer.create({
          ...customer_data,
          company_id: req.company.id
        });
      }

      // Buscar serviço para calcular horário
      const service = await Service.findOne({
        where: { id: service_id, company_id: req.company.id, is_active: true }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Calcular horário de fim
      const end_time = moment(start_time, 'HH:mm')
        .add(service.duration_minutes, 'minutes')
        .format('HH:mm');

      // Verificar disponibilidade
      const isAvailable = await this.checkAvailability(
        req.company.id,
        professional_id,
        booking_date,
        start_time,
        end_time
      );

      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Horário não disponível'
        });
      }

      // Criar agendamento
      const booking = await Booking.create({
        company_id: req.company.id,
        customer_id: customer.id,
        professional_id,
        service_id,
        booking_date,
        start_time,
        end_time,
        original_price: service.price,
        final_price: service.price,
        customer_notes,
        status: 'confirmed',
        confirmed_at: new Date()
      });

      // Buscar agendamento completo
      const fullBooking = await Booking.findByPk(booking.id, {
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'professional' },
          { model: Service, as: 'service' },
          { model: Company, as: 'company' }
        ]
      });

      // Enviar notificações
      await EmailService.sendBookingConfirmation(fullBooking);

      // Atualizar estatísticas do cliente
      await customer.increment('total_bookings');
      await customer.update({ 
        last_booking_at: new Date(),
        total_spent: customer.total_spent + parseFloat(service.price)
      });

      logger.info(`Agendamento criado: ${booking.id} para ${customer.name}`);

      res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: { booking: fullBooking }
      });
    } catch (error) {
      logger.error('Erro ao criar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar agendamento por ID
  async show(req, res) {
    try {
      const { id } = req.params;
      const where = { id, company_id: req.company.id };

      // Se for profissional, só ver seus próprios agendamentos
      if (req.user.role === 'professional') {
        where.professional_id = req.user.id;
      }

      const booking = await Booking.findOne({
        where,
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'professional' },
          { model: Service, as: 'service' }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: { booking }
      });
    } catch (error) {
      logger.error('Erro ao buscar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar status do agendamento
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, cancellation_reason } = req.body;

      const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      const where = { id, company_id: req.company.id };

      // Se for profissional, só pode atualizar seus próprios agendamentos
      if (req.user.role === 'professional') {
        where.professional_id = req.user.id;
      }

      const booking = await Booking.findOne({ 
        where,
        include: [
          { model: Customer, as: 'customer' },
          { model: User, as: 'professional' },
          { model: Service, as: 'service' },
          { model: Company, as: 'company' }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      // Preparar dados de atualização
      const updateData = { status };
      
      if (status === 'cancelled') {
        updateData.cancellation_reason = cancellation_reason;
        updateData.cancelled_at = new Date();
      } else if (status === 'in_progress') {
        updateData.started_at = new Date();
      } else if (status === 'completed') {
        updateData.completed_at = new Date();
      } else if (status === 'confirmed') {
        updateData.confirmed_at = new Date();
      }

      await booking.update(updateData);

      // Enviar notificações baseadas no status
      if (status === 'cancelled') {
        await EmailService.sendBookingCancellation(booking);
      } else if (status === 'completed') {
        await EmailService.sendBookingCompletion(booking);
      }

      logger.info(`Status do agendamento ${id} alterado para: ${status}`);

      res.json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: { booking }
      });
    } catch (error) {
      logger.error('Erro ao atualizar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar horários disponíveis
  async availableSlots(req, res) {
    try {
      const { professional_id, service_id, date } = req.query;

      if (!professional_id || !service_id || !date) {
        return res.status(400).json({
          success: false,
          message: 'professional_id, service_id e date são obrigatórios'
        });
      }

      // Buscar serviço
      const service = await Service.findOne({
        where: { id: service_id, company_id: req.company.id, is_active: true }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Buscar agendamentos existentes
      const existingBookings = await Booking.findAll({
        where: {
          company_id: req.company.id,
          professional_id,
          booking_date: date,
          status: { [Op.notIn]: ['cancelled', 'no_show'] }
        },
        attributes: ['start_time', 'end_time']
      });

      // Gerar slots disponíveis
      const slots = this.generateAvailableSlots(
        req.company.working_start_time,
        req.company.working_end_time,
        service.duration_minutes,
        req.company.booking_interval_minutes,
        existingBookings
      );

      res.json({
        success: true,
        data: { slots }
      });
    } catch (error) {
      logger.error('Erro ao buscar horários disponíveis:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Verificar disponibilidade de horário
  async checkAvailability(companyId, professionalId, date, startTime, endTime) {
    const conflictingBooking = await Booking.findOne({
      where: {
        company_id: companyId,
        professional_id: professionalId,
        booking_date: date,
        status: { [Op.notIn]: ['cancelled', 'no_show'] },
        [Op.or]: [
          {
            start_time: { [Op.between]: [startTime, endTime] }
          },
          {
            end_time: { [Op.between]: [startTime, endTime] }
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: startTime } },
              { end_time: { [Op.gte]: endTime } }
            ]
          }
        ]
      }
    });

    return !conflictingBooking;
  }

  // Gerar slots disponíveis
  generateAvailableSlots(startTime, endTime, serviceDuration, interval, existingBookings) {
    const slots = [];
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');

    while (start.clone().add(serviceDuration, 'minutes').isSameOrBefore(end)) {
      const slotStart = start.format('HH:mm');
      const slotEnd = start.clone().add(serviceDuration, 'minutes').format('HH:mm');

      // Verificar conflitos
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = moment(booking.start_time, 'HH:mm');
        const bookingEnd = moment(booking.end_time, 'HH:mm');
        const slotStartMoment = moment(slotStart, 'HH:mm');
        const slotEndMoment = moment(slotEnd, 'HH:mm');

        return slotStartMoment.isBefore(bookingEnd) && slotEndMoment.isAfter(bookingStart);
      });

      if (!hasConflict) {
        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available: true
        });
      }

      start.add(interval, 'minutes');
    }

    return slots;
  }
}

module.exports = new BookingController();