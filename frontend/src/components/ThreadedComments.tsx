"use client";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CornerDownRight, MessageCircle, Send } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { CommentItem, type Comment } from "./CommentItem";

export interface ThreadedCommentsProps {
  title?: string;
  reviewId?: number | string;
  compact?: boolean;
  hideHeader?: boolean;
  onCountChange?: (count: number) => void;
  onReportComment?: (commentId: number) => void;
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

export function ThreadedComments({
  title,
  reviewId,
  compact = false,
  hideHeader = false,
  onCountChange,
  onReportComment,
}: ThreadedCommentsProps) {
  const { user } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [parent, setParent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const countCallback = useRef(onCountChange);
  useEffect(() => {
    countCallback.current = onCountChange;
  }, [onCountChange]);

  useEffect(() => {
    setComments([]);
    setText("");
    setParent(null);
    setError("");
  }, [reviewId]);

  // Load comments for the review
  useEffect(() => {
    if (!reviewId) return;
    let active = true;
    setLoading(true);

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${base}/api/reviews/${reviewId}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load comments.");
        return res.json();
      })
      .then((json) => {
        if (active) {
          const list: Comment[] = json.data?.comments || json.comments || [];
          setComments(list);
          countCallback.current?.(list.length);
          setError("");
        }
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reviewId, attempt]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewId || !text.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      await fetchCsrf();
      const base = process.env.NEXT_PUBLIC_API_URL ?? "";
      const token = getXsrfToken();

      const response = await fetch(`${base}/api/reviews/${reviewId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { "X-XSRF-TOKEN": token } : {}),
        },
        body: JSON.stringify({
          body: text.trim(),
          parent_id: parent,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.message || "Failed to post comment.");
      }

      setText("");
      setParent(null);
      setAttempt((n) => n + 1);
    } catch (err: any) {
      setError(err.message || "Could not submit your comment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleReply = (targetComment: Comment) => {
    setParent(targetComment.parent_id || targetComment.id);
    const textarea = document.getElementById(`comment-input-${reviewId}`);
    textarea?.focus();
  };

  const displayTitle = title || "Community discussion";
  const commentIds = new Set(comments.map((c) => c.id));
  const replyTarget = comments.find((c) => c.id === parent);
  const rootComments = comments.filter((c) => !c.parent_id || !commentIds.has(c.parent_id));

  const signInUrl = `/login?next=${encodeURIComponent(
    location.pathname + location.search + `#discussion-${reviewId}`
  )}`;

  return (
    <section
      className={`threaded-comments-container ${compact ? "compact" : ""}`}
      style={{
        marginTop: compact ? "12px" : "24px",
        padding: compact ? "12px" : "20px",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
      }}
      aria-label={displayTitle}
      aria-busy={loading}
    >
      {/* Header Bar */}
      {!hideHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MessageCircle size={20} color="#0f766e" aria-hidden="true" />
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {displayTitle}
            </h3>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "12px",
              background: "#f1f5f9",
              color: "#475569",
            }}
          >
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            style={{
              background: "none",
              border: "none",
              color: "#b91c1c",
              textDecoration: "underline",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <p style={{ fontSize: "14px", color: "#64748b", margin: "16px 0" }}>
          Loading discussion…
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && comments.length === 0 && (
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            margin: "12px 0",
            fontStyle: "italic",
          }}
        >
          Be the first to ask a helpful question or share a factual follow-up.
        </p>
      )}

      {/* Comments List */}
      <div className="threaded-comments-feed" style={{ marginBottom: "20px" }}>
        {rootComments.map((root) => (
          <CommentItem
            key={root.id}
            comment={root}
            allComments={comments}
            currentUser={user}
            onReply={handleReply}
            onReport={onReportComment}
          />
        ))}
      </div>

      {/* Comment Form for Authenticated Users */}
      {user ? (
        <form onSubmit={handleSend} aria-busy={busy} style={{ marginTop: "16px" }}>
          {parent && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "#0f766e",
                marginBottom: "8px",
                background: "#f0fdfa",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #ccfbf1",
              }}
            >
              <CornerDownRight size={14} />
              <span>
                Replying to <strong>{replyTarget?.author || "this thread"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setParent(null)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div style={{ position: "relative" }}>
            <textarea
              id={`comment-input-${reviewId}`}
              rows={3}
              maxLength={3000}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                parent
                  ? "Write your reply..."
                  : "Ask a helpful question or share a factual follow-up..."
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                color: "#1e293b",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0f766e")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "6px",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Keep private evidence and personal identifiers out of public comments. (
              {text.length}/3000)
            </span>

            <button
              type="submit"
              disabled={busy || !text.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "6px",
                background: busy || !text.trim() ? "#94a3b8" : "#0f766e",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: busy || !text.trim() ? "not-allowed" : "pointer",
              }}
            >
              <Send size={14} />
              {busy
                ? "Sending…"
                : parent
                ? "Post reply"
                : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        <p
          style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "#64748b",
            background: "#f8fafc",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Link
            to={signInUrl}
            style={{ color: "#0f766e", fontWeight: 600, textDecoration: "none" }}
          >
            Sign in
          </Link>{" "}
          to join this discussion.
        </p>
      )}
    </section>
  );
}
