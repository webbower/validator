import isError from 'lodash.iserror';

const instanceSymbol = Symbol('ValidatorInstance');

// Private utilities
const stringifyFailures = (errors = []) =>
  errors
    .map(e => (e instanceof Error ? `${e.name}(${JSON.stringify(e.message)})` : JSON.stringify(e)))
    .join(', ');

/**
 * ValidationError - a custom Error type
 *
 * The ValidationError signifies that a validation function threw an Error internally and captures
 * that thrown error in addition to logging the validation failure message for use in displaying.
 * The thrown Error can be extracted from the `originalError` property for internal logging purposes.
 *
 * @param {String} message The validation failure message
 * @param {Error} originalError The thrown error from the predicate function
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#ES5_Custom_Error_Object
 * @see https://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
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
    value: ValidationError,
    enumerable: false,
    writable: true,
    configurable: true,
  },
  name: {
    value: 'ValidationError',
    enumerable: true,
    writable: true,
    configurable: true,
  },
});
if (Object.setPrototypeOf) {
  Object.setPrototypeOf(ValidationError, Error);
} else {
  ValidationError.__proto__ = Error;
}

// Private internal implementation
const ValidatorFactory = (x, errs = [], options = {}) => {
  const { optional = false } = options;
  const self = () => ValidatorFactory(x, errs, options);

  return {
    assert(test, errorMsg) {
      if (optional && x == null) {
        return self();
      }

      try {
        return test(x) ? self() : ValidatorFactory(x, errs.concat(errorMsg));
      } catch (e) {
        return ValidatorFactory(x, errs.concat(new ValidationError(errorMsg, e)));
      }
    },
    assertWhen(condition, test, errorMsg) {
      let passed = false;
      switch (typeof condition) {
        case 'function':
          passed = condition(x);
          break;
        case 'boolean':
          passed = condition;
          break;
        default:
          throw new TypeError(
            `Validator.assertWhen() expects first argument to be boolean or function. ${typeof condition} given.`
          );
      }

      return passed ? this.assert(test, errorMsg) : self();
    },
    hasFailures() {
      return errs.length > 0;
    },
    hasErrors() {
      return errs.filter(isError).length > 0;
    },
    getFailuresAndErrors() {
      return errs.slice();
    },
    getFailures() {
      return errs.map(failure => (isError(failure) ? failure.message : failure));
    },
    getErrors() {
      return errs.filter(isError);
    },
    toString() {
      return `Validator(${JSON.stringify(x)}, [${stringifyFailures(errs)}])`;
    },
    [instanceSymbol]: true,
    get [Symbol.toStringTag]() {
      return 'Validator';
    },
  };
};

// Public API
const Validator = x => ValidatorFactory(x);

const createBoundValidator = ({ baseValidator = Validator, boundAssertion = [] } = {}) => {
  const [boundTest, boundFailureMessage, boundCondition] = boundAssertion;

  const BoundValidator = x => {
    if (boundCondition) {
      return baseValidator(x).assertWhen(boundCondition, boundTest, boundFailureMessage);
    }

    return baseValidator(x).assert(boundTest, boundFailureMessage);
  };

  Object.assign(BoundValidator, {
    withAssert(test, errorMsg) {
      return createBoundValidator({ baseValidator: BoundValidator, boundAssertion: [test, errorMsg] });
    },
    withAssertWhen(condition, test, errorMsg) {
      return createBoundValidator({ baseValidator: BoundValidator, boundAssertion: [test, errorMsg, condition] });
    },
  });

  return BoundValidator;
}

Object.assign(Validator, {
  Optional: function OptionalValidator(x) {
    return ValidatorFactory(x, undefined, { optional: true });
  },
  isValidator(x) {
    return x != null && x[instanceSymbol] === true;
  },
  withAssert(test, errorMsg) {
    return createBoundValidator({ boundAssertion: [test, errorMsg] });
  },
  withAssertWhen(condition, test, errorMsg) {
    return createBoundValidator({ boundAssertion: [test, errorMsg, condition] });
  },
});

// Export a wrapper that only exposes the unary signature public API
export default Validator;
