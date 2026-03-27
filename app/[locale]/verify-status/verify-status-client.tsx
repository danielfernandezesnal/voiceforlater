"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type ContactStatus = "alive" | "critical" | "deceased" | "unknown";

type TokenState =
    | { stage: "loading" }
    | { stage: "invalid"; reason: "invalid" | "expired" | "used" }
    | { stage: "ready"; senderName: string };

type SubmitStage = "idle" | "confirming-deceased" | "submitting" | "success" | "error";

interface OptionCardProps {
    value: ContactStatus;
    selected: boolean;
    onSelect: (v: ContactStatus) => void;
    label: string;
    description: string;
    hint?: string;
    secondaryNote?: string;
}

function OptionCard({ value, selected, onSelect, label, description, hint, secondaryNote }: OptionCardProps) {
    return (
        <button
            id={`option-${value}`}
            type="button"
            onClick={() => onSelect(value)}
            className={`w-full text-left rounded-xl border transition-all duration-200 p-5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4623A]/40 ${
                selected
                    ? "border-[#C4623A] bg-[#C4623A]/5 shadow-sm"
                    : "border-[#E3DDD6] bg-white hover:border-[#C4623A]/40 hover:shadow-sm"
            }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        selected
                            ? "border-[#C4623A] bg-[#C4623A]"
                            : "border-[#D1C9C0] group-hover:border-[#C4623A]/50"
                    }`}
                >
                    {selected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-[15px] leading-snug transition-colors ${selected ? "text-[#2A2520]" : "text-[#3A322A]"}`}>
                        {label}
                    </p>
                    <p className={`mt-1 text-sm leading-relaxed transition-colors ${selected ? "text-[#5A4E44]" : "text-[#7A6E62]"}`}>
                        {description}
                    </p>
                    {hint && (
                        <p className="mt-2 text-xs text-[#9C9088] italic leading-relaxed">
                            {hint}
                        </p>
                    )}
                    {secondaryNote && (
                        <p className={`mt-2 text-xs leading-relaxed transition-colors ${selected ? "text-[#C4623A]" : "text-[#9C9088]"}`}>
                            {secondaryNote}
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}

function PageShell({ children, appName, footerNote }: { children: React.ReactNode; appName: string; footerNote: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F0EBE3] font-sans">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <p className="text-[#C4623A] font-semibold tracking-wide text-base">{appName}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E3DDD6] overflow-hidden">
                    {children}
                </div>
                <p className="text-center text-xs text-[#B5ADA5] mt-6">
                    {appName} · {footerNote}
                </p>
            </div>
        </div>
    );
}

function ErrorState({ reason, t, appName }: { reason: "invalid" | "expired" | "used"; t: any; appName: string }) {
    const messages: Record<typeof reason, string> = {
        invalid: t.errors.invalidToken,
        expired: t.errors.expiredToken,
        used: t.errors.alreadyUsed,
    };

    return (
        <PageShell appName={appName} footerNote={t.footerNote}>
            <div className="px-8 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#F0EBE3] flex items-center justify-center mx-auto mb-5">
                    <svg
                        className="w-6 h-6 text-[#C4623A]/70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                    </svg>
                </div>
                <p className="text-[#2A2520] font-medium text-base leading-snug">
                    {messages[reason]}
                </p>
            </div>
        </PageShell>
    );
}

function SuccessState({ t, appName }: { t: any; appName: string }) {
    return (
        <PageShell appName={appName} footerNote={t.footerNote}>
            <div className="px-8 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#EBF2EC] flex items-center justify-center mx-auto mb-5">
                    <svg
                        className="w-6 h-6 text-[#5F8060]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h2 className="text-[#2A2520] font-semibold text-xl mb-2">{t.success.title}</h2>
                <p className="text-[#7A6E62] text-sm leading-relaxed">{t.success.body}</p>
                <p className="text-[#B5ADA5] text-xs mt-4">{t.success.close}</p>
            </div>
        </PageShell>
    );
}

interface DeceasedConfirmProps {
    senderName: string;
    onConfirm: () => void;
    onBack: () => void;
    submitting: boolean;
    t: any;
    appName: string;
}

function DeceasedConfirm({ senderName, onConfirm, onBack, submitting, t, appName }: DeceasedConfirmProps) {
    const bodyText = t.deceasedConfirm.body.replace("{senderName}", senderName);

    return (
        <PageShell appName={appName} footerNote={t.footerNote}>
            <div className="px-8 py-10">
                <div className="w-8 h-0.5 bg-[#C4623A]/30 rounded-full mb-6" />

                <h2 className="text-[#2A2520] font-semibold text-lg mb-3">
                    {t.deceasedConfirm.title}
                </h2>

                {bodyText.split("\\n").map((line: string, i: number) => (
                    <p key={i} className={`text-[#5A4E44] text-sm leading-relaxed ${i > 0 ? "mt-2" : ""}`}>
                        {line}
                    </p>
                ))}

                <div className="mt-8 flex flex-col gap-3">
                    <button
                        id="btn-deceased-confirm"
                        type="button"
                        onClick={onConfirm}
                        disabled={submitting}
                        className="w-full py-3 px-6 rounded-xl bg-[#C4623A] text-white font-medium text-sm transition-all duration-200 hover:bg-[#A84F2D] active:scale-[0.98] disabled:opacity-50"
                    >
                        {submitting ? t.submitting : t.deceasedConfirm.confirm}
                    </button>

                    <button
                        id="btn-deceased-back"
                        type="button"
                        onClick={onBack}
                        disabled={submitting}
                        className="w-full py-3 px-6 rounded-xl border border-[#E3DDD6] bg-white text-[#5A4E44] font-medium text-sm transition-all duration-200 hover:bg-[#F7F3EE] active:scale-[0.98] disabled:opacity-50"
                    >
                        {t.deceasedConfirm.back}
                    </button>
                </div>
            </div>
        </PageShell>
    );
}

interface VerifyFormProps {
    token: string;
    senderName: string;
    t: any;
    appName: string;
}

function VerifyForm({ token, senderName, t, appName }: VerifyFormProps) {
    const [selected, setSelected] = useState<ContactStatus | null>(null);
    const [comment, setComment] = useState("");
    const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmitAttempt = () => {
        if (!selected) {
            setErrorMsg(t.errors.noOption);
            return;
        }
        setErrorMsg(null);

        if (selected === "deceased") {
            setSubmitStage("confirming-deceased");
        } else {
            doSubmit(selected);
        }
    };

    const doSubmit = async (status: ContactStatus) => {
        setSubmitStage("submitting");
        setErrorMsg(null);

        try {
            const res = await fetch("/api/verify-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    status,
                    comment: comment.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const code: string = data.code || "";
                if (code === "TOKEN_INVALID") setErrorMsg(t.errors.invalidToken);
                else if (code === "TOKEN_EXPIRED") setErrorMsg(t.errors.expiredToken);
                else if (code === "TOKEN_USED") setErrorMsg(t.errors.alreadyUsed);
                else setErrorMsg(data.error || t.errors.generic);
                
                setSubmitStage("error");
            } else {
                setSubmitStage("success");
            }
        } catch {
            setErrorMsg(t.errors.generic);
            setSubmitStage("error");
        }
    };

    if (submitStage === "confirming-deceased") {
        return (
            <DeceasedConfirm
                senderName={senderName}
                onConfirm={() => doSubmit("deceased")}
                onBack={() => setSubmitStage("idle")}
                submitting={false}
                t={t}
                appName={appName}
            />
        );
    }

    if (submitStage === "success") {
        return <SuccessState t={t} appName={appName} />;
    }

    const isSubmitting = submitStage === "submitting";

    return (
        <PageShell appName={appName} footerNote={t.footerNote}>
            <div className="px-8 pt-8 pb-10">
                <div className="mb-6">
                    <h1 className="text-[#2A2520] font-semibold text-xl leading-snug">
                        {t.title.replace("{senderName}", senderName)}
                    </h1>
                    <p className="mt-2 text-sm text-[#7A6E62] leading-relaxed">
                        {t.subtitle}
                    </p>
                </div>

                <div className="w-full h-px bg-[#E3DDD6] mb-6" />

                <div className="flex flex-col gap-3">
                    <OptionCard
                        value="alive"
                        selected={selected === "alive"}
                        onSelect={setSelected}
                        label={t.options.alive.label}
                        description={t.options.alive.description}
                    />
                    <OptionCard
                        value="critical"
                        selected={selected === "critical"}
                        onSelect={setSelected}
                        label={t.options.critical.label}
                        description={t.options.critical.description}
                        hint={t.options.critical.hint}
                    />
                    <OptionCard
                        value="deceased"
                        selected={selected === "deceased"}
                        onSelect={setSelected}
                        label={t.options.deceased.label}
                        description={t.options.deceased.description.replace("{senderName}", senderName)}
                        secondaryNote={t.options.deceased.secondary}
                    />
                    <OptionCard
                        value="unknown"
                        selected={selected === "unknown"}
                        onSelect={setSelected}
                        label={t.options.unknown.label}
                        description={t.options.unknown.description}
                    />
                </div>

                <div className="mt-6">
                    <label htmlFor="verify-comment" className="block text-sm font-medium text-[#5A4E44] mb-1.5">
                        {t.commentLabel}
                    </label>
                    <textarea
                        id="verify-comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t.commentPlaceholder}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-[#E3DDD6] bg-[#FAF7F2] px-4 py-3 text-sm text-[#2A2520] placeholder:text-[#B5ADA5] focus:outline-none focus:ring-2 focus:ring-[#C4623A]/30 focus:border-[#C4623A]/40 disabled:opacity-50 resize-none transition-all duration-200"
                    />
                </div>

                {(submitStage === "error" || errorMsg) && (
                    <div className="mt-4 rounded-lg bg-[#FDF5F3] border border-[#E8C5BA] px-4 py-3">
                        <p className="text-sm text-[#8B3A20] leading-relaxed">
                            {errorMsg || t.errors.generic}
                        </p>
                    </div>
                )}

                <button
                    id="btn-verify-submit"
                    type="button"
                    onClick={handleSubmitAttempt}
                    disabled={isSubmitting}
                    className="mt-6 w-full py-3.5 px-6 rounded-xl bg-[#C4623A] text-white font-medium text-sm transition-all duration-200 hover:bg-[#A84F2D] hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isSubmitting ? t.submitting : t.submit}
                </button>
            </div>
        </PageShell>
    );
}

export function VerifyStatusClient({ dictionary }: { dictionary: any }) {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [tokenState, setTokenState] = useState<TokenState>({ stage: "loading" });
    const t = dictionary.verifyStatus;
    const appName = dictionary.common.appName;

    useEffect(() => {
        if (!token) {
            setTokenState({ stage: "invalid", reason: "invalid" });
            return;
        }

        fetch(`/api/verify-status?token=${encodeURIComponent(token)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    const code: string = data.code || "";
                    if (code === "TOKEN_EXPIRED") setTokenState({ stage: "invalid", reason: "expired" });
                    else if (code === "TOKEN_USED") setTokenState({ stage: "invalid", reason: "used" });
                    else setTokenState({ stage: "invalid", reason: "invalid" });
                } else {
                    setTokenState({ stage: "ready", senderName: data.senderName || t.senderFallback });
                }
            })
            .catch(() => {
                setTokenState({ stage: "invalid", reason: "invalid" });
            });
    }, [token]);

    if (tokenState.stage === "loading") {
        return (
            <PageShell appName={appName} footerNote={t.footerNote}>
                <div className="px-8 py-12 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#C4623A]/30 border-t-[#C4623A] rounded-full animate-spin" />
                    <p className="text-sm text-[#9C9088]">{t.loading}</p>
                </div>
            </PageShell>
        );
    }

    if (tokenState.stage === "invalid") {
        return <ErrorState reason={tokenState.reason} t={t} appName={appName} />;
    }

    return <VerifyForm token={token!} senderName={tokenState.senderName} t={t} appName={appName} />;
}
