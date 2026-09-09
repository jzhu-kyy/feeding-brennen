import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Invalid request') {
    super(message, 400);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

type PostgresError = Error & { code?: string };

function postgresStatus(error: PostgresError): HttpError | null {
  switch (error.code) {
    case '23505':
      return new HttpError('Resource already exists', 409);
    case '23502':
    case '23503':
    case '22P02':
    case '22003':
      return new BadRequestError('Invalid request data');
    default:
      return null;
  }
}

/**
 * Central error -> HTTP response mapper for the API route handlers. Call it
 * from a route's `catch` block so error handling lives in one place:
 *
 *   try {
 *     ...
 *   } catch (err) {
 *     return handleError(err);
 *   }
 *
 * This is a STUB. Right now it always returns a generic 500. A real
 * implementation would inspect the error (validation vs. not-found vs.
 * conflict vs. unexpected) and choose an appropriate status code and shape.
 *
 * This is task A3. The write endpoints from A2 can't return sensible 400s and
 * 404s while every failure funnels into a 500.
 *
 * TODO (A3): map known error types to proper status codes (400, 404, 409, ...)
 * TODO (A3): avoid leaking internal error details in responses
 */
export function handleError(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  if (err instanceof Error) {
    const mappedError = postgresStatus(err as PostgresError);
    if (mappedError) {
      return NextResponse.json(
        { error: mappedError.message },
        { status: mappedError.status }
      );
    }
  }

  console.error('Unhandled API error:', err);

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
