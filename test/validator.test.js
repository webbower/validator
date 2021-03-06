import { describe, Try } from 'riteway';
import Validator from '../src/validator';

const getTypeof = v => {
  if (Array.isArray(v)) {
    return 'array';
  } else if (v == null) {
    return String(v);
  } else {
    return typeof v;
  }
};

const convertFailuresAndErrorsForTesting = failure => {
  if (failure instanceof Error) {
    // FIXME For some reason, the custom ValidationError fields aren't coming through like `originalError`
    return failure.name;
  } else {
    return failure;
  }
};

const isString = x => typeof x === 'string';
const isNumber = x => typeof x === 'number';
const isFooish = x => ['foobar', 'foobaz'].includes(x);

describe('Validator()', async assert => {
  assert({
    given: 'the public API function',
    should: 'be have the correct function name',
    actual: Validator.name,
    expected: 'Validator',
  });

  assert({
    given: 'a value to validate',
    should: 'return a Validator object',
    actual: typeof Validator(1).assert,
    expected: 'function',
  });
});

describe('Validator.Optional()', async assert => {
  assert({
    given: 'the public API function',
    should: 'be have the correct function name',
    actual: Validator.Optional.name,
    expected: 'Validator.Optional',
  });

  assert({
    given: 'null',
    should: 'return a Validator object',
    actual: typeof Validator.Optional(null).assert,
    expected: 'function',
  });
});

describe('Validator.isValidator()', async assert => {
  assert({
    given: 'a Validator object',
    should: 'return true',
    actual: Validator.isValidator(Validator(1)),
    expected: true,
  });

  assert({
    given: 'an optional Validator object',
    should: 'return true',
    actual: Validator.isValidator(Validator.Optional(1)),
    expected: true,
  });

  assert({
    given: 'a Validator object after an assertion',
    should: 'return true',
    actual: Validator.isValidator(Validator(1).assert(isString, 'a string is expected')),
    expected: true,
  });

  assert({
    given: 'an optional Validator object after an assertion',
    should: 'return true',
    actual: Validator.isValidator(Validator.Optional(1).assert(isString, 'a string is expected')),
    expected: true,
  });

  [undefined, null, 1, 'foo', Symbol('foo'), [], {}, () => {}].forEach(invalid => {
    assert({
      given: `an non-Validator value (${getTypeof(invalid)})`,
      should: 'return false',
      actual: Validator.isValidator(invalid),
      expected: false,
    });
  });
});

describe('Validator#assert()', async assert => {
  assert({
    given: 'an assertion',
    should: 'return a Validator object',
    actual: typeof Validator(1).assert(isNumber, 'a number is expected').assert,
    expected: 'function',
  });
});

describe('Validator#assertWhen()', async assert => {
  assert({
    given: 'an assertion to always apply signaled by a boolean literal',
    should: 'return a Validator object',
    actual: typeof Validator(1).assertWhen(true, isNumber, 'a number is expected').assert,
    expected: 'function',
  });

  assert({
    given: 'an assertion to always run signaled by a function',
    should: 'return a Validator object',
    actual: typeof Validator(1).assertWhen(x => x === 1, isNumber, 'a number is expected').assert,
    expected: 'function',
  });

  [undefined, null, 1, 'foo', Symbol('foo'), [], {}].forEach(invalid => {
    assert({
      given: `an invalid data type for first argument (${getTypeof(invalid)})`,
      should: 'throw',
      actual: Try(() => Validator(1).assertWhen(invalid, isNumber, 'a number is expected')).name,
      expected: 'TypeError',
    });
  });
});

describe('Validator#hasFailures()', async assert => {
  assert({
    given: 'a Validator with all passing assertions',
    should: 'return false',
    actual: Validator(1).assert(isNumber, 'a number is expected').hasFailures(),
    expected: false,
  });

  assert({
    given: 'a Validator with at least one failing assertion',
    should: 'return true',
    actual: Validator('1').assert(isNumber, 'a number is expected').hasFailures(),
    expected: true,
  });

  assert({
    given: 'a Validator where an assertion threw an error',
    should: 'return true',
    actual: Validator(1)
      .assert(x => x.match(/\d+/ !== null), 'a number is expected')
      .hasFailures(),
    expected: true,
  });
});

describe('Validator#hasErrors()', async assert => {
  assert({
    given: 'a Validator with all passing assertions',
    should: 'return false',
    actual: Validator(1).assert(isNumber, 'a number is expected').hasErrors(),
    expected: false,
  });

  assert({
    given: 'a Validator with at least one failing assertion',
    should: 'return true',
    actual: Validator('1').assert(isNumber, 'a number is expected').hasErrors(),
    expected: false,
  });

  assert({
    given: 'a Validator where an assertion threw an error',
    should: 'return true',
    actual: Validator(1)
      .assert(x => x.match(/\d+/ !== null), 'a number is expected')
      .hasErrors(),
    expected: true,
  });
});

describe('Validator#getFailuresAndErrors()', async assert => {
  assert({
    given: 'a Validator with all passing assertions',
    should: 'return an empty array',
    actual: Validator(1).assert(isNumber, 'a number is expected').getFailuresAndErrors(),
    expected: [],
  });

  assert({
    given: 'a Validator with any failing assertions',
    should: 'return an array with all of the failing assertion messages',
    actual: Validator('1').assert(isNumber, 'a number is expected').getFailuresAndErrors(),
    expected: ['a number is expected'],
  });

  assert({
    given: 'a Validator where an assertion threw an error',
    should: 'return an array with the error as an entry',
    actual: Validator(1)
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getFailuresAndErrors()
      .map(convertFailuresAndErrorsForTesting),
    expected: ['ValidationError'],
  });

  assert({
    given: 'a Validator with failed and throwing assertions',
    should: 'return an array with failures messages and thrown errors',
    actual: Validator(1)
      .assert(isString, 'a string is expected')
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getFailuresAndErrors()
      .map(convertFailuresAndErrorsForTesting),
    expected: ['a string is expected', 'ValidationError'],
  });
});

describe('Validator#getFailures()', async assert => {
  assert({
    given: 'a Validator with all passing assertions',
    should: 'return an empty array',
    actual: Validator(1).assert(isNumber, 'a number is expected').getFailures(),
    expected: [],
  });

  assert({
    given: 'a Validator with a failed assertion',
    should: 'return an array with the failure message',
    actual: Validator('1').assert(isNumber, 'a number is expected').getFailures(),
    expected: ['a number is expected'],
  });

  assert({
    given: 'a Validator with only assertions that threw',
    should: 'return an array with the failure messages from the throwing assertions',
    actual: Validator(1)
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getFailures(),
    expected: ['a numeric string is expected'],
  });

  assert({
    given: 'a Validator with failed and throwing assertions',
    should: 'return an array with failure messages from failing and throwing assertions',
    actual: Validator(1)
      .assert(isString, 'a string is expected')
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getFailures(),
    expected: ['a string is expected', 'a numeric string is expected'],
  });
});

describe('Validator#getErrors()', async assert => {
  assert({
    given: 'a Validator with all passing assertions',
    should: 'return an empty array',
    actual: Validator(1).assert(isNumber, 'a number is expected').getErrors(),
    expected: [],
  });

  assert({
    given: 'a Validator with failing assertions',
    should: 'return an empty array',
    actual: Validator('1').assert(isNumber, 'a number is expected').getErrors(),
    expected: [],
  });

  assert({
    given: 'a Validator with throwing assertions',
    should: 'return an array the thrown errors',
    actual: Validator(1)
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getErrors()
      .map(convertFailuresAndErrorsForTesting),
    expected: ['ValidationError'],
  });

  assert({
    given: 'a Validator with failing and throwing assertions',
    should: 'return an array with only the thrown errors',
    actual: Validator(1)
      .assert(isString, 'a string is expected')
      .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
      .getErrors()
      .map(convertFailuresAndErrorsForTesting),
    expected: ['ValidationError'],
  });
});

describe('Validator#toStringTag', async assert => {
  assert({
    given: 'a Validator instance for `Object.prototype.toString.call()',
    should: 'should return the expected output',
    actual: Object.prototype.toString.call(Validator(1)),
    expected: '[object Validator]',
  });

  assert({
    given: 'an optional Validator instance for `Object.prototype.toString.call()',
    should: 'should return the expected output',
    actual: Object.prototype.toString.call(Validator.Optional(1)),
    expected: '[object Validator]',
  });
});

describe('Validator assertion tests', async assert => {
  assert({
    given: 'a passing assertion and a skipped conditional assertion',
    should: 'pass',
    actual: Validator('bar')
      .assert(isString, 'a string is expected')
      .assertWhen(
        v => v.startsWith('foo'),
        isFooish,
        'a foo-ish value is expected when value starts with "foo"'
      )
      .hasFailures(),
    expected: false,
  });

  assert({
    given: 'a passing assertion and an applied failed conditional assertion',
    should: 'fail',
    actual: Validator('foo')
      .assert(isString, 'a string is expected')
      .assertWhen(
        v => v.startsWith('foo'),
        isFooish,
        'a foo-ish value is expected when value starts with "foo"'
      )
      .hasFailures(),
    expected: true,
  });

  assert({
    given: 'a passing assertion and a skipped failing conditional assertion',
    should: 'pass',
    actual: Validator('foo')
      .assert(isString, 'a string is expected')
      .assertWhen(false, isFooish, 'a foo-ish value is expected when value starts with "foo"')
      .hasFailures(),
    expected: false,
  });

  assert({
    given: 'a passing assertion and an applied failing conditional assertion',
    should: 'fail',
    actual: Validator('foo')
      .assert(isString, 'a string is expected')
      .assertWhen(true, isFooish, 'a foo-ish value is expected when value starts with "foo"')
      .hasFailures(),
    expected: true,
  });

  assert({
    given: 'an optional Validator with a null value and a failing assertion',
    should: 'pass',
    actual: Validator.Optional(null).assert(isString, 'a string is expected').hasFailures(),
    expected: false,
  });

  assert({
    given: 'an optional Validator with an undefined value and a failing assertion',
    should: 'pass',
    actual: Validator.Optional(undefined).assert(isString, 'a string is expected').hasFailures(),
    expected: false,
  });

  assert({
    given: 'an optional Validator with a value and a failing assertion',
    should: 'fail',
    actual: Validator.Optional(1).assert(isString, 'a string is expected').hasFailures(),
    expected: true,
  });

  assert({
    given: 'an optional Validator with null and a skipped failing assertion',
    should: 'pass',
    actual: Validator.Optional(null)
      .assertWhen(false, isString, 'a string is expected')
      .hasFailures(),
    expected: false,
  });

  assert({
    given: 'an optional Validator with a value and an applied failing conditional assertion',
    should: 'fail',
    actual: Validator.Optional(1).assertWhen(true, isString, 'a string is expected').hasFailures(),
    expected: true,
  });
});
