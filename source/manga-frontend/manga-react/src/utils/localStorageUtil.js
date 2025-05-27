export const saveString = (key, value) => {
    localStorage.setItem(key, value);
}

export const getString = (key) => {
    return localStorage.getItem(key);
}

export const saveObject = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
}
export const getObject = (key) => {
    const item = localStorage.getItem(key);
    if (item) {
        return JSON.parse(item);
    }
    return null;

}

export const removeItem = (key) => {
    localStorage.removeItem(key);
}