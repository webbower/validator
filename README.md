# Validator

Data validation made easy for user-facing error messages. Configure multiple tests with per-test error messages. Also handle JS Errors thrown by bad data.

Many validation libraries I've used (especially for HTML forms) bake the validation failure messages into each validator function even though the context for the error may be different in different parts of the site/app. HTML form validator library functions are usually locked into only being validator functions which means you can't use the same `isEmail` function for form validation and validating a string in my code, resulting in potentially inconsistent tests throughout your code. `Validator` allows you to use _any_ predicate function (a function that takes any value and returns a boolean) that you have in your codebase and doesn't bake a one-size-(should)-fit-all error message into the testing function. This means your test regex or other heuristic will be consistent throughout your codebase. You'll need to BYO error display code.

The API for this utility was inspired by some functional programming (FP) concepts and libraries, most notably, the [FolkTale `Validation` utility](https://folktale.origamitower.com/api/v2.3.0/en/folktale.validation.html). `Validation` is written as an applicative functor which, while great if your goal is to adhere to pure functional patterns, is a bit obtuse to use for projects that aren't heavily using other FP libraries and patterns. This utility provides the same benefits without the overhead of FP types ported to JS.

## Creating reusable Validators

In many cases, you'll want to create reusable validation. For example, you may have multiple forms in your app that each have an email field. You have a few choices:

- Duplicate `Validator(emailFieldValue).assert(isString, stringErrorMessage).assert(isEmailFormat, emailFormatErrorMessage)` for each form. This is not ideal because it makes maintenance more painful.
- Create a reusable utility function around the above code snippet and use that everywhere. This is not a bad option.

`Validator` provides a built-in mechanism for reusability. You can bind `.assert()` and `.assertWhen()` calls to create new Validators (called a Bound Validator), which can continue have assertions bound to them. Think of it like recursive currying. Each time you bind an assertion, you create a new Validator that applies that assertion upon giving it a value.

```js
const StringValidator = Validator.withAssert(isString, 'must be a string');
const EmailValidator = StringValidator.withAssert(isEmailFormat, 'must be an email address');
// Also Validator.withAssertWhen(condition, predicate, validation message)
EmailValidator('jane@gmail.com')
    .getFailures(); // []

EmailValidator('jane@gmail.com')
    .assert(isEmailDomain('example.com'), 'must be from the example.com domain')
    .getFailures(); // ['must be from the example.com domain']
```

The following code is functionally equivalent:

```js
Validator('jane@example.com').assert(isString, 'must be a string').assert(isEmailFormat, 'must be an email address');
// ~=
(Validator.withAssert(isString, 'must be a string'))('jane@example.com').assert(isEmailFormat, 'must be an email address');
// ~=
((Validator.withAssert(isString, 'must be a string')).withAssert(isEmailFormat, 'must be an email address'))('jane@example.com');
```

## Support

`Validator` requires ES6 syntax transpilation and polyfills for `Symbol()` and `Object.setPrototypeOf()` if you need to support IE11. Proper IE11 support and Node.js support is planned.

## API

### `Validator(value)`

Wrap a piece of data in order to perform validations on it. A Validator object is returned with methods to apply tests and retrieve validation messages associated with any failed tests.

```js
Validator: a -> Validator<a>

const v = Validator(1);
```

### `.assert(predicate, failureMessage)`

Perform a validation against the wrapped value, logging the failure message if the predicate fails.

```js
assert: (a -> Boolean, String) => Validator<a>

Validator(1).assert(isNumber, 'a number is expected'); // Passes. Failure message is not logged.
Validator(1).assert(isString, 'a string is expected'); // Fails. Failure message is logged.
```

### `.assertWhen(condition, predicate, failureMessage)`

Perform a validation against the wrapped value when `condition` is `true`, logging the `failureMessage` if `predicate` fails. `condition` can be a boolean or a function that takes one argument. As a boolean, the assertion will be made if `condition` is `true`. As a function, `condition` receives the original value and the assertion will be made if the function returns `true`. If `condition` is `false` in either case, the assertion is skipped.

This method allows for easier chaining of a full validation suite since `Validator` instances are immutable. Without this, if you had any assertions that should only be made sometimes, you'd have to rely on a mutable variable to apply the conditional assertion.

```js
const isFooish = x => ['foobar', 'foobaz'].includes(x);
// Without .assertWhen()

const value = 'foo';

let validator = Validator(value).assert(isString, 'a string is expected');

if (value.startsWith('foo')) {
    validator = validator.assert(isFooish, 'a foo-ish value is expected when value starts with "foo"');
}

const isValid = !validator.hasFailures();

// With .assertWhen()

const isValid = Validator('foo')
    .assert(isString, 'a string is expected')
    .assertWhen(v => v.startsWith('foo'), isFooish, 'a foo-ish value is expected when value starts with "foo"')
    .hasFailures();
```

```js
assertWhen: ((Boolean | a -> Boolean), a -> Boolean, String) => Validator<a>

// The value from the username field of a login form that can accept a username or email address
Validator(username)
    .assert(isString, 'a string is expected')
    // Only validate the username's domain if an email address is submitted
    .assertWhen(x => x.includes('@'), isDomainEmail('mydomain.com'), 'an email username must be in mydomain.com')
    .hasFailures();

// A form only requires a field when a checkbox is checked
Validator(conditionalField.value)
    .assert(isString, 'a string is expected')
    // Only validate the optional field when the checkbox is checked
    .assertWhen(checkboxField.checked, isValidFormat, 'a specific format is expected')
    .hasFailures();
```

### `.hasFailures()`

Check whether any assertions called have resulted in any failures. Returns `true` if any assertions failed or if any assertions threw JS Errors, or `false` if none did.

```js
hasFailures: () => Boolean

Validator(1)
    .assert(isNumber, 'a number is expected')
    .hasFailures(); // false
Validator(1)
    .assert(isString, 'a string is expected')
    .hasFailures(); // true
```

### `.hasErrors()`

Check whether any assertions have thrown errors. Returns `true` if any assertions threw Errors, or `false` if none did. Useful for checking for bugs in assertions and reporting them to your logging system in conjunction with `.getErrors()`.

```js
hasErrors: () => Boolean

Validator(1)
    .assert(isString, 'a string is expected')
    .hasErrors(); // false: assertion failed but no error was thrown
Validator(1)
    .assert(x => x.match(/foo/g), 'foo is expected')
    .hasErrors(); // true: numbers don't have a `.match()` method
```

### `.getFailuresAndErrors()`

Return an array of all failure messages and thrown JS Errors from called assertions.

```js
getFailuresAndErrors: () => [(String | ValidationError)]


Validator(1)
    .assert(isNumber, 'a number is expected')
    .getFailuresAndErrors(); // []
Validator(1)
    .assert(isString, 'a string is expected')
    .assert(isEmailFormat, 'a valid email is required') // calls a string method
    .getFailuresAndErrors(); // ['a string is expected', ValidationError('a valid email is required')]
```

### `.getFailures()`

Return an array of the failure messages from called assertions. This will include any failure messages from assertions that threw JS Errors.

```js
getFailures: () => [String]


Validator(1)
    .assert(isNumber, 'a number is expected')
    .getFailures(); // []
Validator(1)
    .assert(isString, 'a string is expected')
    .assert(isEmailFormat, 'a valid email is required') // calls a string method
    .getFailures(); // ['a string is expected']
```

### `.getErrors()`

Return an array of all thrown `ValidationErrors` from assertions.

```js
getErrors: () => [ValidationError]

Validator(1)
    .assert(isNumber, 'a number is expected')
    .getErrors(); // []
Validator(1)
    .assert(isString, 'a string is expected')
    .assert(isEmailFormat, 'a valid email is required') // calls a string method
    .getErrors(); // [ValidationError('a valid email is required')]
```

### `.toString()`

Output a string representation of the current state of the Validator instance. There is no guarantee that this output will be stable in the long term so this shouldn't be used for anything except debugging.

```js
toString: () => String

Validator(1)
    .assert(isNumber, 'a number is expected')
    .toString(); // Validator(1, [])
Validator(1)
    .assert(isString, 'a string is expected')
    .assert(isEmailFormat, 'a valid email is required') // calls a string method
    .toString(); // Validator(1, ['a string is expected', ValidationError('a valid email is required')])
```

### `Validator.Optional(value)`

Initialize a `Validator` that will pass if the value is `null` or `undefined` ("nil" going forward). All above methods will be available, but any `.assert()` calls will always pass if the value is nil. This means that `.hasFailures()` will always return `false` for a nil value and `.getFailuresAndErrors()`, `.getFailures()`, and `.getErrors()` will always return empty arrays for a nil value.

```js
Validator.Optional: a -> Validator<a>

Validator.Optional(null)
    .assert(isString, 'a string is expected') // Pass. Value is nil
    .assert(isEmailFormat, 'a valid email is expected') // Pass. Value is nil
    .hasFailures(); // false
Validator.Optional('foo')
    .assert(isString, 'a string is expected') // Pass. Value is non-nil and is a string
    .assert(isEmailFormat, 'a valid email is expected') // Fail. Value is non-nil and not an email format
    .hasFailures(); // true
```

**NOTE:** `.Optional()` is only available on the base `Validator` exported from the package, not on Bound Validators.

### `Validator.isValidator(value)`

Test whether a value is an instance of `Validator`.

```js
Validator.isValidator: a -> Boolean

Validator.isValidator(Validator(1)); // true
Validator.isValidator(Validator.Optional(1)); // true
Validator.isValidator(Validator(1).assert(isString)); // true
```

**NOTE:** `.isValidator()` is only available on the base `Validator` exported from the package, not on Bound Validators.

### `Validator.withAssert(predicate, failureMessage)`

Bind an assertion to the Validator, creating a new Validator that will apply the assertion upon receiving a value. These bound Validators can have have further assertions bound to them or have assertions called on them as normal, creating a flexible means of sharing centralized Validator logic anywhere in your codebase. Each time you bind a new assertion, it creates a brand new Validator, leaving the previous one as-is.

```js
Validator.withAssert: (a -> Boolean, String) -> Validator

// Create a very base level bound Validator
const StringValidator = Validator.withAssert(isString, 'must be a string');
StringValidator('foo').getFailures(); // []
StringValidator(1).getFailures(); // ['must be a string']

// Create a validator for email addresses that builds on the StringValidator without modifying it
const EmailValidator = StringValidator.withAssert(isEmailFormat, 'must be an email address');
EmailValidator('jane@gmail.com').getFailures(); // []
EmailValidator('jane').getFailures(); // ['must be an email address']
EmailValidator(1).getFailures(); // ['must be a string', 'must be an email address']

// Apply a one-off assertion on the EmailValidator for this special case
EmailValidator('jane@gmail.com')
    .assert(isEmailDomain('example.com'), 'must be from the example.com domain')
    .getFailures(); // ['must be from the example.com domain']
```

```js
Validator.withAssertWhen: (((Boolean | a -> Boolean), a -> Boolean, String) -> Validator

// Create a very base level bound Validator
const StringValidator = Validator.withAssert(isString, 'must be a string');
StringValidator('foo').getFailures(); // []
StringValidator(1).getFailures(); // ['must be a string']

// Create a Bound Validator for a credit card number that supports the different card provider formats
const CreditCardNumberValidator = StringValidator
  .withAssertWhen(x => x.startsWith('5') || x.startsWith('4'), x => x.length === 16, 'Visa or MasterCard must be 16-digit number')
  .withAssertWhen(x => x.startsWith('3'), x => x.length === 15, 'American Express must be 15-digit number');

CreditCardNumberValidator(1).getFailures(); // ['must be a string']
CreditCardNumberValidator('555555555555444').getFailures(); // ['Visa or MasterCard must be 16-digit number']
CreditCardNumberValidator('3782822463100053').getFailures(); // ['American Express must be 15-digit number']
```

### `ValidationError`

A custom `Error` type used internally in this utility. There may be times where some bad data is passed into your validator which results in a validation function throwing an error. We don't want to lose the failure message, but we also want to know that an `Error` was thrown so that potential bugs can be fixed. In cases like this, the failure message will be wrapped in a `ValidationError` where the `message` property is set to the failure message provided to `.assert()` and the `originalError` property holds the thrown `Error`. You can then use `.getFailures()` to retrieve all the failure messages to display and `.getErrors()` to retrieve any thrown `Error`s to be logged in your logging system.

## Roadmap

- Make it so `ValidationError` doesn't require any ES6 polyfills (`Object.setPrototypeOf()`).
- Support Node.js environment.
- Support IE11.
- Validating a whole `<form>` (separate package with this as a dependency).
- Validate top level keys of an object (separate package with this as a dependency).
