import test from 'tape';

import UUID from '../../../src/util/uuid';

test('UUID.uuid4 is callable', (t) => {
  t.ok(typeof UUID === 'function', 'should be function');
  t.ok(typeof UUID.uuid4 === 'function', 'should be function');
  t.end();
});

test('UUID.uuid4\'s result', (t) => {
  let uuid = UUID.uuid4()
  t.ok(typeof uuid === 'string', 'should return string');
  t.ok(uuid !== UUID.uuid4(), 'should be generated every time as new uuid');
  t.ok(uuid.match(/^.{8}\-.{4}\-4.{3}\-.{4}\-.{12}$/) !== null,
    'should contain valid uuid4 format');
  t.end();
});
