import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ title = "Something went wrong", message, onRetry, className }: ErrorMessageProps) {
  return (
    <Card className={className}>
      <CardHeader className="items-center">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <CardDescription className="text-foreground">
          {message}
        </CardDescription>
      </CardContent>
      {onRetry && (
        <CardFooter className="flex justify-center">
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}