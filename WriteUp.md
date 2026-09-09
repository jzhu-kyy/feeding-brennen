# Write-up

## 1. What did you build for Part B, and why that?

I built visit tracking: the home page now shows total spending, visit count,
average spend, recent dining history, and a form for logging a visit. A saved
visit immediately appears in the timeline and updates the summary; visits can
also be deleted.

I chose this because it closes the largest gap between the app's stated purpose
and its starting behavior. The schema already contained a seeded `visits` table,
but none of that data was reachable through HTTP or visible in the UI. Connecting
that existing model produced a useful end-to-end feature without inventing more
scope or changing the database prematurely.

## 2. What did you decide, and what did you rule out?

The frontend only talks to REST route handlers. `GET /api/visits` supplies the
timeline, `POST /api/visits` creates a record, and `DELETE /api/visits/:id`
supports undoing one. Validation lives beside the shared Part A validation code,
and all route failures pass through the shared error mapper.

The POST query uses `INSERT ... SELECT` against `restaurants`, so a nonexistent
restaurant becomes a clean `404` without a separate check-then-insert race. I
kept summary calculations in the client because the current dataset is small and
already needed for the timeline. I deliberately ruled out pagination, editing
visits, authentication, multiple currencies, and a new analytics table. The
tradeoff is that client-side aggregation will not scale to a large history; a
future version should expose a paginated visit feed and a database-backed summary
endpoint.

## 3. Where did you cut corners?

The delete action has no confirmation or recovery, dates use the browser's
native control, and all money is displayed as USD. With another day I would add
an undo toast, accessible interaction tests, and server-side pagination. I would
also harden the original restaurant fetch client so network failures render a
friendly page state instead of reaching the error boundary.

---

## Part B: routes

| Method and path | What it does | Success | Errors |
| --- | --- | --- | --- |
| `GET /api/visits` | Lists visits, newest date first | `200` + visit array | `500` on an unexpected server failure |
| `POST /api/visits` | Logs one dining visit | `201` + created visit | `400` invalid body; `404` restaurant missing |
| `DELETE /api/visits/:id` | Deletes one visit | `204`, no body | `404` invalid ID or visit missing |

**`POST /api/visits`**

```jsonc
// request
{
  "restaurantId": 1,
  "date": "2026-09-09",
  "amountSpent": 24.5,
  "notes": "Lunch with friends"
}

// 201 response
{
  "id": 4,
  "restaurantId": 1,
  "date": "2026-09-09",
  "amountSpent": 24.5,
  "notes": "Lunch with friends",
  "createdAt": "2026-09-09T19:00:00.000Z"
}
```

`amountSpent` and `notes` may be `null`. Dates must be real calendar dates in
`YYYY-MM-DD` format, and `restaurantId` must be a positive integer referring to
an existing restaurant.

## Schema changes

None. Part B uses the existing `visits` table from `001_create_tables.sql`.

## How I verified this

```bash
./setup.sh
cd client
npm test
npm run lint
npx tsc --noEmit
npm run build

# With `npm run dev` running in a separate terminal:
npm run verify:api
```

`verify:api` checks every Part A contract row plus malformed JSON, invalid
types/ranges, missing records, invalid IDs, and all three Part B routes. It
creates uniquely named test data and removes it before exiting. I also used the
browser UI to log a `$18.75` visit, confirmed the three summary values updated,
then removed the QA record and confirmed the seeded totals returned.

## Known issues / what I'd do next

- Visit results are not paginated; summary math loads the full visit history.
- There is no edit endpoint for correcting a visit.
- Restaurant names are not unique in the starter schema, so duplicate names are
  allowed even though database uniqueness errors are mapped to `409` centrally.
