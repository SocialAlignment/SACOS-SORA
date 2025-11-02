// Story 3.1: User Authentication - Unauthorized Access Page

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md text-center p-8">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-destructive mb-4">403</h1>
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your administrator
            to request access.
          </p>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
