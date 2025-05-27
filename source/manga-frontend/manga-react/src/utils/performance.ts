/**
 * Performance optimization utilities for manga-react
 * Conservative approach with 100-200ms delays for better UX
 */

/**
 * Debounce function
 * 
 * Trì hoãn việc thực thi một hàm cho đến khi đã qua một khoảng thời gian kể từ lần gọi cuối cùng.
 * Thường được sử dụng cho các tác vụ như tìm kiếm input, auto-save.
 * 
 * @param func Hàm cần debounce
 * @param wait Thời gian chờ tính bằng millisecond (conservative: 100-200ms)
 * @param immediate Có thực thi ngay lập tức trước khi chờ không
 * @returns Hàm đã được debounce
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 200,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function
 * 
 * Giới hạn tần suất thực thi một hàm không quá một lần trong khoảng thời gian xác định.
 * Thường được sử dụng cho các tác vụ như scroll event, resize event.
 * 
 * @param func Hàm cần throttle
 * @param limit Khoảng thời gian tối thiểu giữa các lần gọi (conservative: 100-150ms)
 * @returns Hàm đã được throttle
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 150
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function(this: any, ...args: Parameters<T>): void {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * requestAnimationFrame throttle
 * 
 * Một biến thể của throttle sử dụng requestAnimationFrame để đồng bộ với chu kỳ render của trình duyệt.
 * Hữu ích cho các thao tác liên quan đến animation hoặc DOM manipulation.
 * 
 * @param func Hàm cần throttle
 * @returns Hàm đã được throttle bằng requestAnimationFrame
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  let lastArgs: Parameters<T> | null = null;

  return function(this: any, ...args: Parameters<T>): void {
    lastArgs = args;
    const context = this;

    if (!ticking) {
      requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(context, lastArgs);
        }
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * Prevent rapid button clicks
 * 
 * Ngăn chặn việc click button quá nhanh, tránh gọi API nhiều lần.
 * 
 * @param func Hàm xử lý click
 * @param delay Thời gian delay giữa các lần click (conservative: 100ms)
 * @returns Hàm đã được bảo vệ khỏi rapid clicks
 */
export function preventRapidClicks<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let lastClickTime = 0;

  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastClickTime >= delay) {
      lastClickTime = now;
      func.apply(this, args);
    }
  };
}

/**
 * Conservative scroll throttle
 * 
 * Throttle đặc biệt cho scroll events với delay conservative để đảm bảo UX mượt mà.
 * 
 * @param func Hàm xử lý scroll
 * @param delay Thời gian delay (conservative: 100ms)
 * @returns Hàm đã được throttle cho scroll
 */
export function scrollThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100
): (...args: Parameters<T>) => void {
  return throttle(func, delay);
}

/**
 * Conservative resize throttle
 * 
 * Throttle đặc biệt cho resize events với delay conservative.
 * 
 * @param func Hàm xử lý resize
 * @param delay Thời gian delay (conservative: 150ms)
 * @returns Hàm đã được throttle cho resize
 */
export function resizeThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 150
): (...args: Parameters<T>) => void {
  return throttle(func, delay);
}

/**
 * Search input debounce
 * 
 * Debounce đặc biệt cho search input với delay phù hợp cho UX.
 * 
 * @param func Hàm xử lý search
 * @param delay Thời gian delay (conservative: 200ms)
 * @returns Hàm đã được debounce cho search
 */
export function searchDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 200
): (...args: Parameters<T>) => void {
  return debounce(func, delay);
}

/**
 * API call throttle
 * 
 * Throttle đặc biệt cho API calls để tránh spam requests.
 * 
 * @param func Hàm API call
 * @param delay Thời gian delay (conservative: 200ms)
 * @returns Hàm đã được throttle cho API calls
 */
export function apiThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 200
): (...args: Parameters<T>) => void {
  return throttle(func, delay);
}
