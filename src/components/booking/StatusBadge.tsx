import { statusLabels, type BookingStatus } from '@/data/booking';

const styles: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  proposed: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-stone-200 text-stone-700',
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${styles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
