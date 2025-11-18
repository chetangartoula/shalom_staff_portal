
import Link from 'next/link';
import { Button } from '@/components/ui/shadcn/button';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <div className="mb-8">
        <Logo className="h-20 w-20 text-primary mx-auto" />
        <h1 className="mt-6 text-6xl font-bold text-primary">404</h1>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Page Not Found</h2>
        <p className="mt-4 max-w-sm text-muted-foreground">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Go Back to Dashboard</Link>
      </Button>
    </div>
  );
}
