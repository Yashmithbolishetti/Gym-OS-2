import React from "react";
import { 
  Building2, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Search, 
  UserCheck, 
  PhoneCall,
  AlertTriangle,
  Layers,
  ChevronRight,
  Database
} from "lucide-react";

interface AIResponseRendererProps {
  text: string;
}

export default function AIResponseRenderer({ text }: AIResponseRendererProps) {
  if (!text) return null;

  // Split text by paragraphs / block items
  const blocks = text.split(/\n\s*\n/);

  return (
    <div className="space-y-4 text-xs select-text">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. HEADERDETECTION (#, ##, ###)
        if (trimmed.startsWith("#")) {
          const depth = (trimmed.match(/^#+/) || ["#"])[0].length;
          const label = trimmed.replace(/^#+\s*/, "").replace(/\*+/g, "");
          return (
            <div key={idx} className="pt-3 pb-1 border-b border-white/5 first:pt-0">
              <h4 className={`font-semibold text-white tracking-wide flex items-center gap-1.5 ${
                depth === 1 ? "text-sm text-blue-400 font-bold" : "text-xs text-zinc-200"
              }`}>
                <Layers size={13} className="text-blue-500" />
                {label}
              </h4>
            </div>
          );
        }

        // 2. STAGE/TABLEDETECTION (starts with '|' or contains multiple '|')
        if (trimmed.includes("|") && trimmed.split("\n").length >= 2) {
          const lines = trimmed.split("\n").filter(l => l.trim().includes("|"));
          // Extrapolate header vs body rows
          const parsedRows = lines.map(line => 
            line.split("|")
              .map(cell => cell.trim().replace(/\*+/g, ""))
              .filter((cell, cidx) => {
                // Skip empty end boundaries
                if (cidx === 0 || cidx === line.split("|").length - 1) {
                  return cell !== "";
                }
                return true;
              })
          ).filter(row => row.length > 0 && !row.every(c => c.match(/^[-:\s]+$/))); // Skip markdown row separators like |--|

          if (parsedRows.length > 0) {
            const tableHeaders = parsedRows[0];
            const tableBody = parsedRows.slice(1);

            return (
              <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-white/5 bg-[#070709]/65">
                <table className="w-full text-left font-sans border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      {tableHeaders.map((hdr, hidx) => (
                        <th key={hidx} className="p-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableBody.map((row, ridx) => (
                      <tr key={ridx} className="hover:bg-white/[0.01] transition-colors">
                        {row.map((cell, cidx) => {
                          const isSuccess = cell.toLowerCase() === "active" || cell.toLowerCase() === "paid";
                          const isWarning = cell.toLowerCase() === "expiring" || cell.toLowerCase() === "expired" || cell.toLowerCase() === "churn";
                          
                          return (
                            <td key={cidx} className="p-3 text-zinc-300 antialiased">
                              {isSuccess ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/10">
                                  {cell}
                                </span>
                              ) : isWarning ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/10">
                                  {cell}
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // 3. STATSCARD/ANALYTICS BENTO GRIDS DETECTIONS
        // Check if block has formatted metrics like: "Today's Revenue: ₹15,000" or similar key-values
        if (
          trimmed.includes(":") && 
          (trimmed.includes("₹") || trimmed.includes("$") || trimmed.includes("%") || trimmed.split("\n").length >= 2) &&
          !trimmed.startsWith("-") && 
          !trimmed.startsWith("*")
        ) {
          const lines = trimmed.split("\n").map(l => l.trim()).filter(l => l.includes(":"));
          if (lines.length >= 2) {
            return (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                {lines.map((line, lidx) => {
                  const parts = line.split(":");
                  const title = parts[0].replace(/[-#*]+/g, "").trim();
                  const value = parts.slice(1).join(":").replace(/\*+/g, "").trim();
                  
                  // Render as glowing neon sub-widgets
                  return (
                    <div 
                      key={lidx} 
                      className="p-3.5 bg-gradient-to-tr from-white/[0.01] to-white/[0.03] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    >
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1.5 block">
                        {title}
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        <span className="text-sm font-semibold tracking-tight text-white font-mono">
                          {value}
                        </span>
                        {value.includes("+") || value.includes("%") ? (
                          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium flex items-center gap-0.5">
                            <TrendingUp size={10} />
                            <ArrowUpRight size={10} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
        }

        // 4. BULLETLISTS DETECTIONS
        if (trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split("\n").map(l => l.trim()).filter(l => l.length > 0);
          return (
            <div key={idx} className="space-y-1.5 my-2">
              {lines.map((line, lidx) => {
                const cleanLine = line.replace(/^[-*\d]+\.\s*/, "").replace(/\*+/g, "");
                
                // Identify warning / alarm tasks
                const isAlarm = cleanLine.toLowerCase().includes("duplicate") || cleanLine.toLowerCase().includes("missing") || cleanLine.toLowerCase().includes("invalid");
                
                return (
                  <div 
                    key={lidx} 
                    className={`flex items-start gap-2.5 p-2 bg-white/[0.01] border border-white/[0.03] rounded-xl text-xs hover:border-white/5 transition-colors ${
                      isAlarm ? "bg-amber-500/5 border-amber-500/10 text-amber-100" : "text-zinc-300"
                    }`}
                  >
                    {isAlarm ? (
                      <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={13} className="text-blue-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-tight antialiased">{cleanLine}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        // 5. DEFAULT TYPOGRAPHY PARAGRAPH
        // Replacing standard bold syntax with structured layout highlights
        const boldifiedText = trimmed.split(/(\*\*.*?\*\*)/g).map((chunk, cidx) => {
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return (
              <strong key={cidx} className="font-semibold text-white px-1.5 py-0.5 rounded bg-white/5 font-sans">
                {chunk.slice(2, -2)}
              </strong>
            );
          }
          return chunk;
        });

        return (
          <p key={idx} className="text-zinc-300 leading-relaxed font-sans text-xs antialiased">
            {boldifiedText}
          </p>
        );
      })}
    </div>
  );
}
