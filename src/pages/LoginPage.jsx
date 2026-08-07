import { useState } from "react";
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import storeLogo from "../assets/store-logo.png";
import "./LoginPage.css";

export default function LoginPage({
    onClose,
    openRegister,
}) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();

        let email = login;

        if (!login.includes("@")) {
            const { data, error } = await supabase
                .from("accounts")
                .select("email")
                .eq("username", login)
                .maybeSingle();

            console.log("Lookup:", data);
            console.log("Lookup error:", error);

            if (error || !data) {
                alert("Username not found.");
                return;
            }

            email = data.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        console.log("Login data:", data);
        console.log("Login error:", error);

        if (error) {
            alert(error.message);
            return;
        }
        onClose();
    }

    return (
        <div className="register-overlay">
            <div
                className="register-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="login-close-button"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <div className="register-left">

                    <img
                        src={storeLogo}
                        alt="logo"
                        className="register-logo"
                    />

                    <h1>Welcome Back</h1>

                    <p className="register-subtitle">
                        Login to continue shopping at Evelyn's Store.
                    </p>

                    <form
                        className="register-form"
                        onSubmit={handleLogin}
                    >
                        <div className="input-group">
                            <Mail size={18} />

                            <input
                                type="text"
                                placeholder="Email or Username"
                                value={login}
                                onChange={(e) =>
                                    setLogin(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Lock size={18} />

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword
                                    ? <Eye size={18} />
                                    : <EyeOff size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="register-button"
                        >
                            <LogIn size={18} />
                            <span>Login</span>
                        </button>

                        <div className="divider">
                            <span>or continue with</span>
                        </div>

                        <button
                            type="button"
                            className="google-button"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                            />

                            Continue with Google
                        </button>

                        <p className="login-link">
                            Don't have an account?

                            <span
                                onClick={() => {
                                    onClose();
                                    openRegister();
                                }}
                            >
                                Register
                            </span>
                        </p>

                    </form>

                </div>
            </div>
        </div>
    );
}
