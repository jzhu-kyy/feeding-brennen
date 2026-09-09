import { BadRequestError, NotFoundError } from './errors';

export interface RestaurantInput {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
}

export interface VisitInput {
  restaurantId: number;
  date: string;
  amountSpent: number | null;
  notes: string | null;
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

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function parseVisitInput(request: Request): Promise<VisitInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new BadRequestError('Request body must be valid JSON');
  }

  if (!isObject(body)) {
    throw new BadRequestError('Request body must be a JSON object');
  }

  if (
    typeof body.restaurantId !== 'number' ||
    !Number.isSafeInteger(body.restaurantId) ||
    body.restaurantId <= 0
  ) {
    throw new BadRequestError('restaurantId must be a positive integer');
  }

  if (typeof body.date !== 'string' || !isCalendarDate(body.date)) {
    throw new BadRequestError('date must be a valid date in YYYY-MM-DD format');
  }

  if (
    body.amountSpent !== undefined &&
    body.amountSpent !== null &&
    (typeof body.amountSpent !== 'number' ||
      !Number.isFinite(body.amountSpent) ||
      body.amountSpent < 0 ||
      body.amountSpent > 99_999_999.99)
  ) {
    throw new BadRequestError(
      'amountSpent must be a non-negative number or null'
    );
  }

  if (
    body.notes !== undefined &&
    body.notes !== null &&
    typeof body.notes !== 'string'
  ) {
    throw new BadRequestError('notes must be a string or null');
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : null;

  return {
    restaurantId: body.restaurantId,
    date: body.date,
    amountSpent: body.amountSpent === undefined ? null : body.amountSpent,
    notes: notes === '' ? null : notes,
  };
}

export function parseVisitId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new NotFoundError('Visit not found');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new NotFoundError('Visit not found');
  }

  return id;
}
