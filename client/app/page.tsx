import { getRestaurants, getVisits } from '@/lib/apiClient';
import VisitTracker from './VisitTracker';

// Server component. Fetches restaurants on each request and renders a plain
// list. There is no loading state, no empty state, and no error handling: if
// the API is down or returns something unexpected, this throws.
export default async function HomePage() {
  const [restaurants, visits] = await Promise.all([getRestaurants(), getVisits()]);

  return (
    <VisitTracker restaurants={restaurants} initialVisits={visits} />
  );
}
