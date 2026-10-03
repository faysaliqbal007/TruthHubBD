"use client";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flag, ThumbsDown, ThumbsUp } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export type ReactionType = "helpful" | "not_helpful";

export interface ReviewReactionResult {
  helpful_count: number;
  not_helpful_count: number;
  viewer_reaction: ReactionType | null;
}

export interface ReviewCardReactionsProps {
  reviewId: number;
  helpfulCount: number;
  notHelpfulCount?: number;
  viewerReaction?: ReactionType | null;
  canReact?: boolean;
  isOwner?: boolean;
  lang?: "en" | "bn";
  onChange?: (result: ReviewReactionResult) => void;
  onReport?: (reviewId: number) => void;
}

function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchCsrf(): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  await fetch(`${base}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export function ReviewCardReactions({
  reviewId,
  helpfulCount: initialHelpful = 0,
  notHelpfulCount: initialNotHelpful = 0,
  viewerReaction: initialViewerReaction = null,
  canReact = true,
  isOwner = false,
  lang = "en",
  onChange,
  onReport,
}: ReviewCardReactionsProps) {
  const { user } = useAuth();
  const location = useLocation();

  const [helpful, setHelpful] = useState(initialHelpful);
  const [notHelpful, setNotHelpful] = useState(initialNotHelpful);
  const [reaction, setReaction] = useState<ReactionType | null>(initialViewerReaction);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pending = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setHelpful(initialHelpful);
    setNotHelpful(initialNotHelpful);
    setReaction(initialViewerReaction);
  }, [initialHelpful, initialNotHelpful, initialViewerReaction]);

  const handleReact = async (type: ReactionType) => {
    if (!user || isOwner || canReact === false || pending.current || busy) return;

    pending.current = true;
    setBusy(true);
    setMessage("");

    // Calculate optimistic transition
    const prevReaction = reaction;
    const prevHelpful = helpful;
    const prevNotHelpful = notHelpful;

    let nextReaction: ReactionType | null = null;
    let nextHelpful = prevHelpful;
    let nextNotHelpful = prevNotHelpful;

    if (prevReaction === type) {
      // Toggle off
      nextReaction = null;
      if (type === "helpful") nextHelpful = Math.max(0, nextHelpful - 1);
      else nextNotHelpful = Math.max(0, nextNotHelpful - 1);
    } else {
      // Switch or new reaction
      nextReaction = type;
      if (type === "helpful") {
        nextHelpful = nextHelpful + 1;
        if (prevReaction === "not_helpful") nextNotHelpful = Math.max(0, nextNotHelpful - 1);
      } else {
        nextNotHelpful = nextNotHelpful + 1;
        if (prevReaction === "helpful") nextHelpful = Math.max(0, nextHelpful - 1);
      }
    }

    // Apply optimistic state
    setHelpful(nextHelpful);
    setNotHelpful(nextNotHelpful);
    setReaction(nextReaction);

    try {
      await fetchCsrf();
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const token = getXsrfToken();

      const response = await fetch(`${base}/api/reviews/${reviewId}/reaction`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { "X-XSRF-TOKEN": token } : {}),
        },
        body: JSON.stringify({ type }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.message || "Failed to update reaction.");
      }

      if (isMounted.current) {
        const result: ReviewReactionResult = {
          helpful_count: resData.helpful_count ?? nextHelpful,
          not_helpful_count: resData.not_helpful_count ?? nextNotHelpful,
          viewer_reaction: resData.viewer_reaction ?? nextReaction,
        };
        setHelpful(result.helpful_count);
        setNotHelpful(result.not_helpful_count);
        setReaction(result.viewer_reaction);
        onChange?.(result);

        const feedbackMsg =
          lang === "bn"
            ? result.viewer_reaction
              ? "মতামত সংরক্ষিত হয়েছে।"
              : "মতামত সরানো হয়েছে।"
            : result.viewer_reaction
            ? "Feedback saved."
            : "Feedback removed.";
        setMessage(feedbackMsg);
      }
    } catch (err: any) {
      if (isMounted.current) {
        // Rollback optimistic state
        setHelpful(prevHelpful);
        setNotHelpful(prevNotHelpful);
        setReaction(prevReaction);
        setMessage(err.message || "Reaction failed.");
      }
    } finally {
      pending.current = false;
      if (isMounted.current) setBusy(false);
    }
  };

  const signInUrl = `/login?next=${encodeURIComponent(
    location.pathname + location.search + location.hash
  )}`;
  const reportUrl = `/report?type=review&id=${reviewId}`;

  const isHelpfulActive = !!user && reaction === "helpful";
  const isNotHelpfulActive = !!user && reaction === "not_helpful";
  const cannotReact = !user || isOwner || canReact === false;

  return (
    <div
      className="review-card-reactions"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "10px",
        paddingTop: "8px",
        borderTop: "1px solid #f1f5f9",
      }}
      aria-busy={busy}
    >
      {/* Reaction Buttons Group */}
      <div
        role="group"
        aria-label={lang === "bn" ? "রিভিউ সহায়তা মতামত" : "Review helpfulness"}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        {/* Helpful (Upvote) Button */}
        <button
          type="button"
          disabled={cannotReact || busy}
          aria-pressed={isHelpfulActive}
          onClick={() => void handleReact("helpful")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            border: isHelpfulActive ? "1px solid #0f766e" : "1px solid #cbd5e1",
            background: isHelpfulActive ? "#f0fdfa" : "#ffffff",
            color: isHelpfulActive ? "#0f766e" : "#475569",
            cursor: cannotReact || busy ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ThumbsUp
            size={14}
            color={isHelpfulActive ? "#0f766e" : "currentColor"}
            aria-hidden="true"
          />
          <span>{lang === "bn" ? "সহায়ক" : "Helpful"}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "12px",
              color: isHelpfulActive ? "#0f766e" : "#64748b",
            }}
          >
            {helpful}
          </span>
        </button>

        {/* Not Helpful (Downvote) Button */}
        <button
          type="button"
          disabled={cannotReact || busy}
          aria-pressed={isNotHelpfulActive}
          onClick={() => void handleReact("not_helpful")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            border: isNotHelpfulActive ? "1px solid #b91c1c" : "1px solid #cbd5e1",
            background: isNotHelpfulActive ? "#fef2f2" : "#ffffff",
            color: isNotHelpfulActive ? "#b91c1c" : "#475569",
            cursor: cannotReact || busy ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <ThumbsDown
            size={14}
            color={isNotHelpfulActive ? "#b91c1c" : "currentColor"}
            aria-hidden="true"
          />
          <span>{lang === "bn" ? "সহায়ক নয়" : "Not helpful"}</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: "12px",
              color: isNotHelpfulActive ? "#b91c1c" : "#64748b",
            }}
          >
            {notHelpful}
          </span>
        </button>
      </div>

      {/* Report Trigger */}
      <div style={{ display: "inline-flex", alignItems: "center" }}>
        {onReport ? (
          <button
            type="button"
            onClick={() => onReport(reviewId)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              fontSize: "12px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <Flag size={13} aria-hidden="true" />
            <span>{lang === "bn" ? "রিপোর্ট" : "Report"}</span>
          </button>
        ) : (
          <Link
            to={user ? reportUrl : signInUrl}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#94a3b8",
              fontSize: "12px",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <Flag size={13} aria-hidden="true" />
            <span>
              {!user
                ? lang === "bn"
                  ? "রিপোর্ট করতে লগ ইন করুন"
                  : "Sign in to report"
                : lang === "bn"
                ? "রিপোর্ট"
                : "Report"}
            </span>
          </Link>
        )}
      </div>

      {/* Unauthenticated guest sign-in reminder */}
      {!user && (
        <Link
          to={signInUrl}
          style={{
            fontSize: "12px",
            color: "#0f766e",
            textDecoration: "underline",
            fontWeight: 500,
          }}
        >
          {lang === "bn" ? "মতামত দিতে সাইন ইন করুন" : "Sign in to react"}
        </Link>
      )}

      {/* Owner hint */}
      {user && (isOwner || canReact === false) && (
        <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
          {lang === "bn"
            ? "নিজের রিভিউতে ভোট দেওয়া যায় না।"
            : "You cannot vote on your own review."}
        </span>
      )}

      {/* Toast / status message */}
      {message && (
        <span
          role="status"
          style={{
            fontSize: "12px",
            color: message.includes("failed") ? "#dc2626" : "#0f766e",
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
