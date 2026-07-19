import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../../config';

const InputField = ({ label, endAdornment, ...props }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-ink-200">{label}</label>
        <div className="relative">
            <input
                {...props}
                className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
            />
            {endAdornment}
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
                        name,
                        email,
                        username: handle,
                        password,
                        codeforces_handle: cfHandle || null,
                        atcoder_handle: acHandle || null,
                        codechef_handle: ccHandle || null
                    }),
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || "Sign up failed.");
                }
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
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            <div className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="grid-pattern absolute inset-0 opacity-60" />
                <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-rank-blue/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rank-violet/10 blur-3xl" />

                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rank-blue/15 font-display text-lg font-semibold text-rank-blue ring-1 ring-rank-blue/30">
                        RS
                    </div>
                    <span className="font-display text-lg font-semibold tracking-tight text-ink-100">Ranking System</span>
                </div>

                <div className="relative z-10 max-w-md">
                    <p className="font-mono text-xs uppercase tracking-widest text-rank-cyan">
                        Welcome to our Ranking System (CSE, MBSTU)
                    </p>
                    <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink-100">
                        Track Your Competitive Programming Progress,
                        <br />
                        Stay Consistent and honest with yourself
                    </h1>
                    <p className="mt-4 text-ink-400">
                        Ranking based on our personal rating system.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 font-mono text-xs text-ink-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rank-green" />
                    rating-engine v1.3 · live
                </div>
            </div>

            <div className="flex items-center justify-center bg-ink-950 px-6 py-12 sm:px-10">
                <div className="w-full max-w-sm">
                    <h2 className="font-display text-2xl font-semibold text-ink-100">
                        {isSignUp ? "Create an account" : "Sign in"}
                    </h2>
                    <p className="mt-1.5 text-sm text-ink-400">
                        {isSignUp ? "Already have an account? " : "New here? "}
                        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-rank-blue hover:text-rank-cyan">
                            {isSignUp ? "Sign in instead" : "Create an account"}
                        </button>
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                        {isSignUp && (
                            <>
                                <InputField
                                    label="Full Name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Alice"
                                />
                                <InputField
                                    label="Email Address"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alice@example.com"
                                />
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <InputField
                                        label="Codeforces"
                                        type="text"
                                        value={cfHandle}
                                        onChange={(e) => setCfHandle(e.target.value)}
                                        placeholder="Handle"
                                    />
                                    <InputField
                                        label="AtCoder"
                                        type="text"
                                        value={acHandle}
                                        onChange={(e) => setAcHandle(e.target.value)}
                                        placeholder="Handle"
                                    />
                                    <InputField
                                        label="CodeChef"
                                        type="text"
                                        value={ccHandle}
                                        onChange={(e) => setCcHandle(e.target.value)}
                                        placeholder="Handle"
                                    />
                                </div>
                            </>
                        )}
                        <InputField
                            label="Vjudge Username"
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            placeholder="Same as your Vjudge Username"
                        />
                        <InputField
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-xs font-medium text-ink-400 hover:text-ink-200"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            }
                        />

                        {status === "error" && (
                            <div className="rounded-lg border border-rank-red/30 bg-rank-red/10 px-3.5 py-2.5 text-sm text-rank-red">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rank-blue px-4 py-2.5 font-medium text-ink-950 transition hover:bg-rank-cyan focus:outline-none disabled:opacity-60"
                        >
                            {status === "loading" ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}