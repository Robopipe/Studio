export type TExtractStringValues<T> = T extends { [key: string]: infer U }
    ? U extends string
        ? U
        : TExtractStringValues<U>
    : never;

export function extractValuesFromObject<T>(obj: T): TExtractStringValues<T>[] {
    const result: string[] = [];
    function recurse(value: any) {
        if (typeof value === 'object') {
            for (const key in value) {
                recurse(value[key]);
            }
        } else if (typeof value === 'string') {
            result.push(value);
        }
    }
    recurse(obj);
    return result as TExtractStringValues<T>[];
}
