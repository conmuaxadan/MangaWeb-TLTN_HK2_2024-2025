import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Safely format a date string to relative time
 * @param dateString The date string to format
 * @param options Options for formatDistanceToNow
 * @returns Formatted relative time string or fallback message
 */
export const safeFormatDistanceToNow = (
    dateString: string | null | undefined,
    options: { addSuffix?: boolean; locale?: any } = { addSuffix: true, locale: vi },
    fallback: string = 'Chưa cập nhật'
): string => {
    if (!dateString) {
        return fallback;
    }

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', dateString);
            return fallback;
        }
        return formatDistanceToNow(date, options);
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return fallback;
    }
};

/**
 * Safely format a date string to a readable format
 * @param dateString The date string to format
 * @param fallback Fallback message if date is invalid
 * @returns Formatted date string or fallback message
 */
export const safeFormatDate = (
    dateString: string | null | undefined,
    fallback: string = 'Chưa cập nhật'
): string => {
    if (!dateString) {
        return fallback;
    }

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', dateString);
            return fallback;
        }
        
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('vi-VN', options);
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return fallback;
    }
};

/**
 * Check if a date string is valid
 * @param dateString The date string to validate
 * @returns true if valid, false otherwise
 */
export const isValidDate = (dateString: string | null | undefined): boolean => {
    if (!dateString) {
        return false;
    }

    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    } catch (error) {
        return false;
    }
};
