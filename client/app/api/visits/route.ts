import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { parseVisitInput } from '@/lib/validation';

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, "restaurantId", date, "amountSpent", notes,
              created_at AS "createdAt"
         FROM visits
        ORDER BY date DESC, created_at DESC`
    );

    return NextResponse.json(rows.map(toVisit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseVisitInput(request);
    const { rows } = await pool.query(
      `INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
       SELECT $1, $2, $3, $4
         FROM restaurants
        WHERE id = $1
       RETURNING id, "restaurantId", date, "amountSpent", notes,
                 created_at AS "createdAt"`,
      [input.restaurantId, input.date, input.amountSpent, input.notes]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toVisit(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
