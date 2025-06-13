/**
 * Utility functions for performance optimization
 */

/**
 * Debounce function
 *
 * Trì hoãn việc thực thi một hàm cho đến khi đã qua một khoảng thời gian kể từ lần gọi cuối cùng.
 * Thường được sử dụng cho các tác vụ như tìm kiếm input, resize hoặc auto-save.
 *
 * @param func Hàm cần debounce
 * @param wait Thời gian chờ tính bằng millisecond
 * @param immediate Có thực thi ngay lập tức trước khi chờ không
 * @returns Hàm đã được debounce
 */
export function debounce(func, wait, immediate = false) {
  let timeout = null;

  return function(...args) {
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
 * Thường được sử dụng cho các tác vụ như scroll event, drag event, hoặc button click liên tục.
 *
 * @param func Hàm cần throttle
 * @param limit Khoảng thời gian tối thiểu giữa các lần gọi (millisecond)
 * @returns Hàm đã được throttle
 */
export function throttle(func, limit) {
  let inThrottle = false;
  let lastFunc;
  let lastRan;

  return function(...args) {
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
export function rafThrottle(func) {
  let ticking = false;
  let lastArgs = null;

  return function(...args) {
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
