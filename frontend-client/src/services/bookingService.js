/**
 * Beautiful SaaS - Booking Service
 * Serviços relacionados a agendamentos
 */

import api, { apiMethods } from './api';

export const bookingService = {
  // Get available services
  async getServices(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.salonId) params.append('salon_id', filters.salonId);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      
      const response = await apiMethods.get(`/public/services?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Get service details
  async getServiceDetails(serviceId) {
    try {
      const response = await apiMethods.get(`/public/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service details:', error);
      throw error;
    }
  },

  // Get available professionals for a service
  async getAvailableProfessionals(serviceId, date = null) {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      const response = await apiMethods.get(
        `/public/services/${serviceId}/professionals?${params}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }
  },

  // Get available time slots
  async getAvailableSlots(serviceId, professionalId, date) {
    try {
      const params = new URLSearchParams({
        service_id: serviceId,
        professional_id: professionalId,
        date: date,
      });
      
      const response = await apiMethods.get(`/public/available-slots?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  },

  // Create booking
  async createBooking(bookingData) {
    try {
      const response = await apiMethods.post('/public/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get booking details
  async getBookingDetails(bookingId, token = null) {
    try {
      const params = token ? `?token=${token}` : '';
      const response = await apiMethods.get(`/public/bookings/${bookingId}${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  // Cancel booking
  async cancelBooking(bookingId, reason = '', token = null) {
    try {
      const data = { reason };
      if (token) data.token = token;
      
      const response = await apiMethods.post(`/public/bookings/${bookingId}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw error;
    }
  },

  // Reschedule booking
  async rescheduleBooking(bookingId, newDateTime, token = null) {
    try {
      const data = { 
        new_date: newDateTime.date,
        new_time: newDateTime.time 
      };
      if (token) data.token = token;
      
      const response = await apiMethods.post(`/public/bookings/${bookingId}/reschedule`, data);
      return response.data;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      throw error;
    }
  },

  // Get salon information
  async getSalonInfo(salonId) {
    try {
      const response = await apiMethods.get(`/public/salons/${salonId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salon info:', error);
      throw error;
    }
  },

  // Search salons
  async searchSalons(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.location) params.append('location', filters.location);
      if (filters.service) params.append('service', filters.service);
      if (filters.radius) params.append('radius', filters.radius);
      if (filters.latitude) params.append('lat', filters.latitude);
      if (filters.longitude) params.append('lng', filters.longitude);
      
      const response = await apiMethods.get(`/public/salons?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching salons:', error);
      throw error;
    }
  },

  // Get salon reviews
  async getSalonReviews(salonId, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await apiMethods.get(`/public/salons/${salonId}/reviews?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching salon reviews:', error);
      throw error;
    }
  },

  // Submit review
  async submitReview(bookingId, reviewData, token = null) {
    try {
      const data = { ...reviewData };
      if (token) data.token = token;
      
      const response = await apiMethods.post(`/public/bookings/${bookingId}/review`, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  // Get service categories
  async getServiceCategories() {
    try {
      const response = await apiMethods.get('/public/service-categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      throw error;
    }
  },

  // Check availability for multiple days
  async checkAvailability(serviceId, professionalId, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        service_id: serviceId,
        professional_id: professionalId,
        start_date: startDate,
        end_date: endDate,
      });
      
      const response = await apiMethods.get(`/public/check-availability?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  // Get popular services
  async getPopularServices(limit = 6) {
    try {
      const response = await apiMethods.get(`/public/popular-services?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular services:', error);
      throw error;
    }
  },

  // Get featured salons
  async getFeaturedSalons(limit = 4) {
    try {
      const response = await apiMethods.get(`/public/featured-salons?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured salons:', error);
      throw error;
    }
  },

  // Validate booking data before submission
  validateBookingData(bookingData) {
    const errors = {};

    // Required fields validation
    if (!bookingData.service_id) {
      errors.service_id = 'Selecione um serviço';
    }

    if (!bookingData.professional_id) {
      errors.professional_id = 'Selecione um profissional';
    }

    if (!bookingData.date) {
      errors.date = 'Selecione uma data';
    }

    if (!bookingData.time) {
      errors.time = 'Selecione um horário';
    }

    // Customer data validation
    if (!bookingData.customer_name || bookingData.customer_name.trim().length < 2) {
      errors.customer_name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!bookingData.customer_phone) {
      errors.customer_phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(bookingData.customer_phone)) {
      errors.customer_phone = 'Formato de telefone inválido';
    }

    if (!bookingData.customer_email) {
      errors.customer_email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customer_email)) {
      errors.customer_email = 'E-mail inválido';
    }

    // Date validation
    if (bookingData.date) {
      const selectedDate = new Date(bookingData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.date = 'Data não pode ser no passado';
      }

      // Check if date is too far in the future (e.g., 6 months)
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      if (selectedDate > maxDate) {
        errors.date = 'Data muito distante no futuro';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Format booking data for API
  formatBookingData(formData) {
    return {
      service_id: parseInt(formData.service_id),
      professional_id: parseInt(formData.professional_id),
      date: formData.date,
      time: formData.time,
      customer_name: formData.customer_name.trim(),
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email.toLowerCase().trim(),
      notes: formData.notes?.trim() || '',
    };
  }
};

export default bookingService;