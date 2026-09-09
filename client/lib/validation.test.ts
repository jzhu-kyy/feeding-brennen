import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestError, NotFoundError } from './errors';
import {
  parseRestaurantId,
  parseRestaurantInput,
  parseVisitId,
  parseVisitInput,
} from './validation';

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

test('parseVisitInput normalizes a valid body', async () => {
  const input = await parseVisitInput(
    jsonRequest({
      restaurantId: 2,
      date: '2026-09-09',
      amountSpent: 24.5,
      notes: '  Lunch with friends  ',
    })
  );

  assert.deepEqual(input, {
    restaurantId: 2,
    date: '2026-09-09',
    amountSpent: 24.5,
    notes: 'Lunch with friends',
  });
});

test('parseVisitInput rejects invalid fields', async () => {
  const invalidBodies = [
    {},
    { restaurantId: 0, date: '2026-09-09' },
    { restaurantId: 1.5, date: '2026-09-09' },
    { restaurantId: 1, date: '09/09/2026' },
    { restaurantId: 1, date: '2026-02-30' },
    { restaurantId: 1, date: '2026-09-09', amountSpent: -1 },
    { restaurantId: 1, date: '2026-09-09', amountSpent: '20' },
    { restaurantId: 1, date: '2026-09-09', notes: 42 },
  ];

  for (const body of invalidBodies) {
    await assert.rejects(parseVisitInput(jsonRequest(body)), BadRequestError);
  }
});

test('parseVisitId accepts positive integers and rejects invalid ids', () => {
  assert.equal(parseVisitId('7'), 7);
  assert.throws(() => parseVisitId('abc'), NotFoundError);
  assert.throws(() => parseVisitId('-1'), NotFoundError);
});
