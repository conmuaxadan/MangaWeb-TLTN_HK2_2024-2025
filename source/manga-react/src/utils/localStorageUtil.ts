export const saveString = (key: string, value: string) => {
    localStorage.setItem(key, value);
}

export const getString = (key: string): string | null => {
    return localStorage.getItem(key);
}

export const saveObject = (key: string, value: object) => {
    localStorage.setItem(key, JSON.stringify(value));
}
export const getObject = (key: string): object | null => {
    const item = localStorage.getItem(key);
    if (item) {
        return JSON.parse(item);
    }
    return null;

}

export const removeItem = (key: string) => {
    localStorage.removeItem(key);
}