"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CornerDownRight, Flag, ShieldCheck } from "lucide-react";

export type Comment = {
  id: number;
  author: string;
  avatar_url?: string | null;
  body: string;
  parent_id: number | null;
  created_at: string;
  is_organization?: boolean;
  badge?: string | null;
  translations?: Record<string, any>;
};

export interface CommentItemProps {
  comment: Comment;
  allComments?: Comment[];
  isNested?: boolean;
  ancestorIds?: Set<number>;
  currentUser?: { id?: number; name?: string } | null;
  onReply?: (comment: Comment) => void;
  onReport?: (commentId: number) => void;
}

export function CommentItem({
  comment,
  allComments = [],
  isNested = false,
  ancestorIds = new Set<number>(),
  currentUser,
  onReply,
  onReport,
}: CommentItemProps) {
  const [avatarError, setAvatarError] = useState(false);

  // Prevent recursive cycles
  if (ancestorIds.has(comment.id)) return null;
  const currentPath = new Set(ancestorIds);
  currentPath.add(comment.id);

  const replies = allComments.filter((c) => c.parent_id === comment.id);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime())
        ? dateString
        : d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
    } catch {
      return dateString;
    }
  };

  const initials = comment.author ? comment.author.slice(0, 2).toUpperCase() : "U";
  const reportUrl = `/report?type=comment&id=${comment.id}`;

  return (
    <div
      className={`comment-item-block ${isNested ? "comment-nested" : ""}`}
      style={{
        marginTop: isNested ? "12px" : "16px",
        paddingLeft: isNested ? "18px" : "0",
        borderLeft: isNested ? "2px solid #e2e8f0" : "none",
      }}
    >
      <article
        className="comment-item"
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-start",
        }}
      >
        {/* User / Organization Avatar */}
        <div
          className="comment-avatar"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: comment.is_organization ? "#0f766e" : "#e0e7ff",
            color: comment.is_organization ? "#ffffff" : "#4338ca",
            fontWeight: 700,
            fontSize: "13px",
          }}
        >
          {comment.avatar_url && !avatarError ? (
            <img
              src={comment.avatar_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Comment Body & Metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <strong
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: comment.is_organization ? "#0f766e" : "#0f172a",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {comment.author}
              {comment.is_organization && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  <ShieldCheck size={12} />
                  {comment.badge || "Official Organization"}
                </span>
              )}
            </strong>

            <time
              dateTime={comment.created_at}
              style={{ fontSize: "12px", color: "#64748b" }}
            >
              {formatDate(comment.created_at)}
            </time>
          </div>

          {/* Comment Bubble */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {comment.body}
          </div>

          {/* Actions: Reply and Report */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginTop: "6px",
              fontSize: "12px",
            }}
          >
            {currentUser && onReply && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#0f766e",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CornerDownRight size={13} />
                Reply
              </button>
            )}

            {onReport ? (
              <button
                type="button"
                onClick={() => onReport(comment.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <Flag size={12} />
                Report
              </button>
            ) : (
              <Link
                to={currentUser ? reportUrl : `/login?next=${encodeURIComponent(reportUrl)}`}
                style={{
                  color: "#94a3b8",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                <Flag size={12} />
                Report
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Render Nested Replies */}
      {replies.length > 0 && (
        <div className="comment-replies" style={{ marginTop: "8px" }}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              allComments={allComments}
              isNested={true}
              ancestorIds={currentPath}
              currentUser={currentUser}
              onReply={onReply}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}
