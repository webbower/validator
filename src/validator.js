import isError from 'lodash.iserror';

// Private utilities
const stringifyFailures = (errors = []) =>
    errors
        .map(e => e instanceof Error ? `${e.name}(${JSON.stringify(e.message)})` : JSON.stringify(e))
        .join(', ');

/**
 * 
 * @param {String} message The validation failure message
 * @param {Error} originalError The thrown error from the predicate function
 * 
 * The ValidationError signifies that a validation function threw an Error internally and captures
 * that thrown error in addition to logging the validation failure message for use in displaying.
 * The thrown Error can be extracted from the `originalError` property for internal logging purposes.
 */
function ValidationError(message, originalError) {
    var instance = new Error(message);
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    this.name = 'ValidationError';
    this.originalError = originalError;
    return instance;
}
ValidationError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: Error,
        enumerable: false,
        writable: true,
        configurable: true
    },
    name: {
        value: 'ValidationError',
        enumerable: true,
        writable: true,
        configurable: true
    }
});
if (Object.setPrototypeOf) {
    Object.setPrototypeOf(ValidationError, Error);
} else {
    ValidationError.__proto__ = Error;
}

// The star of the show
const Validator = (x, errs = []) => ({
    assert(test, errorMsg) {
        try {
            return test(x) ? Validator(x, errs) : Validator(x, errs.concat(errorMsg));
        } catch (e) {
            return Validator(x, errs.concat(new ValidationError(errorMsg, e)));
        }
    },
    hasFailures() {
        return errs.length > 0;
    },
    getFailuresAndErrors() {
        return errs.slice();
    },
    getFailures() {
        return errs.map(failure => isError(failure) ? failure.message : failure);
    },
    getErrors() {
        return errs.filter(isError);
    },
    toString() {
        return `Validator(${JSON.stringify(x)}, [${stringifyFailures(errs)}])`;
    },
});

// Export a wrapper that only exposes the unary signature public API
export default x => Validator(x);
