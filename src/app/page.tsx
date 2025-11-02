import { redirect } from 'next/navigation';

export default function HomePage() {
    // Redirect to new dashboard
    redirect('/dashboard');
}
