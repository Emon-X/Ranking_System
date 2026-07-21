import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, User, Mail, Code, Terminal, Layers } from "lucide-react";
import { API_BASE_URL } from "../../config";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

const InputField = ({ label, id, icon: Icon, error, endAdornment, className, ...props }) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={id} className="text-muted-foreground font-medium">{label}</Label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <Input
        id={id}
        className={cn(
          Icon ? "pl-9" : "",
          endAdornment ? "pr-10" : "",
          error ? "border-destructive focus-visible:ring-destructive" : "",
          "bg-background/50 backdrop-blur-sm"
        )}
        {...props}
      />
      {endAdornment && (
        <div className="absolute right-0 top-0 h-full flex items-center pr-3">
          {endAdornment}
        </div>
      )}
    </div>
  </div>
);

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cfHandle, setCfHandle] = useState("");
  const [acHandle, setAcHandle] = useState("");
  const [ccHandle, setCcHandle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!handle || !password || (isSignUp && (!name || !email))) {
      setStatus("error");
      setError("Please fill in all required fields.");
      return;
    }

    setStatus("loading");
    try {
      if (isSignUp) {
        const res = await fetch(`${API_BASE_URL}/auth/SignUp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, email, username: handle, password,
            codeforces_handle: cfHandle || null,
            atcoder_handle: acHandle || null,
            codechef_handle: ccHandle || null
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Sign up failed.");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", data.token || "");
        localStorage.setItem("userRole", data.role || "participant");
        localStorage.setItem("username", data.username || "");
        navigate("/");
      } else {
        const res = await fetch(`${API_BASE_URL}/auth/SignIn?username=${encodeURIComponent(handle)}&password=${encodeURIComponent(password)}`, {
          method: "POST"
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Invalid handle or password.");
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", data.token || "");
        localStorage.setItem("userRole", data.role || "participant");
        localStorage.setItem("username", data.username || "");
        navigate("/");
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Something went wrong. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* Left Decorative Section - Only visible on md+ */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden bg-muted/20 border-r flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-success/20 blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ACM Lab System</span>
          </div>

          <div className="max-w-md mt-20">
            <Badge variant="outline" className="mb-6 font-mono border-primary/50 text-primary bg-primary/5">
              MBSTU Competitive Programming
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-success">Progress</span>.<br />
              Prove Your Skills.
            </h1>
            <p className="text-lg text-muted-foreground">
              A unified platform for tracking ratings, contest performances, and problem-solving statistics across Codeforces, AtCoder, and VJudge.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-mono text-muted-foreground mt-auto">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            System Online
          </div>
          <span>v2.0.0</span>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20 md:hidden z-0" />
        
        <Card className="w-full max-w-[440px] z-10 border-border/50 shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-2 md:hidden">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-base">
              {isSignUp ? "Already have an account?" : "New to the platform?"}{" "}
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setStatus("idle"); }} 
                className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                {isSignUp ? "Sign in instead" : "Create an account"}
              </button>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              
              <AnimatePresence mode="popLayout">
                {isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <InputField label="Full Name" id="name" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
                    <InputField label="Email Address" id="email" type="email" icon={Mail} value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
                    
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Layers className="h-3 w-3" /> Linked Accounts
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                         <InputField label="Codeforces" id="cf" icon={Code} value={cfHandle} onChange={e => setCfHandle(e.target.value)} placeholder="Handle" />
                         <InputField label="AtCoder" id="ac" icon={Code} value={acHandle} onChange={e => setAcHandle(e.target.value)} placeholder="Handle" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <InputField 
                  label="VJudge Username" 
                  id="handle" 
                  icon={Terminal} 
                  value={handle} 
                  onChange={e => setHandle(e.target.value)} 
                  placeholder={isSignUp ? "Your primary username" : "Enter your handle"} 
                />
                
                <InputField 
                  label="Password" 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  icon={Lock} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  endAdornment={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground transition-colors p-1" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>

              <AnimatePresence>
                {status === "error" && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                type="submit" 
                className="w-full font-semibold h-11 text-base mt-2" 
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}