import { useState } from "react";
import {
    User,
    UserPlus,
    Mail,
    Lock,
    Eye,
    EyeOff,
    X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import storeLogo from "../assets/store-logo.png";
import "./RegisterPage.css";

export default function RegisterPage({
    onClose,
    openLogin,
}) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    async function handleRegister(e) {
        e.preventDefault();

        const {
            data: authData,
            error: authError,
        } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            alert("Registration failed: " + authError.message);
            return;
        }

        if (!authData?.user) {
            alert("Registration failed.");
            return;
        }

        const { data: existingUser } = await supabase
            .from("accounts")
            .select("id")
            .eq("username", username)
            .maybeSingle();

        if (existingUser) {
            alert("Username already exists.");
            return;
        }

        const { error: profileError } = await supabase
            .from("accounts")
            .insert([
                {
                    auth_user_id: authData.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    email,
                    role: "customer",
                },
            ]);

        if (profileError) {
            alert(profileError.message);
            return;
        }

        alert("Account created successfully!");

        onClose();
    }

    return (
        <div className="register-overlay">
            <div
                className="register-modal"
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className="close-btn"
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

                    <h1>Create your account</h1>

                    <p className="register-subtitle">
                        Join Evelyn's Store and enjoy fresh groceries delivered to your doorstep.
                        <span className="heart"> ♥</span>
                    </p>
                    <form
                        className="register-form"
                        onSubmit={handleRegister}
                    >

                        <div className="name-grid">

                            <div className="input-group">
                                <User size={18} />

                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <User size={18} />

                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    required
                                />
                            </div>

                        </div>

                        <div className="input-group">
                            <User size={18} />

                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Mail size={18} />

                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
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
                                    : <EyeOff size={18} />
                                }
                            </button>

                        </div>

                        <button
                            type="submit"
                            className="register-button"
                        >
                            <UserPlus size={18} />
                            <span>Create Account</span>
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