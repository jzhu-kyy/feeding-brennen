import assert from 'node:assert/strict';

const baseUrl = process.env.API_URL || 'http://localhost:3000';

async function api(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  const body = text === '' ? null : JSON.parse(text);
  return { response, text, body };
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function expectStatus(label, expected, request) {
  const result = await request;
  assert.equal(
    result.response.status,
    expected,
    `${label}: expected ${expected}, received ${result.response.status}: ${result.text}`
  );
  console.log(`✓ ${label} -> ${expected}`);
  return result;
}

const health = await expectStatus('GET /api/health', 200, api('/api/health'));
assert.deepEqual(health.body, { status: 'ok' });

const list = await expectStatus(
  'GET /api/restaurants',
  200,
  api('/api/restaurants')
);
assert.ok(Array.isArray(list.body));
assert.ok(list.body.length >= 1);

const first = list.body[0];
const single = await expectStatus(
  'GET /api/restaurants/:id',
  200,
  api(`/api/restaurants/${first.id}`)
);
assert.equal(single.body.id, first.id);
assert.equal(typeof single.body.rating, first.rating === null ? 'object' : 'number');

await expectStatus(
  'GET /api/restaurants/999999',
  404,
  api('/api/restaurants/999999')
);
await expectStatus(
  'GET /api/restaurants/abc',
  404,
  api('/api/restaurants/abc')
);

await expectStatus(
  'POST malformed JSON',
  400,
  api('/api/restaurants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  })
);
await expectStatus(
  'POST rating outside 0-5',
  400,
  api(
    '/api/restaurants',
    jsonOptions('POST', { name: 'Out Of Range', rating: 6 })
  )
);

const testName = `Contract Test ${Date.now()}`;
const created = await expectStatus(
  'POST /api/restaurants',
  201,
  api(
    '/api/restaurants',
    jsonOptions('POST', {
      name: testName,
      cuisine: 'Test',
      address: '2 Test St',
      rating: 4.5,
    })
  )
);
assert.equal(created.body.name, testName);
assert.equal(created.body.rating, 4.5);
assert.equal(typeof created.body.id, 'number');
assert.equal(typeof created.body.createdAt, 'string');

const id = created.body.id;

try {
  await expectStatus(
    'PUT invalid body',
    400,
    api(
      `/api/restaurants/${id}`,
      jsonOptions('PUT', { name: testName, rating: 'five' })
    )
  );
  await expectStatus(
    'PUT invalid id',
    404,
    api(
      '/api/restaurants/1.5',
      jsonOptions('PUT', { name: testName, rating: 5 })
    )
  );

  const updated = await expectStatus(
    'PUT /api/restaurants/:id',
    200,
    api(
      `/api/restaurants/${id}`,
      jsonOptions('PUT', {
        name: `${testName} Updated`,
        cuisine: null,
        address: null,
        rating: 5,
      })
    )
  );
  assert.equal(updated.body.name, `${testName} Updated`);
  assert.equal(updated.body.rating, 5);

  const deleted = await expectStatus(
    'DELETE /api/restaurants/:id',
    204,
    api(`/api/restaurants/${id}`, { method: 'DELETE' })
  );
  assert.equal(deleted.text, '');

  await expectStatus(
    'DELETE missing restaurant',
    404,
    api(`/api/restaurants/${id}`, { method: 'DELETE' })
  );
} finally {
  await api(`/api/restaurants/${id}`, { method: 'DELETE' });
}

console.log('\nPart A API contract verification passed.');

const visits = await expectStatus('GET /api/visits', 200, api('/api/visits'));
assert.ok(Array.isArray(visits.body));

await expectStatus(
  'POST visit with invalid date',
  400,
  api(
    '/api/visits',
    jsonOptions('POST', {
      restaurantId: first.id,
      date: '2026-02-30',
      amountSpent: 20,
    })
  )
);
await expectStatus(
  'POST visit for missing restaurant',
  404,
  api(
    '/api/visits',
    jsonOptions('POST', {
      restaurantId: 999999,
      date: '2026-09-09',
      amountSpent: 20,
    })
  )
);

const createdVisit = await expectStatus(
  'POST /api/visits',
  201,
  api(
    '/api/visits',
    jsonOptions('POST', {
      restaurantId: first.id,
      date: '2026-09-09',
      amountSpent: 24.5,
      notes: 'Contract verification',
    })
  )
);
assert.equal(createdVisit.body.restaurantId, first.id);
assert.equal(createdVisit.body.date, '2026-09-09');
assert.equal(createdVisit.body.amountSpent, 24.5);

const visitId = createdVisit.body.id;

try {
  await expectStatus(
    'DELETE visit with invalid id',
    404,
    api('/api/visits/abc', { method: 'DELETE' })
  );
  const deletedVisit = await expectStatus(
    'DELETE /api/visits/:id',
    204,
    api(`/api/visits/${visitId}`, { method: 'DELETE' })
  );
  assert.equal(deletedVisit.text, '');

  await expectStatus(
    'DELETE missing visit',
    404,
    api(`/api/visits/${visitId}`, { method: 'DELETE' })
  );
} finally {
  await api(`/api/visits/${visitId}`, { method: 'DELETE' });
}

console.log('Part B visit tracking verification passed.');
