import { redirect } from 'next/navigation';

export default function ReportsPage() {
    // Simple redirect to revenue reports until a dashboard is built
    redirect('/reports/revenue');
}
