"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = isArray;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.isNull = isNull;
exports.isObject = isObject;
exports.isUndefined = isUndefined;
exports.isNullish = isNullish;
exports.getArrayOrNull = getArrayOrNull;
/**
 * Determines if the provided object is an array.
 * @param object The object to check.
 * @returns True if the object is an array, false otherwise.
 */
function isArray(object) {
    return Array.isArray(object);
}
/**
 * Determines if the provided object is a string.
 * @param object The object to check.
 * @returns True if the object is a string, false otherwise.
 */
function isString(object) {
    return typeof object === "string";
}
/**
 * Determines if the provided object is a boolean.
 * @param object The object to check.
 * @returns True if the object is a boolean, false otherwise.
 */
function isBoolean(object) {
    return typeof object === "boolean";
}
/**
 * Determines if the provided object is null.
 * @param object The object to check.
 * @returns True if the object is null, false otherwise.
 */
function isNull(object) {
    return object === null;
}
/**
 * Determines if the provided object is a non-null object (but not an array).
 * @param object The object to check.
 * @returns True if the object is a non-null object, false otherwise.
 */
function isObject(object) {
    return typeof object === "object" && !isNull(object) && !isArray(object);
}
/**
 * Determines if the provided object is undefined.
 * @param object The object to check.
 * @returns True if the object is undefined, false otherwise.
 */
function isUndefined(object) {
    return object === undefined;
}
/**
 * Determines if the provided object is null or undefined.
 * @param object The object to check.
 * @returns True if the object is null or undefined, false otherwise.
 */
function isNullish(object) {
    return isNull(object) || isUndefined(object);
}
/**
 * Returns the value as an array if it is an array, or null otherwise.
 * @param value The value to check.
 * @returns The value as an array or null.
 */
function getArrayOrNull(value) {
    return isArray(value) ? value : null;
}
