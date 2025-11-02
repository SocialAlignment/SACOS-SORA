'use client';

import { DashboardForm } from '@/components/dashboard-form';
import type { DashboardFormData } from '@/types/dashboard';
import * as React from 'react';

const STORAGE_KEY = 'sacos-dashboard-form-data';

export default function DashboardPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    // Hydration safety: only access sessionStorage after mount
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = async (data: DashboardFormData, batchData: any) => {
        console.log('Dashboard form submitted:', data);
        setIsLoading(true);

        try {
            // Call batch generation API (Epic 2 Story 2.1)
            const response = await fetch('/api/generate-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(batchData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start batch generation');
            }

            const result = await response.json();

            console.log('[Dashboard] Batch generation started:', result);

            // Clear form data from sessionStorage after successful submission
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(STORAGE_KEY);
            }

            // Navigate to batch status page (Story 1.6)
            window.location.href = `/batch/${result.batchId}`;
        } catch (error) {
            console.error('[Dashboard] Batch submission failed:', error);
            alert(
                `Failed to start batch generation:\n\n${error instanceof Error ? error.message : 'Unknown error'}`
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) {
        // Prevent hydration mismatch - show loading state
        return (
            <main className='flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4 text-[#f5f5f5]'>
                <div className='text-center'>
                    <h1 className='text-3xl font-bold text-[#f5f5f5]'>Loading...</h1>
                </div>
            </main>
        );
    }

    return (
        <main className='flex min-h-screen flex-col items-center bg-[#0a0a0a] p-4 text-[#f5f5f5] md:p-8 lg:p-12'>
            <div className='w-full max-w-5xl space-y-6'>
                <div className='text-center'>
                    <h1 className='text-3xl font-bold text-[#f5f5f5]'>SACOS SORA</h1>
                    <p className='mt-2 text-[#f5f5f5]/60'>Multi-Brand Video Batch Configuration</p>
                </div>

                <DashboardForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        </main>
    );
}
