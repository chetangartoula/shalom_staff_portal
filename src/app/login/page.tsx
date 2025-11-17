
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mountain, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCredentialSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Username and password cannot be empty.",
      });
      return;
    }

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === "admin" && password === "password") {
        setStep("otp");
    } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid username or password.",
        });
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (otp === "123456") {
      // In a real app, you'd finalize the session here.
      router.push("/");
    } else {
      toast({
        variant: "destructive",
        title: "OTP Verification Failed",
        description: "The OTP you entered is incorrect.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Mountain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Shalom Dashboard</CardTitle>
           <CardDescription>
            {step === 'credentials' 
              ? "Enter your credentials to access the dashboard."
              : "Enter the OTP sent to your device."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleCredentialSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          ) : (
             <form onSubmit={handleOtpSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
