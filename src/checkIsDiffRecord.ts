import {type DiffRecord} from "./type/DiffRecord";

export const checkIsDiffRecord = (val: unknown): val is DiffRecord => {
    return val !== null && typeof val === "object" && !Array.isArray(val);
}