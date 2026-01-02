"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { requestOtp, verifyOtp, storeAuthTokens } from "@/lib/api-service";

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [otpId, setOtpId] = useState<string | null>(null); // For development purposes
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
    
    try {
      const response = await requestOtp(username, password);
      
      // For development purposes, show the OTP ID
      if (process.env.NODE_ENV === 'development') {
        setOtpId(response.otp_id);
        toast({
          title: "OTP Request Successful",
          description: `OTP has been sent. For development: ${response.otp_id}`,
        });
      } else {
        toast({
          title: "OTP Sent",
          description: response.message,
        });
      }
      
      setUserId(response.user_id);
      setStep("otp");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Failed to request OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found. Please try logging in again.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await verifyOtp(userId, otp);
      
      // Store tokens in localStorage
      storeAuthTokens(response.access, response.refresh, response.user.id);
      
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard...",
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "OTP Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-4 sm:left-8 flex items-center gap-2 font-bold text-lg">
        <Logo width={150} height={32} />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {step === 'credentials' ? "Welcome Back" : "Two-Factor Authentication"}
          </CardTitle>
           <CardDescription>
            {step === 'credentials' 
              ? "Enter your credentials to access the dashboard."
              : "Enter the 6-digit code from your authenticator app."
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
                    className="h-10"
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
                    className="h-10"
                  />
                </div>
              </div>
              <Button type="submit" className="mt-6 w-full h-10" disabled={isLoading}>
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
                    className="h-10 text-center text-lg tracking-widest"
                  />
                  {process.env.NODE_ENV === 'development' && otpId && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Development: Use OTP {otpId}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="mt-6 w-full h-10" disabled={isLoading}>
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
