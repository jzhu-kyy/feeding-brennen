'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Restaurant, Visit } from '@/lib/types';

interface Props {
  restaurants: Restaurant[];
  initialVisits: Visit[];
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function localDateValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function newestVisitFirst(a: Visit, b: Visit) {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

export default function VisitTracker({ restaurants, initialVisits }: Props) {
  const [visits, setVisits] = useState(initialVisits);
  const [restaurantId, setRestaurantId] = useState(
    restaurants[0]?.id.toString() ?? ''
  );
  const [date, setDate] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setDate(localDateValue()), []);

  const restaurantsById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants]
  );
  const totalSpent = visits.reduce(
    (total, visit) => total + (visit.amountSpent ?? 0),
    0
  );
  const visitsWithSpend = visits.filter((visit) => visit.amountSpent !== null);
  const averageSpent =
    visitsWithSpend.length === 0 ? 0 : totalSpent / visitsWithSpend.length;

  async function addVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          date,
          amountSpent: amountSpent === '' ? null : Number(amountSpent),
          notes: notes === '' ? null : notes,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? 'Could not save visit');
      }

      setVisits((current) =>
        [...current, body].sort(newestVisitFirst)
      );
      setAmountSpent('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save visit');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeVisit(id: number) {
    setError(null);
    try {
      const response = await fetch(`/api/visits/${id}`, { method: 'DELETE' });

      if (response.ok) {
        setVisits((current) => current.filter((visit) => visit.id !== id));
        return;
      }

      const body = await response.json();
      setError(body.error ?? 'Could not delete visit');
    } catch {
      setError('Could not delete visit');
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
          Spending snapshot
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total spent" value={money.format(totalSpent)} />
          <SummaryCard label="Visits" value={visits.length.toString()} />
          <SummaryCard label="Average" value={money.format(averageSpent)} />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">Recent activity</p>
              <h2 className="text-2xl font-semibold tracking-tight">Dining visits</h2>
            </div>
            <span className="text-sm text-gray-500">Newest first</span>
          </div>

          {visits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
              No visits yet. Add the first one.
            </div>
          ) : (
            <ul className="space-y-3">
              {visits.map((visit) => (
                <li
                  key={visit.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {restaurantsById.get(visit.restaurantId)?.name ??
                          'Unknown restaurant'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{visit.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">
                        {visit.amountSpent === null
                          ? '—'
                          : money.format(visit.amountSpent)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeVisit(visit.id)}
                        className="mt-2 text-xs text-gray-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {visit.notes && (
                    <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
                      {visit.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={addVisit}
          className="h-fit rounded-2xl bg-gray-900 p-6 text-white shadow-xl"
        >
          <p className="text-sm font-medium text-emerald-300">Quick entry</p>
          <h2 className="mt-1 text-xl font-semibold">Log a visit</h2>

          <label className="mt-6 block text-sm" htmlFor="restaurant">
            Restaurant
          </label>
          <select
            id="restaurant"
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5"
          />

          <label className="mt-4 block text-sm" htmlFor="amount">
            Amount spent
          </label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amountSpent}
            onChange={(event) => setAmountSpent(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5"
          />

          <label className="mt-4 block text-sm" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="What stood out?"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 w-full resize-none rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5"
          />

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || restaurants.length === 0}
            className="mt-5 w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-gray-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save visit'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Restaurant guide</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{restaurant.name}</span>
                <span className="text-sm text-amber-600">
                  {restaurant.rating === null ? 'Unrated' : `${restaurant.rating}★`}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {[restaurant.cuisine, restaurant.address].filter(Boolean).join(' · ') ||
                  'Details coming soon'}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
