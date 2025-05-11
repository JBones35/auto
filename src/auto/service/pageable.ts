export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_NUMBER = 0;

export type Pageable = {
    readonly number: number;
    readonly size: number;
};

type PageableProps = {
    readonly number?: string;
    readonly size?: string;
};

export function createPageable({ number, size }: PageableProps): Pageable {
    let numberFloat = Number(number);
    let numberInt: number;
    if (isNaN(numberFloat) || !Number.isInteger(numberFloat)) {
        numberInt = DEFAULT_PAGE_NUMBER;
    } else {
        numberInt = numberFloat - 1;
        if (numberInt < 0) {
            numberInt = DEFAULT_PAGE_NUMBER;
        }
    }

    let sizeFloat = Number(size);
    let sizeInt: number;
    if (isNaN(sizeFloat) || !Number.isInteger(sizeFloat)) {
        sizeInt = DEFAULT_PAGE_SIZE;
    } else {
        sizeInt = sizeFloat;
        if (sizeInt < 1 || sizeInt > MAX_PAGE_SIZE) {
            sizeInt = DEFAULT_PAGE_NUMBER;
        }
    }

    return { number: numberInt, size: sizeInt };
}
