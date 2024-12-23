type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelToSnake<T> = {
  [K in keyof T as CamelToSnakeCase<K & string>]: T[K];
};

type SnakeToCamel<T> = {
  [K in keyof T as SnakeToCamelCase<K & string>]: T[K];
};

export const toCamelCase = <T extends Record<string, any>>(obj: T): SnakeToCamel<T> => {
    const camelObj: any = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            camelObj[camelKey] = obj[key];
        }
    });
    return camelObj;
};

export const toSnakeCase = <T extends Record<string, any>>(obj: T): CamelToSnake<T> => {
    const snakeObj: any = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeObj[snakeKey] = obj[key];
        }
    });
    return snakeObj;
};
