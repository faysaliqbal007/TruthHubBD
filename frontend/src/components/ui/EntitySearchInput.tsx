"use client";

import React, { useEffect, useState } from "react";

export type SearchResult = {
  id: number;
  name: string;
  category: string;
};

export function EntitySearchInput({
  onSearch,
  results,
  onSelect,
}: {
  onSearch: (q: string) => void | Promise<void>;
  results: SearchResult[];
  onSelect: (business: SearchResult) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void onSearch(inputValue);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [inputValue, onSearch]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={inputValue}
        className="review-input"
        placeholder="Search business name or category..."
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 150);
        }}
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #dbe4f0",
            borderRadius: "10px",
            boxShadow: "0 16px 38px rgba(15, 23, 42, 0.12)",
            zIndex: 30,
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {results.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
              {results.map((business) => (
                <li key={business.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setInputValue(business.name);
                      setIsOpen(false);
                      onSelect(business);
                    }}
                    style={{
                      width: "100%",
                      border: 0,
                      background: "transparent",
                      textAlign: "left",
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "block",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{business.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2 }}>
                      {business.category}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div
              style={{
                padding: "12px 14px",
                color: "#64748b",
                fontSize: "0.82rem",
              }}
            >
              No matching business found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
