/**
 * Tạo một phiên bản debounced của một hàm.
 * Hàm debounced sẽ trì hoãn việc thực thi cho đến khi đã trôi qua `waitFor` milliseconds
 * kể từ lần gọi cuối cùng.
 *
 * @param func Hàm cần debounce
 * @param waitFor Thời gian chờ tính bằng milliseconds
 * @returns Phiên bản debounced của hàm
 */
export const debounce = <F extends (...args: any[]) => any>(
    func: F,
    waitFor: number
) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
        if (timeout) {
            clearTimeout(timeout);
        }

        return new Promise(resolve => {
            timeout = setTimeout(() => {
                const result = func(...args);
                resolve(result);
            }, waitFor);
        });
    };
};

/**
 * Tạo một phiên bản throttled của một hàm.
 * Hàm throttled sẽ chỉ được gọi tối đa một lần trong khoảng thời gian `limit` milliseconds.
 *
 * @param func Hàm cần throttle
 * @param limit Thời gian giới hạn tính bằng milliseconds
 * @returns Phiên bản throttled của hàm
 */
export const throttle = <F extends (...args: any[]) => any>(
    func: F,
    limit: number
) => {
    let inThrottle: boolean = false;
    let lastResult: any;

    return (...args: Parameters<F>): ReturnType<F> => {
        if (!inThrottle) {
            inThrottle = true;
            lastResult = func(...args);
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
        return lastResult;
    };
};
