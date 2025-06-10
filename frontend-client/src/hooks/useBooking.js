/**
 * Beautiful SaaS - useBooking Hook
 * Hook para gerenciar estado e lógica de agendamentos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

import bookingService from '../services/bookingService';
import storageService from '../services/storageService';
import { trackBookingFunnelStep, trackBookingAbandonment, trackConversion } from '../utils/analytics';
import { formatDate, formatTime } from '../utils/formatters';
import { validateBookingData } from '../utils/validators';

const BOOKING_STEPS = {
  SERVICE_SELECTION: 'service_selection',
  PROFESSIONAL_SELECTION: 'professional_selection',
  DATETIME_SELECTION: 'datetime_selection',
  CUSTOMER_DETAILS: 'customer_details',
  CONFIRMATION: 'confirmation',
};

export const useBooking = (initialServiceId = null) => {
  const queryClient = useQueryClient();
  
  // ===== STATE =====
  const [currentStep, setCurrentStep] = useState(BOOKING_STEPS.SERVICE_SELECTION);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ===== QUERIES =====
  
  // Get services
  const { 
    data: services = [], 
    isLoading: servicesLoading,
    error: servicesError 
  } = useQuery(
    ['services'],
    () => bookingService.getServices(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Get professionals for selected service
  const { 
    data: professionals = [], 
    isLoading: professionalsLoading 
  } = useQuery(
    ['professionals', selectedService?.id, selectedDate],
    () => bookingService.getAvailableProfessionals(selectedService.id, selectedDate),
    {
      enabled: !!selectedService?.id,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Get available time slots
  const { 
    data: availableSlots = [], 
    isLoading: slotsLoading 
  } = useQuery(
    ['available-slots', selectedService?.id, selectedProfessional?.id, selectedDate],
    () => bookingService.getAvailableSlots(
      selectedService.id, 
      selectedProfessional.id, 
      selectedDate
    ),
    {
      enabled: !!(selectedService?.id && selectedProfessional?.id && selectedDate),
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );

  // ===== MUTATIONS =====
  
  // Create booking mutation
  const createBookingMutation = useMutation(
    bookingService.createBooking,
    {
      onSuccess: (data) => {
        // Clear booking draft
        storageService.clearBookingDraft();
        
        // Track conversion
        trackConversion('booking_completed', selectedService?.price || 0);
        
        // Track booking completion
        trackBookingFunnelStep(BOOKING_STEPS.CONFIRMATION, {
          booking_id: data.id,
          service_id: selectedService.id,
          professional_id: selectedProfessional.id,
        });
        
        // Add to booking history
        storageService.addBookingToHistory({
          id: data.id,
          service_name: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          professional_name: selectedProfessional.name,
          created_at: new Date().toISOString(),
        });
        
        toast.success('Agendamento realizado com sucesso!');
      },
      onError: (error) => {
        console.error('Booking creation error:', error);
        toast.error('Erro ao criar agendamento. Tente novamente.');
        
        // Track error
        trackBookingAbandonment(currentStep, 'booking_failed');
      },
    }
  );

  // ===== EFFECTS =====

  // Load draft on mount
  useEffect(() => {
    const draft = storageService.getBookingDraft();
    if (draft) {
      setSelectedService(draft.service);
      setSelectedProfessional(draft.professional);
      setSelectedDate(draft.date);
      setSelectedTime(draft.time);
      setCustomerData(draft.customerData || {});
      setCurrentStep(draft.currentStep || BOOKING_STEPS.SERVICE_SELECTION);
    }
  }, []);

  // Set initial service if provided
  useEffect(() => {
    if (initialServiceId && services.length > 0) {
      const service = services.find(s => s.id === initialServiceId);
      if (service) {
        handleServiceSelect(service);
      }
    }
  }, [initialServiceId, services]);

  // Save draft whenever booking data changes
  useEffect(() => {
    if (selectedService || selectedProfessional || selectedDate || selectedTime) {
      const draft = {
        service: selectedService,
        professional: selectedProfessional,
        date: selectedDate,
        time: selectedTime,
        customerData,
        currentStep,
      };
      storageService.saveBookingDraft(draft);
    }
  }, [selectedService, selectedProfessional, selectedDate, selectedTime, customerData, currentStep]);

  // ===== HANDLERS =====

  const handleServiceSelect = useCallback((service) => {
    setSelectedService(service);
    setSelectedProfessional(null);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(BOOKING_STEPS.PROFESSIONAL_SELECTION);
    setErrors({});
    
    // Track funnel step
    trackBookingFunnelStep(BOOKING_STEPS.SERVICE_SELECTION, {
      service_id: service.id,
      service_name: service.name,
    });
  }, []);

  const handleProfessionalSelect = useCallback((professional) => {
    setSelectedProfessional(professional);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(BOOKING_STEPS.DATETIME_SELECTION);
    setErrors({});
    
    // Track funnel step
    trackBookingFunnelStep(BOOKING_STEPS.PROFESSIONAL_SELECTION, {
      professional_id: professional.id,
      professional_name: professional.name,
    });
  }, []);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedTime('');
    setErrors({});
  }, []);

  const handleTimeSelect = useCallback((time) => {
    setSelectedTime(time);
    setCurrentStep(BOOKING_STEPS.CUSTOMER_DETAILS);
    setErrors({});
    
    // Track funnel step
    trackBookingFunnelStep(BOOKING_STEPS.DATETIME_SELECTION, {
      selected_date: date,
      selected_time: time,
    });
  }, [selectedDate]);

  const handleCustomerDataChange = useCallback((field, value) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const handleStepBack = useCallback(() => {
    const steps = Object.values(BOOKING_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      setErrors({});
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedDate('');
    setSelectedTime('');
    setCustomerData({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
    setCurrentStep(BOOKING_STEPS.SERVICE_SELECTION);
    setErrors({});
    
    // Clear draft
    storageService.clearBookingDraft();
    
    // Track abandonment
    trackBookingAbandonment(currentStep, 'user_reset');
  }, [currentStep]);

  const validateCurrentStep = useCallback(() => {
    const newErrors = {};
    
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE_SELECTION:
        if (!selectedService) {
          newErrors.service = 'Selecione um serviço';
        }
        break;
        
      case BOOKING_STEPS.PROFESSIONAL_SELECTION:
        if (!selectedProfessional) {
          newErrors.professional = 'Selecione um profissional';
        }
        break;
        
      case BOOKING_STEPS.DATETIME_SELECTION:
        if (!selectedDate) {
          newErrors.date = 'Selecione uma data';
        }
        if (!selectedTime) {
          newErrors.time = 'Selecione um horário';
        }
        break;
        
      case BOOKING_STEPS.CUSTOMER_DETAILS:
        const bookingData = {
          serviceId: selectedService?.id,
          professionalId: selectedProfessional?.id,
          date: selectedDate,
          time: selectedTime,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerEmail: customerData.email,
        };
        
        const validation = validateBookingData(bookingData);
        if (!validation.isValid) {
          Object.assign(newErrors, validation.errors);
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, selectedService, selectedProfessional, selectedDate, selectedTime, customerData]);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      toast.error('Por favor, corrija os erros antes de continuar');
      return;
    }
    
    const bookingData = bookingService.formatBookingData({
      service_id: selectedService.id,
      professional_id: selectedProfessional.id,
      date: selectedDate,
      time: selectedTime,
      customer_name: customerData.name,
      customer_phone: customerData.phone,
      customer_email: customerData.email,
      notes: customerData.notes,
    });
    
    try {
      setIsLoading(true);
      await createBookingMutation.mutateAsync(bookingData);
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsLoading(false);
    }
  }, [
    validateCurrentStep,
    selectedService,
    selectedProfessional,
    selectedDate,
    selectedTime,
    customerData,
    createBookingMutation,
  ]);

  // ===== COMPUTED VALUES =====

  const bookingSummary = useMemo(() => ({
    service: selectedService,
    professional: selectedProfessional,
    date: selectedDate ? formatDate(selectedDate) : '',
    time: selectedTime ? formatTime(selectedTime) : '',
    customer: customerData,
    totalPrice: selectedService?.price || 0,
  }), [selectedService, selectedProfessional, selectedDate, selectedTime, customerData]);

  const stepProgress = useMemo(() => {
    const steps = Object.values(BOOKING_STEPS);
    const currentIndex = steps.indexOf(currentStep);
    return {
      current: currentIndex + 1,
      total: steps.length,
      percentage: Math.round(((currentIndex + 1) / steps.length) * 100),
    };
  }, [currentStep]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE_SELECTION:
        return !!selectedService;
      case BOOKING_STEPS.PROFESSIONAL_SELECTION:
        return !!selectedProfessional;
      case BOOKING_STEPS.DATETIME_SELECTION:
        return !!(selectedDate && selectedTime);
      case BOOKING_STEPS.CUSTOMER_DETAILS:
        return validateCurrentStep();
      default:
        return false;
    }
  }, [currentStep, selectedService, selectedProfessional, selectedDate, selectedTime, validateCurrentStep]);

  const isStepLoading = useMemo(() => {
    switch (currentStep) {
      case BOOKING_STEPS.SERVICE_SELECTION:
        return servicesLoading;
      case BOOKING_STEPS.PROFESSIONAL_SELECTION:
        return professionalsLoading;
      case BOOKING_STEPS.DATETIME_SELECTION:
        return slotsLoading;
      default:
        return false;
    }
  }, [currentStep, servicesLoading, professionalsLoading, slotsLoading]);

  // ===== RETURN =====
  return {
    // State
    currentStep,
    selectedService,
    selectedProfessional,
    selectedDate,
    selectedTime,
    customerData,
    errors,
    isLoading: isLoading || createBookingMutation.isLoading,
    isStepLoading,
    
    // Data
    services,
    professionals,
    availableSlots,
    bookingSummary,
    stepProgress,
    
    // Computed
    canProceed,
    isCreating: createBookingMutation.isLoading,
    createdBooking: createBookingMutation.data,
    
    // Handlers
    handleServiceSelect,
    handleProfessionalSelect,
    handleDateSelect,
    handleTimeSelect,
    handleCustomerDataChange,
    handleStepBack,
    handleReset,
    handleSubmit,
    validateCurrentStep,
    
    // Constants
    BOOKING_STEPS,
    
    // Errors
    servicesError,
  };
};

export default useBooking;