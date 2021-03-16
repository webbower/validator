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
const isEmailFormat = x => /[a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+\.[a-z]+/.test(x);
const isGmailAddress = x => x.split('@')[1] === 'gmail.com';
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
    expected: 'OptionalValidator',
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

describe('Validator.withAssert()', async assert => {
  assert({
    given: 'an assertion',
    should: 'return a custom Validator',
    actual: typeof Validator.withAssert(isString, 'a string is expected'),
    expected: 'function',
  });

  {
    const StringValidator = Validator.withAssert(isString, 'a string is expected');
    assert({
      given: 'an assertion and then a valid value',
      should: 'pass',
      actual: StringValidator('foo').hasErrors(),
      expected: false,
    });

    assert({
      given: 'an assertion and then an invalid value',
      should: 'fail',
      actual: [StringValidator(1).hasFailures(), StringValidator(1).getFailures()],
      expected: [true, ['a string is expected']],
    });

    const EmailValidator = StringValidator.withAssert(isEmailFormat, 'a valid email is expected');
    assert({
      given: 'adding a second bound assertion to a custom validator and then a valid value',
      should: 'pass',
      actual: EmailValidator('foo@bar.com').hasErrors(),
      expected: false,
    });

    assert({
      given:
        'adding a second bound assertion to a custom validator and then an invalid value that fails each',
      should: 'fail with each failure message',
      actual: EmailValidator(1).getFailures(),
      expected: ['a string is expected', 'a valid email is expected'],
    });

    const GmailEmailValidator = EmailValidator.withAssert(isGmailAddress, 'must be gmail.com domain');
    assert({
      given: 'a third bound assertion with a value that fails all validations',
      should: 'fail with all error messages',
      actual: GmailEmailValidator(1).getFailures(),
      expected: ['a string is expected', 'a valid email is expected', 'must be gmail.com domain'],
    });

    assert({
      given: 'a third bound assertion with a value that passes all validations',
      should: 'pass',
      actual: GmailEmailValidator('bob@gmail.com').getFailures(),
      expected: [],
    });
  }

  assert({
    given: 'the equivalent bound and manual validator assertions',
    should: 'provide the same result',
    actual: Validator(1).assert(isString, 'must be a string').assert(isEmailFormat, 'must be an email address').getFailures(),
    expected: ((Validator.withAssert(isString, 'must be a string')).withAssert(isEmailFormat, 'must be an email address'))(1).getFailures(),
});
});

describe('Validator.withAssertWhen()', async assert => {
  assert({
    given: 'an assertion to always apply signaled by a boolean literal',
    should: 'return a custom Validator',
    actual: typeof Validator.withAssertWhen(true, isNumber, 'a number is expected'),
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

  assert({
    given: 'an assertion',
    should: 'return a new Validator factory',
    actual: typeof Validator.withAssertWhen(isString, 'a string is expected') === 'function',
    expected: true,
  });

  {
    const NumberValidator = Validator.withAssertWhen(isNumber, x => x === 10, 'the number 10 is expected');
    assert({
      given:
        'an assertion to always apply signaled by a boolean value and then a valid value that matches the condition',
      should: 'pass',
      actual: [NumberValidator(1).getFailures(), NumberValidator(10).getFailures()],
      expected: [['the number 10 is expected'], []],
    });
  }

  {
    const StringValidator = Validator.withAssert(isString, 'a string is expected');
    const EmailValidator = StringValidator.withAssertWhen(isGmailAddress, isEmailFormat, 'a valid email is expected');
    assert({
      given: 'adding a second bound assertion to a custom validator and then a valid value',
      should: 'pass',
      actual: [
        EmailValidator('foo@gmail.com').hasFailures(),
        EmailValidator('foo@gmail.com').getFailures(),
      ],
      expected: [false, []],
    });
  }

  {
    // Create a Bound Validator for a credit card number that supports the different card provider formats
    const CreditCardNumberValidator = Validator
      .withAssert(isString, 'must be a string')
      .withAssertWhen(
        x => x.startsWith('5'),
        x => x.length === 16,
        'Visa must be 16-digit number'
      )
      .withAssertWhen(
        x => x.startsWith('3'),
        x => x.length === 15,
        'American Express must be 15-digit number'
      );

      assert({
        given: 'bound conditional assertions that are mutually exclusive',
        should: 'only report the failed assertion that matches the condition',
        actual: [
          CreditCardNumberValidator('555555555555444').getFailures(),
          CreditCardNumberValidator('3782822463100053').getFailures(),
        ],
        expected: [
          ['Visa must be 16-digit number'],
          ['American Express must be 15-digit number'],
        ],
      });
    }
});
