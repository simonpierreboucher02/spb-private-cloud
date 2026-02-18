"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowUpDown, ChevronDown, ChevronRight, Filter } from "lucide-react";
import type { PreviewPluginProps } from "./types";

interface SortConfig {
  column: number;
  direction: "asc" | "desc";
}

export default function CsvJsonPreview({ file }: PreviewPluginProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const isJson = file.mimeType.includes("json");

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

  if (isJson) {
    return <JsonViewer content={content} />;
  }

  return <CsvViewer content={content} />;
}

// --- CSV Viewer ---

function CsvViewer({ content }: { content: string }) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filterColumn, setFilterColumn] = useState<number | null>(null);
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 100;

  const { headers, rows } = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Papa = require("papaparse");
      const result = Papa.parse(content, { header: false, skipEmptyLines: true });
      const data = result.data as string[][];
      return { headers: data[0] || [], rows: data.slice(1) };
    } catch {
      const lines = content.split("\n").filter(Boolean);
      return {
        headers: lines[0]?.split(",") || [],
        rows: lines.slice(1).map((line) => line.split(",")),
      };
    }
  }, [content]);

  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (filterColumn !== null && filterText) {
      result = result.filter((row) =>
        (row[filterColumn] || "").toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.column] || "";
        const bVal = b[sortConfig.column] || "";
        const numA = parseFloat(aVal);
        const numB = parseFloat(bVal);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return result;
  }, [rows, sortConfig, filterColumn, filterText]);

  const pageRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const toggleSort = useCallback((col: number) => {
    setSortConfig((prev) => {
      if (prev?.column === col) {
        return prev.direction === "asc" ? { column: col, direction: "desc" } : null;
      }
      return { column: col, direction: "asc" };
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-white/5 text-xs text-gray-400">
        <span>{rows.length} lignes</span>
        <span>{headers.length} colonnes</span>
        {filterText && <span>{filteredRows.length} résultats</span>}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="border border-white/10 px-2 py-1.5 text-left text-gray-500 bg-[#1a1a1a] text-xs w-10">
                #
              </th>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="border border-white/10 px-3 py-1.5 text-left text-gray-300 bg-[#1a1a1a] text-xs"
                >
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSort(i)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {header}
                      <ArrowUpDown className={`w-3 h-3 ${sortConfig?.column === i ? "text-white" : "text-gray-600"}`} />
                    </button>
                    <button
                      onClick={() => {
                        setFilterColumn(filterColumn === i ? null : i);
                        setFilterText("");
                      }}
                      className={`p-0.5 rounded transition-colors ${filterColumn === i ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                  {filterColumn === i && (
                    <input
                      type="text"
                      value={filterText}
                      onChange={(e) => { setFilterText(e.target.value); setPage(0); }}
                      placeholder="Filtrer..."
                      className="mt-1 w-full bg-white/10 border border-white/10 rounded px-2 py-0.5 text-xs text-white placeholder:text-gray-500"
                      autoFocus
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="border border-white/10 px-2 py-1 text-gray-600 text-xs">
                  {page * pageSize + i + 1}
                </td>
                {row.map((cell, j) => (
                  <td key={j} className="border border-white/10 px-3 py-1 text-gray-400 text-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-white/10 bg-white/5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30"
          >
            Précédent
          </button>
          <span className="text-xs text-gray-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white disabled:opacity-30"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

// --- JSON Viewer ---

function JsonViewer({ content }: { content: string }) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }, [content]);

  if (parsed === null) {
    return (
      <div className="overflow-auto h-full p-4">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{content}</pre>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full p-4 font-mono text-sm">
      <JsonNode value={parsed} depth={0} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JsonNode({ value, depth, keyName }: { value: any; depth: number; keyName?: string }) {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (value === null) {
    return (
      <span>
        {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-500">: </span>}
        <span className="text-gray-500">null</span>
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span>
        {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-500">: </span>}
        <span className="text-yellow-400">{value.toString()}</span>
      </span>
    );
  }

  if (typeof value === "number") {
    return (
      <span>
        {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-500">: </span>}
        <span className="text-blue-400">{value}</span>
      </span>
    );
  }

  if (typeof value === "string") {
    return (
      <span>
        {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-500">: </span>}
        <span className="text-green-400">&quot;{value}&quot;</span>
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-gray-500">: </span>}
          <span className="text-gray-400">[]</span>
        </span>
      );
    }

    return (
      <div>
        <span
          className="cursor-pointer hover:text-white text-gray-400 inline-flex items-center gap-1"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
          {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-gray-500">: </span>}
          <span>[</span>
          {collapsed && <span className="text-gray-600">{value.length} items</span>}
          {collapsed && <span>]</span>}
        </span>
        {!collapsed && (
          <div style={{ marginLeft: depth < 10 ? 16 : 0 }}>
            {value.map((item, i) => (
              <div key={i}>
                <JsonNode value={item} depth={depth + 1} />
                {i < value.length - 1 && <span className="text-gray-600">,</span>}
              </div>
            ))}
            <div className="text-gray-400">]</div>
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <span>
          {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-gray-500">: </span>}
          <span className="text-gray-400">{"{}"}</span>
        </span>
      );
    }

    return (
      <div>
        <span
          className="cursor-pointer hover:text-white text-gray-400 inline-flex items-center gap-1"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
          {keyName && <span className="text-purple-400">&quot;{keyName}&quot;</span>}
          {keyName && <span className="text-gray-500">: </span>}
          <span>{"{"}</span>
          {collapsed && <span className="text-gray-600">{keys.length} keys</span>}
          {collapsed && <span>{"}"}</span>}
        </span>
        {!collapsed && (
          <div style={{ marginLeft: depth < 10 ? 16 : 0 }}>
            {keys.map((key, i) => (
              <div key={key}>
                <JsonNode value={value[key]} depth={depth + 1} keyName={key} />
                {i < keys.length - 1 && <span className="text-gray-600">,</span>}
              </div>
            ))}
            <div className="text-gray-400">{"}"}</div>
          </div>
        )}
      </div>
    );
  }

  return <span className="text-gray-400">{String(value)}</span>;
}
