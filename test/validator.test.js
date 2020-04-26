import test from 'tape';
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

const isString = x => typeof x === 'string';
const isNumber = x => typeof x === 'number';

test('Validator', t => {
    t.test('Validator() sanity checks', tt => {
        const actual = typeof Validator(1);
        const expected = 'object';
        tt.strictEqual(actual, expected, 'should return a Validator object');

        tt.end();
    });

    t.test('.assert() sanity checks', tt => {
        const actual = typeof Validator(1)
            .assert(isNumber, 'a number is expected')
            .assert;
        const expected = 'function';
        tt.strictEqual(actual, expected, 'should return a Validator object');

        tt.end();
    });

    t.test('.assertWhen() sanity checks', tt => {
        {
            const actual = typeof Validator(1)
                .assertWhen(true, isNumber, 'a number is expected')
                .assert;
            const expected = 'function';
            tt.strictEqual(actual, expected, 'should return a Validator object when first arg is boolean');
        }

        {
            const actual = typeof Validator(1)
                .assertWhen(() => true, isNumber, 'a number is expected')
                .assert;
            const expected = 'function';
            tt.strictEqual(actual, expected, 'should return a Validator object when first arg is function');
        }

        {
            [undefined, null, 1, 'foo', Symbol('foo'), [], {}].forEach(invalid => {
                const fn = () =>
                    Validator(1).assertWhen(invalid, isNumber, 'a number is expected');
                tt.throws(fn, TypeError, `should throw when first arg is ${getTypeof(invalid)}`);
            })
        }

        tt.end();
    });

    t.test('.hasFailures()', tt => {
        {
            const actual = Validator(1)
                .assert(isNumber, 'a number is expected')
                .hasFailures();
            const expected = false;
            tt.strictEqual(actual, expected, 'should not have any errors');
        }

        {
            const actual = Validator('1')
                .assert(isNumber, 'a number is expected')
                .hasFailures();
            const expected = true;
            tt.strictEqual(actual, expected, 'should have errors from validation failures');
        }

        {
            const actual = Validator(1)
                .assert(x => x.match(/\d+/ !== null), 'a number is expected')
                .hasFailures();
            const expected = true;
            tt.strictEqual(actual, expected, 'should have errors from thrown Errors');
        }

        tt.end();
    });

    t.test('.getFailuresAndErrors()', tt => {
        {
            const actual = Validator(1)
                .assert(isNumber, 'a number is expected')
                .getFailuresAndErrors();
            const expected = [];
            tt.deepEqual(actual, expected, 'should return an empty error set');
        }

        {
            const actual = Validator('1')
                .assert(isNumber, 'a number is expected')
                .getFailuresAndErrors();
            const expected = ['a number is expected'];
            tt.deepEqual(actual, expected, 'should return an array with the failure message');
        }

        {
            const actual = Validator(1)
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getFailuresAndErrors()[0];
            const expected = true;
            tt.strictEqual(actual instanceof Error, expected, 'should return an array with one thrown Error');
        }

        {
            const actual = Validator(1)
                .assert(isString, 'a string is expected')
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getFailuresAndErrors();
            const expected = ['a string is expected', true];
            tt.deepEqual(
                actual.map(x => x instanceof Error ? true : x),
                expected,
                'should return an array with one failure message and one thrown Error'
            );
        }

        tt.end();
    });

    t.test('.getFailures()', tt => {
        {
            const actual = Validator(1)
                .assert(isNumber, 'a number is expected')
                .getFailures();
            const expected = [];
            tt.deepEqual(actual, expected, 'should return an empty error set');
        }

        {
            const actual = Validator('1')
                .assert(isNumber, 'a number is expected')
                .getFailures();
            const expected = ['a number is expected'];
            tt.deepEqual(actual, expected, 'should return an array with the failure message');
        }

        {
            const actual = Validator(1)
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getFailures();
            const expected = ['a numeric string is expected'];
            tt.deepEqual(
                actual,
                expected,
                'should return an empty error set when only thrown Errors are present'
            );
        }

        {
            const actual = Validator(1)
                .assert(isString, 'a string is expected')
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getFailures();
            const expected = ['a string is expected', 'a numeric string is expected'];
            tt.deepEqual(
                actual,
                expected,
                'should return an array with one failure message when both failure messages and thrown Errors are present'
            );
        }

        tt.end();
    });

    t.test('.getErrors()', tt => {
        {
            const actual = Validator(1)
                .assert(isNumber, 'a number is expected')
                .getErrors();
            const expected = [];
            tt.deepEqual(actual, expected, 'should return an empty error set');
        }

        {
            const actual = Validator('1')
                .assert(isNumber, 'a number is expected')
                .getErrors();
            const expected = [];
            tt.deepEqual(actual, expected, 'should return an empty error set when only validation errors are present');
        }

        {
            const actual = Validator(1)
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getErrors();
            const expected = true;
            tt.strictEqual(
                actual[0] instanceof Error,
                expected,
                'should return an array with a single Error when only thrown Errors are present'
            );
        }

        {
            const actual = Validator(1)
                .assert(isString, 'a string is expected')
                .assert(x => x.match(/\d+/ !== null), 'a numeric string is expected')
                .getErrors();
            const expected = true;
            tt.strictEqual(
                actual[0] instanceof Error,
                expected,
                'should return an array with a single Error when validation messages and Errors are present'
            );
        }

        tt.end();
    });

    t.test('Logic checks', tt => {
        const isFooish = x => ['foobar', 'foobaz'].includes(x);

        {
            const actual = Validator('bar')
                .assert(isString, 'a string is expected')
                .assertWhen(v => v.startsWith('foo'), isFooish, 'a foo-ish value is expected when value starts with "foo"')
                .hasFailures();
            const expected = false;
            tt.strictEqual(actual, expected, '.assertWhen(fn) skipped: should pass assertions');
        }

        {
            const actual = Validator('foo')
                .assert(isString, 'a string is expected')
                .assertWhen(v => v.startsWith('foo'), isFooish, 'a foo-ish value is expected when value starts with "foo"')
                .hasFailures();
            const expected = true;
            tt.strictEqual(actual, expected, '.assertWhen(fn) applied: should pass assertions');
        }

        {
            const actual = Validator('foo')
                .assert(isString, 'a string is expected')
                .assertWhen(false, isFooish, 'a foo-ish value is expected when value starts with "foo"')
                .hasFailures();
            const expected = false;
            tt.strictEqual(actual, expected, '.assertWhen(bool) skipped: should pass assertions');
        }

        {
            const actual = Validator('foo')
                .assert(isString, 'a string is expected')
                .assertWhen(true, isFooish, 'a foo-ish value is expected when value starts with "foo"')
                .hasFailures();
            const expected = true;
            tt.strictEqual(actual, expected, '.assertWhen(bool) applied: should pass assertions');
        }

        tt.end();
    });
});
