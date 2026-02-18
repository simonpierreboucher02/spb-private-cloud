"use client";

import { useState, useEffect } from "react";
import type { PreviewPluginProps } from "./types";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function MarkdownPreview({ file }: PreviewPluginProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/files/${file.id}/preview`)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-6">
      <article className="prose prose-invert prose-sm max-w-none
        prose-headings:text-gray-200 prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-2
        prose-p:text-gray-300
        prose-a:text-blue-400
        prose-strong:text-gray-200
        prose-code:text-green-400 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10
        prose-blockquote:border-gray-600
        prose-table:border-collapse
        prose-th:border prose-th:border-white/10 prose-th:bg-white/5 prose-th:px-3 prose-th:py-2
        prose-td:border prose-td:border-white/10 prose-td:px-3 prose-td:py-2
        prose-li:text-gray-300
        prose-hr:border-white/10
        prose-img:rounded-lg
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
