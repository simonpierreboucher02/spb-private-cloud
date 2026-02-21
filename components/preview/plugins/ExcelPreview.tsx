"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Download, Table2, ArrowUpDown, Save, Edit3 } from "lucide-react";
import type { PreviewPluginProps } from "./types";

// Column index → Excel-style letter (0 → A, 25 → Z, 26 → AA …)
function colLetter(n: number): string {
  let result = "";
  let idx = n;
  do {
    result = String.fromCharCode(65 + (idx % 26)) + result;
    idx = Math.floor(idx / 26) - 1;
  } while (idx >= 0);
  return result;
}

interface SheetData {
  name: string;
  rows: (string | number | boolean | null)[][];
  colCount: number;
}

interface SortConfig {
  col: number;
  dir: "asc" | "desc";
}

const PAGE_SIZE = 100;

export default function ExcelPreview({ file, isEditing, onSave }: PreviewPluginProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  // editData mirrors sheets data for in-memory editing
  const [editData, setEditData] = useState<(string | number | null)[][][]>([]);

  useEffect(() => {
    let cancelled = false;

    const parse = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/files/${file.id}/download`);
        if (!res.ok) throw new Error("Download failed");
        const arrayBuffer = await res.arrayBuffer();

        const XLSX = await import("xlsx");
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: true });

        const parsed: SheetData[] = workbook.SheetNames.map((name) => {
          const ws = workbook.Sheets[name];
          const raw = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(ws, {
            header: 1,
            defval: null,
            blankrows: true,
          });
          const colCount = raw.reduce((max, row) => Math.max(max, row.length), 0);
          return { name, rows: raw as (string | number | boolean | null)[][], colCount };
        });

        if (!cancelled) {
          setSheets(parsed);
          setActiveSheet(0);
          // Init edit data as string copies
          setEditData(parsed.map((s) => s.rows.map((row) => row.map((c) => (c === null ? null : String(c))))));
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    parse();
    return () => { cancelled = true; };
  }, [file.id]);

  const handleCellChange = useCallback((sheetIdx: number, rowIdx: number, colIdx: number, value: string) => {
    setEditData((prev) => {
      const next = prev.map((s) => s.map((r) => [...r]));
      // Ensure nested arrays exist
      while (next[sheetIdx].length <= rowIdx) next[sheetIdx].push([]);
      while (next[sheetIdx][rowIdx].length <= colIdx) next[sheetIdx][rowIdx].push(null);
      next[sheetIdx][rowIdx][colIdx] = value;
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      editData.forEach((sheetRows, si) => {
        const ws = XLSX.utils.aoa_to_sheet(sheetRows.map((row) =>
          row.map((c) => {
            if (c === null || c === "") return null;
            const num = Number(c);
            return isNaN(num) ? c : num;
          })
        ));
        XLSX.utils.book_append_sheet(wb, ws, sheets[si]?.name || `Sheet${si + 1}`);
      });
      const array = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      await onSave(blob, true);
    } finally {
      setSaving(false);
    }
  }, [editData, sheets, onSave]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#217346]" />
        <p className="text-sm text-gray-500">Chargement du classeur Excel…</p>
      </div>
    );
  }

  if (error || sheets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8 bg-white">
        <Table2 className="w-16 h-16 text-[#217346] opacity-50" />
        <p className="text-sm text-center text-gray-500">Impossible d&apos;afficher ce fichier Excel.</p>
        <button
          onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
          className="flex items-center gap-2 px-4 py-2 bg-[#217346] hover:bg-[#1a5c38] rounded text-sm text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger
        </button>
      </div>
    );
  }

  const currentSheet = sheets[activeSheet];
  const currentEditRows = editData[activeSheet] ?? currentSheet.rows.map((r) => r.map((c) => (c === null ? null : String(c))));

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f2f2f2] border-b border-[#d0d7de] shrink-0">
        <span className="text-xs text-gray-500 font-medium">{file.name}</span>
        <div className="flex-1" />
        {isEditing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#217346] hover:bg-[#1a5c38] text-white rounded transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5" />
            Mode lecture
          </span>
        )}
        <button
          onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-[#217346] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sheet tabs — Excel style */}
      <div className="flex items-end gap-px px-2 pt-1 bg-[#f2f2f2] border-b border-[#d0d7de] overflow-x-auto shrink-0">
        {sheets.map((sheet, i) => (
          <button
            key={sheet.name}
            onClick={() => setActiveSheet(i)}
            className={`px-4 py-1.5 text-xs rounded-t transition-colors whitespace-nowrap border border-b-0 ${
              i === activeSheet
                ? "bg-[#217346] text-white border-[#217346]"
                : "bg-[#e0e0e0] text-gray-600 border-[#c0c0c0] hover:bg-[#d0d0d0]"
            }`}
          >
            {sheet.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            {currentSheet.rows.length} lignes · {currentSheet.colCount} col.
          </span>
        </div>
      </div>

      {/* Sheet viewer */}
      <SheetViewer
        sheet={currentSheet}
        editRows={currentEditRows}
        sheetIdx={activeSheet}
        isEditing={isEditing}
        onCellChange={handleCellChange}
        key={activeSheet}
      />
    </div>
  );
}

function SheetViewer({
  sheet,
  editRows,
  sheetIdx,
  isEditing,
  onCellChange,
}: {
  sheet: SheetData;
  editRows: (string | number | null)[][];
  sheetIdx: number;
  isEditing: boolean;
  onCellChange: (si: number, ri: number, ci: number, v: string) => void;
}) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [page, setPage] = useState(0);

  const headerRow = editRows[0] ?? [];
  const dataRows = editRows.slice(1);
  const colCount = sheet.colCount;

  const sortedRows = useMemo(() => {
    if (!sortConfig || isEditing) return dataRows;
    return [...dataRows].sort((a, b) => {
      const aVal = a[sortConfig.col] ?? "";
      const bVal = b[sortConfig.col] ?? "";
      const numA = parseFloat(String(aVal));
      const numB = parseFloat(String(bVal));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.dir === "asc" ? numA - numB : numB - numA;
      }
      return sortConfig.dir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [dataRows, sortConfig, isEditing]);

  const pageRows = sortedRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sortedRows.length / PAGE_SIZE);

  const toggleSort = useCallback((col: number) => {
    if (isEditing) return;
    setSortConfig((prev) => {
      if (prev?.col === col) return prev.dir === "asc" ? { col, dir: "desc" } : null;
      return { col, dir: "asc" };
    });
    setPage(0);
  }, [isEditing]);

  const formatCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    return String(val);
  };

  const isNumeric = (val: string | number | null | undefined): boolean =>
    typeof val === "number" || (!isNaN(parseFloat(String(val))) && val !== null && val !== "");

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse min-w-max">
          {/* Column letter row */}
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Row number gutter header */}
              <th className="w-10 min-w-[2.5rem] border border-[#d0d7de] px-2 py-1 bg-[#f2f2f2] text-gray-500 font-normal select-none" />
              {Array.from({ length: colCount }, (_, i) => (
                <th
                  key={i}
                  className="border border-[#d0d7de] px-1 py-1 bg-[#f2f2f2] text-gray-500 font-normal text-center min-w-[80px]"
                >
                  {colLetter(i)}
                </th>
              ))}
            </tr>

            {/* Header data row */}
            <tr>
              <td className="border border-[#d0d7de] px-2 py-1 bg-[#f2f2f2] text-gray-400 text-center font-normal select-none">
                1
              </td>
              {Array.from({ length: colCount }, (_, i) => {
                const val = headerRow[i] ?? null;
                const sorted = sortConfig?.col === i;
                return (
                  <th
                    key={i}
                    className="border border-[#d0d7de] bg-[#f2f2f2] text-gray-700 font-semibold text-left p-0"
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={formatCell(val)}
                        onChange={(e) => onCellChange(sheetIdx, 0, i, e.target.value)}
                        className="w-full px-2 py-1 bg-white border-0 outline-none focus:ring-2 focus:ring-[#217346] focus:ring-inset text-gray-900 font-semibold"
                      />
                    ) : (
                      <button
                        onClick={() => toggleSort(i)}
                        className="flex items-center gap-1 w-full px-2 py-1 hover:bg-[#e8f0e8] transition-colors"
                      >
                        <span className="truncate max-w-[120px]">{formatCell(val)}</span>
                        <ArrowUpDown className={`w-3 h-3 shrink-0 ${sorted ? "text-[#217346]" : "text-gray-400"}`} />
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, rowIdx) => {
              const actualRowIdx = page * PAGE_SIZE + rowIdx + 1; // 0-based in editRows (1 = first data row)
              return (
                <tr
                  key={rowIdx}
                  className={rowIdx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}
                >
                  {/* Row number */}
                  <td className="border border-[#e0e0e0] px-2 py-0.5 text-gray-400 text-center bg-[#f2f2f2] select-none">
                    {actualRowIdx + 1}
                  </td>
                  {Array.from({ length: colCount }, (_, colIdx) => {
                    const val = row[colIdx] ?? null;
                    const numeric = isNumeric(val);
                    return (
                      <td
                        key={colIdx}
                        className={`border border-[#e0e0e0] p-0 ${!isEditing && numeric ? "text-right" : ""}`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={formatCell(val)}
                            onChange={(e) => onCellChange(sheetIdx, actualRowIdx, colIdx, e.target.value)}
                            className="w-full min-w-[80px] px-2 py-0.5 bg-transparent border-0 outline-none focus:ring-2 focus:ring-[#217346] focus:ring-inset text-gray-900"
                          />
                        ) : (
                          <span className={`block px-2 py-0.5 ${numeric ? "text-[#1155cc] text-right" : "text-gray-800"}`}>
                            {formatCell(val)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={colCount + 1} className="border border-[#e0e0e0] px-4 py-8 text-center text-gray-400">
                  Feuille vide
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#d0d7de] bg-[#f2f2f2] shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-xs text-gray-500 hover:text-[#217346] disabled:opacity-30 transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-xs text-gray-500">
            Lignes {page * PAGE_SIZE + 2}–{Math.min((page + 1) * PAGE_SIZE + 1, sortedRows.length + 1)} sur {sortedRows.length + 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-xs text-gray-500 hover:text-[#217346] disabled:opacity-30 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
