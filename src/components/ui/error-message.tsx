import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-lg bg-card border border-border ${className}`}>
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-muted-foreground text-center mb-4 max-w-md">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
