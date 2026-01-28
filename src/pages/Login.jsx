import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Mail, Lock, AlertCircle, User, Eye, EyeOff } from "lucide-react";
import { createPageUrl } from "@/utils";
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export default function Login() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (mode === "signup" && password && passwordConfirm) {
      setPasswordMismatch(password !== passwordConfirm);
    }
  }, [password, passwordConfirm, mode]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        Hub.dispatch('auth', { event: 'signIn' });
        
        // Wait for Layout to process the auth event
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || createPageUrl("Dashboard");
        navigate(redirectTo, { replace: true });
      } else if (result.nextStep) {
        setError(`Additional step required: ${result.nextStep.signInStep}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message?.includes("User is not confirmed")) {
        setError("Please verify your email first. Check your inbox for a confirmation code.");
        setMode("confirm");
      } else if (err.message?.includes("Incorrect username or password")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: fullName
          }
        }
      });
      setMode("confirm");
      setError("");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.message?.includes("already")) {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.message?.includes("password")) {
        setError("Password does not meet requirements. Use 8+ characters with uppercase, lowercase, numbers, and symbols.");
      } else {
        setError(err.message || "Unable to create account. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleConfirmSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await confirmSignUp({ username: email, confirmationCode });
      setError("");
      
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        Hub.dispatch('auth', { event: 'signIn' });
        
        // Wait for Layout to process the auth event
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || createPageUrl("Dashboard");
        navigate(redirectTo, { replace: true });
      } else if (result.nextStep) {
        setError(`Additional step required: ${result.nextStep.signInStep}`);
      }
    } catch (err) {
      console.error("Confirmation error:", err);
      if (err.message?.includes("Invalid verification code")) {
        setError("Invalid confirmation code. Please check your email and try again.");
      } else if (err.message?.includes("already been confirmed")) {
        setError("Email already verified. Please sign in.");
        setMode("signin");
      } else if (err.message?.includes("User is not confirmed")) {
        setError("Please verify your email with the code sent to your inbox.");
      } else if (err.message?.includes("Incorrect username or password")) {
        setError("Email or password incorrect. Please try again.");
      } else {
        setError(err.message || "Unable to verify code. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await resetPassword({ username: email });
      setMode("resetConfirm");
      setError("");
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Unable to initiate password reset. Please try again.");
    }
    setIsLoading(false);
  };

  const handleResetPasswordConfirm = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: resetCode,
        newPassword: newPassword
      });
      setError("");
      setMode("signin");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Confirm reset error:", err);
      setError(err.message || "Unable to reset password. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-9 h-9 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            {mode === "confirm" ? "Verify Email" : mode === "resetConfirm" ? "Reset Password" : mode === "signup" ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <p className="text-slate-300 text-sm">
            {mode === "confirm" 
              ? "Enter the code sent to your email" 
              : mode === "resetConfirm"
              ? "Enter the code and new password"
              : mode === "signup" 
              ? "Sign up to start learning" 
              : "Sign in to continue to StockSignal"}
          </p>
        </CardHeader>

        <CardContent>
          {mode === "confirm" ? (
            <form onSubmit={handleConfirmSignUp} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-white">Confirmation Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 text-center text-2xl tracking-widest"
                />
                <p className="text-slate-400 text-xs">Check your email inbox for the 6-digit code</p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-slate-400 hover:text-white text-sm block w-full"
                >
                  Back to sign up
                </button>
              </div>
            </form>
          ) : mode === "resetConfirm" ? (
            <form onSubmit={handleResetPasswordConfirm} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="resetCode" className="text-white">Confirmation Code</Label>
                <Input
                  id="resetCode"
                  type="text"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPasswordConfirm" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="newPasswordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 ${newPasswordConfirm && newPassword !== newPasswordConfirm ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPasswordConfirm && newPassword !== newPasswordConfirm && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || (newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm)}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : mode === "signup" ? (
            <form onSubmit={handleSignUp} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={8}
                    className={`pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500 ${passwordMismatch ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p className="text-red-400 text-xs">Passwords do not match</p>
                )}
              </div>

              <p className="text-slate-400 text-xs">Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols</p>

              <Button
                type="submit"
                disabled={isLoading || passwordMismatch}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-blue-400 hover:text-blue-300 text-xs font-semibold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <p className="text-slate-300 text-sm">Enter your email address and we'll send you a code to reset your password.</p>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg disabled:opacity-50"
              >
                {isLoading ? "Sending Code..." : "Send Reset Code"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}

          {mode !== "forgot" && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(createPageUrl("Home"))}
                className="text-slate-400 hover:text-white text-sm"
              >
                Back to Home
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
