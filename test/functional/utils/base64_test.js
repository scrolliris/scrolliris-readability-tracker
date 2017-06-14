import test from 'tape';

import Base64 from '../../../lib/utils/base64';

test('Base64.urlsafe_b64encode is callable', (t) => {
  t.equal(typeof Base64 === 'function', true, 'should be function');
  t.equal(Base64.urlsafe_b64encode('test'), 'AAA=');
  t.end();
});

test('Base64.urlsafe_b64encode\'s result', (t) => {
  test('should not contain "+, /, $ and #"', (t) => {
    // PhantomJS does not have Array.form (Array.from(Array(5)).forEach(...))
    for (let j = 0; j < 5; j++) {
      let str = Math.random().toString(36).slice(2)
      let res = Base64.urlsafe_b64encode(str)

      t.ok(null === res.match(/\+/));
      t.ok(null === res.match(/\//));
      t.ok(null === res.match(/\$/));
      t.ok(null === res.match(/\#/));
    }
    t.end();
  });
  t.end();
});
