import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { parseVisitId } from '@/lib/validation';

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = parseVisitId(params.id);
    const result = await pool.query('DELETE FROM visits WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Visit not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
