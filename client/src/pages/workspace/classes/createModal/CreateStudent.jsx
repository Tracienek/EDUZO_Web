// src/pages/workspace/classes/createStudent
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../utils/newRequest";
import "./CreateModal.css";

const DEFAULT_FORM = { fullName: "", email: "" };

const unwrap = (res) => {
    const root = res?.data ?? res;
    const data = root?.metadata ?? root?.data ?? root ?? null;
    return data?.student ?? data?.newStudent ?? data;
};

export default function CreateStudent({ open, onClose, classId, onCreated }) {
    const { t } = useTranslation();

    const [form, setForm] = useState(DEFAULT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = useMemo(() => {
        return form.fullName.trim().length > 0 && form.email.trim().length > 0;
    }, [form.fullName, form.email]);

    useEffect(() => {
        if (open) {
            setForm(DEFAULT_FORM);
            setError("");
            setSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const update = (key) => (e) => {
        setError("");
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const closeOnBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const createViaClassEndpoint = (payload) => {
        if (!classId) throw new Error("Missing classId");
        return apiUtils.post(`/classes/${classId}/students`, payload);
    };

    const createViaStudentsEndpoint = (payload) =>
        apiUtils.post("/students", payload);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim().toLowerCase(),
                ...(classId ? { classId } : {}),
            };

            let res;
            try {
                res = classId
                    ? await createViaClassEndpoint(payload)
                    : await createViaStudentsEndpoint(payload);
            } catch (err1) {
                if (classId) res = await createViaStudentsEndpoint(payload);
                else throw err1;
            }

            const created = unwrap(res);
            onCreated?.(created);
            onClose?.();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    t("createStudent.createFailed"),
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="cm-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={closeOnBackdrop}
        >
            <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
                <button
                    className="cm-close"
                    type="button"
                    onClick={onClose}
                    aria-label={t("createStudent.close")}
                >
                    ×
                </button>

                <h3 className="cm-title">{t("createStudent.title")}</h3>

                <form className="cm-form" onSubmit={handleSubmit}>
                    <label className="cm-label">
                        <span>{t("createStudent.fullName")}</span>
                        <input
                            className="cm-input"
                            placeholder={t("createStudent.fullNamePlaceholder")}
                            value={form.fullName}
                            onChange={update("fullName")}
                            autoFocus
                        />
                    </label>

                    <label className="cm-label">
                        <span>{t("createStudent.email")}</span>
                        <input
                            className="cm-input"
                            type="email"
                            placeholder={t("createStudent.emailPlaceholder")}
                            value={form.email}
                            onChange={update("email")}
                        />
                    </label>

                    {error && <div className="cm-error">{error}</div>}

                    <div className="cm-divider" />

                    <button
                        className="cm-primary"
                        type="submit"
                        disabled={!canSubmit || submitting}
                    >
                        {submitting
                            ? t("createStudent.creating")
                            : t("createStudent.create")}
                    </button>
                </form>
            </div>
        </div>
    );
}
