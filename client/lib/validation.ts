import { BadRequestError, NotFoundError } from './errors';

export interface RestaurantInput {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(
  value: unknown,
  field: 'cuisine' | 'address'
): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} must be a string or null`);
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function parseRestaurantInput(
  request: Request
): Promise<RestaurantInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new BadRequestError('Request body must be valid JSON');
  }

  if (!isObject(body)) {
    throw new BadRequestError('Request body must be a JSON object');
  }

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    throw new BadRequestError('name is required and must be a non-empty string');
  }

  if (
    body.rating !== undefined &&
    body.rating !== null &&
    (typeof body.rating !== 'number' ||
      !Number.isFinite(body.rating) ||
      body.rating < 0 ||
      body.rating > 5)
  ) {
    throw new BadRequestError('rating must be a number between 0 and 5, or null');
  }

  return {
    name: body.name.trim(),
    cuisine: optionalText(body.cuisine, 'cuisine'),
    address: optionalText(body.address, 'address'),
    rating: body.rating === undefined ? null : body.rating,
  };
}

export function parseRestaurantId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new NotFoundError('Restaurant not found');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new NotFoundError('Restaurant not found');
  }

  return id;
}
