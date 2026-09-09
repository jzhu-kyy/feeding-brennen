import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestError, NotFoundError } from './errors';
import { parseRestaurantId, parseRestaurantInput } from './validation';

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/restaurants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('parseRestaurantInput normalizes a valid body', async () => {
  const input = await parseRestaurantInput(
    jsonRequest({
      name: '  Valid Spot  ',
      cuisine: ' Test ',
      address: '',
      rating: 4.5,
    })
  );

  assert.deepEqual(input, {
    name: 'Valid Spot',
    cuisine: 'Test',
    address: null,
    rating: 4.5,
  });
});

test('parseRestaurantInput rejects malformed JSON', async () => {
  const request = new Request('http://localhost/api/restaurants', {
    method: 'POST',
    body: '{',
  });

  await assert.rejects(parseRestaurantInput(request), BadRequestError);
});

test('parseRestaurantInput rejects invalid fields', async () => {
  const invalidBodies = [
    null,
    [],
    {},
    { name: '   ' },
    { name: 'A', cuisine: 42 },
    { name: 'A', address: false },
    { name: 'A', rating: '4.5' },
    { name: 'A', rating: -1 },
    { name: 'A', rating: 6 },
  ];

  for (const body of invalidBodies) {
    await assert.rejects(parseRestaurantInput(jsonRequest(body)), BadRequestError);
  }
});

test('parseRestaurantId accepts positive integers', () => {
  assert.equal(parseRestaurantId('1'), 1);
  assert.equal(parseRestaurantId('42'), 42);
});

test('parseRestaurantId treats every invalid id as not found', () => {
  const invalidIds = ['abc', '-1', '0', '1.5', '', '9007199254740992'];

  for (const id of invalidIds) {
    assert.throws(() => parseRestaurantId(id), NotFoundError);
  }
});
