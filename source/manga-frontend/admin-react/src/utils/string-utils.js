/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param text The text to truncate
 * @param maxLength The maximum length of the text
 * @returns The truncated text
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize the first letter of a string
 * @param text The text to capitalize
 * @returns The capitalized text
 */
export const capitalizeFirstLetter = (text) => {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Convert a string to slug format (lowercase, hyphens instead of spaces)
 * @param text The text to convert
 * @returns The slug
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

/**
 * Remove HTML tags from a string
 * @param html The HTML string
 * @returns The plain text
 */
export const stripHtml = (html) => {
  if (!html) return '';
  
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Format a number with commas as thousands separators
 * @param number The number to format
 * @returns The formatted number
 */
export const formatNumber = (number) => {
  if (number === undefined || number === null) return '0';
  
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
