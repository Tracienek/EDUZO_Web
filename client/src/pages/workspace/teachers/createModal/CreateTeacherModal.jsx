// CreateTeacherModal.jsx
import { useEffect, useMemo, useState } from "react";
import { apiUtils } from "../../../../utils/newRequest";
import "./CreateTeacherModal.css";

const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CreateTeacherModal({ open, onClose, onCreated }) {
    const [inputs, setInputs] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        const nameOk = inputs.fullName.trim().length > 0;
        const email = inputs.email.trim().toLowerCase();
        const emailOk = email.length > 0 && isValidEmail(email);
        const pwOk = String(inputs.password || "").trim().length >= 4;
        return nameOk && emailOk && pwOk && !isSubmitting;
    }, [inputs, isSubmitting]);

    useEffect(() => {
        if (!open) return;

        setInputs({ fullName: "", email: "", password: "" });
        setErrors({});
        setIsSubmitting(false);

        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const onChange = (e) => {
        const { name, value } = e.target;
        setInputs((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: "", serverError: "" }));
    };

    const validate = () => {
        const errs = {};

        if (!inputs.fullName.trim()) errs.fullName = "Name is required";

        const email = inputs.email.trim().toLowerCase();
        if (!email) errs.email = "Email is required";
        else if (!isValidEmail(email)) errs.email = "Invalid email format";

        const pw = String(inputs.password || "").trim();
        if (!pw) errs.password = "Password is required";
        else if (pw.length < 8)
            errs.password = "Password must be at least 8 characters";

        return errs;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const v = validate();
        if (Object.keys(v).length) {
            setErrors(v);
            return;
        }

        try {
            setIsSubmitting(true);

            const payload = {
                fullName: inputs.fullName.trim(),
                email: inputs.email.trim().toLowerCase(),
                password: String(inputs.password || "").trim(),
            };

            const res = await apiUtils.post("/center/teachers", payload);
            const data = unwrap(res);
            const created = data?.teacher ?? data;

            onCreated?.(created);
            onClose?.();
        } catch (err) {
            const status = err?.response?.status;
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Create teacher failed. Try again.";

            if (status === 409) {
                setErrors((p) => ({ ...p, email: "Email already exists" }));
                return;
            }

            setErrors({ serverError: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ctm-backdrop" onMouseDown={onClose} role="presentation">
            <div
                className="ctm-modal"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ctm-title"
            >
                <div className="ctm-header">
                    <div>
                        <h3 id="ctm-title">Create Teacher</h3>
                        <p>Please set an initial password</p>
                    </div>

                    <button
                        className="ctm-x"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form className="ctm-form" onSubmit={submit}>
                    <div className="ctm-field">
                        <label>Name</label>
                        <input
                            name="fullName"
                            value={inputs.fullName}
                            onChange={onChange}
                            className={errors.fullName ? "error" : ""}
                            autoFocus
                        />
                        {errors.fullName && (
                            <p className="ctm-error">{errors.fullName}</p>
                        )}
                    </div>

                    <div className="ctm-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={inputs.email}
                            onChange={onChange}
                            className={errors.email ? "error" : ""}
                        />
                        {errors.email && (
                            <p className="ctm-error">{errors.email}</p>
                        )}
                    </div>

                    <div className="ctm-field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={inputs.password}
                            onChange={onChange}
                            className={errors.password ? "error" : ""}
                        />
                        {errors.password && (
                            <p className="ctm-error">{errors.password}</p>
                        )}
                    </div>

                    {errors.serverError && (
                        <p className="ctm-error">{errors.serverError}</p>
                    )}

                    <div className="ctm-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={!canSubmit}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
