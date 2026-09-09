import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { parseRestaurantId, parseRestaurantInput } from '@/lib/validation';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const { rows } = await pool.query(
      `SELECT id, name, cuisine, address, rating,
              created_at AS "createdAt"
         FROM restaurants
        WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant.
 *
 * TODO (A2): implement. Update the row matching :id and return the updated
 * record (or 404 if it doesn't exist). Validate the body the same way POST does.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const input = await parseRestaurantInput(req);
    const { rows } = await pool.query(
      `UPDATE restaurants
          SET name = $1, cuisine = $2, address = $3, rating = $4
        WHERE id = $5
        RETURNING id, name, cuisine, address, rating,
                  created_at AS "createdAt"`,
      [input.name, input.cuisine, input.address, input.rating, id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant.
 *
 * TODO (A2): implement. Delete the row matching :id and return 204 (or 404
 * if it doesn't exist).
 *
 * Worth noticing: the migration already made a call about what happens to that
 * restaurant's visits. Go read it. If you disagree with it, say so in your
 * write-up.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const result = await pool.query('DELETE FROM restaurants WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
