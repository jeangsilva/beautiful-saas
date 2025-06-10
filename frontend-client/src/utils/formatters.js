/**
 * Beautiful SaaS - Formatters Utils
 * Funções para formatação de dados
 */

import { format, parseISO, isValid, differenceInMinutes, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===== DATE & TIME FORMATTERS =====

/**
 * Format date to Brazilian format
 */
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date for display
 */
export const formatDisplayDate = (date) => {
  return formatDate(date, "EEEE, dd 'de' MMMM 'de' yyyy");
};

/**
 * Format date for form inputs
 */
export const formatInputDate = (date) => {
  return formatDate(date, 'yyyy-MM-dd');
};

/**
 * Format time
 */
export const formatTime = (time, pattern = 'HH:mm') => {
  try {
    if (!time) return '';
    
    // Handle time string (HH:mm) or Date object
    if (typeof time === 'string') {
      if (time.includes(':')) {
        return time.slice(0, 5); // Return HH:mm
      }
      // Parse as ISO string
      const dateObj = parseISO(time);
      return isValid(dateObj) ? format(dateObj, pattern) : '';
    }
    
    if (time instanceof Date && isValid(time)) {
      return format(time, pattern);
    }
    
    return '';
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date, time = null) => {
  try {
    const dateStr = formatDisplayDate(date);
    const timeStr = time ? formatTime(time) : '';
    
    if (dateStr && timeStr) {
      return `${dateStr} às ${timeStr}`;
    }
    
    return dateStr || timeStr || '';
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
};

/**
 * Format relative time (e.g., "há 2 horas")
 */
export const formatRelativeTime = (date) => {
  try {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInMinutes = differenceInMinutes(now, dateObj);
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `há ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `há ${diffInWeeks}sem`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `há ${diffInMonths}mês${diffInMonths > 1 ? 'es' : ''}`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Calculate duration between two times
 */
export const calculateDuration = (startTime, endTime) => {
  try {
    const start = typeof startTime === 'string' ? parseISO(`1970-01-01T${startTime}`) : startTime;
    const end = typeof endTime === 'string' ? parseISO(`1970-01-01T${endTime}`) : endTime;
    
    const diffInMinutes = differenceInMinutes(end, start);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}min`;
    }
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${minutes}min`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '';
  }
};

// ===== CURRENCY FORMATTERS =====

/**
 * Format currency in Brazilian Real
 */
export const formatCurrency = (value, options = {}) => {
  try {
    const {
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      currency = 'BRL',
      locale = 'pt-BR',
      showSymbol = true,
    } = options;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return 'R$ 0,00';
    
    if (!showSymbol) {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(numValue);
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numValue);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'R$ 0,00';
  }
};

/**
 * Format price range
 */
export const formatPriceRange = (minPrice, maxPrice) => {
  if (!minPrice && !maxPrice) return '';
  if (!maxPrice || minPrice === maxPrice) return formatCurrency(minPrice);
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
};

// ===== PHONE FORMATTERS =====

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
  try {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Brazilian phone number formatting
    if (digits.length === 11) {
      // Mobile: (11) 99999-9999
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      // Landline: (11) 9999-9999
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    
    return phone; // Return original if doesn't match expected length
  } catch (error) {
    console.error('Error formatting phone:', error);
    return phone;
  }
};

/**
 * Format WhatsApp number for link
 */
export const formatWhatsAppLink = (phone) => {
  try {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (digits.length === 11 && !digits.startsWith('55')) {
      return `55${digits}`;
    }
    
    return digits;
  } catch (error) {
    console.error('Error formatting WhatsApp link:', error);
    return '';
  }
};

// ===== TEXT FORMATTERS =====

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format name (capitalize each word)
 */
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => {
      // Don't capitalize prepositions
      const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'na', 'no'];
      return prepositions.includes(word.toLowerCase()) 
        ? word.toLowerCase() 
        : capitalize(word);
    })
    .join(' ');
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Format description with line breaks
 */
export const formatDescription = (text) => {
  if (!text) return '';
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
};

// ===== ADDRESS FORMATTERS =====

/**
 * Format full address
 */
export const formatAddress = (address) => {
  try {
    if (!address) return '';
    
    if (typeof address === 'string') return address;
    
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.number) parts.push(address.number);
    if (address.neighborhood) parts.push(address.neighborhood);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(`CEP ${address.zipCode}`);
    
    return parts.join(', ');
  } catch (error) {
    console.error('Error formatting address:', error);
    return '';
  }
};

/**
 * Format ZIP code
 */
export const formatZipCode = (zipCode) => {
  try {
    if (!zipCode) return '';
    
    const digits = zipCode.replace(/\D/g, '');
    
    if (digits.length === 8) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    
    return zipCode;
  } catch (error) {
    console.error('Error formatting ZIP code:', error);
    return zipCode;
  }
};

// ===== DISTANCE FORMATTERS =====

/**
 * Format distance
 */
export const formatDistance = (distanceInKm) => {
  try {
    if (!distanceInKm) return '';
    
    const distance = parseFloat(distanceInKm);
    
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      return `${meters}m`;
    }
    
    if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    }
    
    return `${Math.round(distance)}km`;
  } catch (error) {
    console.error('Error formatting distance:', error);
    return '';
  }
};

// ===== RATING FORMATTERS =====

/**
 * Format rating
 */
export const formatRating = (rating, maxRating = 5) => {
  try {
    if (!rating) return '0.0';
    
    const numRating = parseFloat(rating);
    
    if (isNaN(numRating)) return '0.0';
    
    return Math.min(numRating, maxRating).toFixed(1);
  } catch (error) {
    console.error('Error formatting rating:', error);
    return '0.0';
  }
};

/**
 * Format rating with stars
 */
export const formatRatingStars = (rating, maxRating = 5) => {
  try {
    const numRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    
    return {
      full: fullStars,
      half: hasHalfStar ? 1 : 0,
      empty: emptyStars,
      rating: formatRating(rating, maxRating),
    };
  } catch (error) {
    console.error('Error formatting rating stars:', error);
    return { full: 0, half: 0, empty: maxRating, rating: '0.0' };
  }
};

// ===== URL FORMATTERS =====

/**
 * Format URL for social media
 */
export const formatSocialUrl = (url, platform) => {
  try {
    if (!url) return '';
    
    // If it's already a full URL, return as is
    if (url.startsWith('http')) return url;
    
    // Remove @ symbol if present
    const username = url.replace('@', '');
    
    const platformUrls = {
      instagram: `https://instagram.com/${username}`,
      facebook: `https://facebook.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      whatsapp: `https://wa.me/${formatWhatsAppLink(username)}`,
    };
    
    return platformUrls[platform] || url;
  } catch (error) {
    console.error('Error formatting social URL:', error);
    return url;
  }
};

// ===== FILE FORMATTERS =====

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  try {
    if (!bytes || bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  } catch (error) {
    console.error('Error formatting file size:', error);
    return '0 B';
  }
};

// ===== EXPORT ALL =====
export default {
  // Date & Time
  formatDate,
  formatDisplayDate,
  formatInputDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  calculateDuration,
  
  // Currency
  formatCurrency,
  formatPriceRange,
  
  // Phone
  formatPhone,
  formatWhatsAppLink,
  
  // Text
  capitalize,
  formatName,
  truncateText,
  formatDescription,
  
  // Address
  formatAddress,
  formatZipCode,
  
  // Distance
  formatDistance,
  
  // Rating
  formatRating,
  formatRatingStars,
  
  // URL
  formatSocialUrl,
  
  // File
  formatFileSize,
};