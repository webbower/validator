# Validator

Data validation made easy for user-facing error messages. Configure multiple tests with per-test error messages. Also handle JS Errors thrown by bad data.

Many validation libraries I've used (especially for HTML forms) bake the validation failure messages into each validator function even though the context for the error may be different in different parts of the site/app. HTML form validator library functions are usually locked into only being validator functions which means you can't use the same `isEmail` function for form validation and validating a string in my code, resulting in potentially inconsistent tests throughout your code. `Validator` allows you to use *any* predicate function (a function that takes any value and returns a boolean) that you have in your codebase and doesn't bake a one-size-(should)-fit-all error message into the testing function. This means your test regex or other heuristic will be consistent throughout your codebase. You'll need to BYO error display code.

The API for this utility was inspired by some functional programming (FP) concepts and libraries, most notably, the [FolkTale `Validation` utility](https://folktale.origamitower.com/api/v2.3.0/en/folktale.validation.html). `Validation` is written as an applicative functor which, while great if your goal is to adhere to pure functional patterns, is a bit obtuse to use for projects that aren't heavily using other FP libraries and patterns. This utility provides the same benefits without the overhead of FP types ported to JS.

## Support

`Validator` is written using only native ES5 functions except for `Object.setPrototypeOf()` which is available in IE11. If you need to support older than IE11, you'll need to polyfill `Object.setPrototypeOf()`. Additionally, ES6 syntax capabilities are used which requires transpilation for use in older browsers.

Node.js is not currently supported but it is planned.

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

### `ValidationError`

A custom `Error` type used internally in this utility. There may be times where some bad data is passed into your validator which results in a validation function throwing an error. We don't want to lose the failure message, but we also want to know that an `Error` was thrown so that potential bugs can be fixed. In cases like this, the failure message will be wrapped in a `ValidationError` where the `message` property is set to the failure message provided to `.assert()` and the `originalError` property holds the thrown `Error`. You can then use `.getFailures()` to retrieve all the failure messages to display and `.getErrors()` to retrieve any thrown `Error`s to be logged in your logging system.

## Roadmap

- Optional data where `null` or `undefined` would pass all assertions.
- Make it so `ValidationError` doesn't require any ES6 polyfills (`Object.setPrototypeOf()`).
- Support Node.js environment.
- Validating a whole `<form>`.
- Validate top level keys of an object.
- Assertion bundles: reusable validation function + failure message bundle.
