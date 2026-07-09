import { useMemo } from "react";
import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Member, Relationship } from "../types/scenario";
import { REL_COLORS } from "../lib/ui";

function buildNodes(members: Member[]): Node[] {
  const cx = 170;
  const cy = 150;
  const r = 110;
  return members.map((m, i) => {
    const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
    return {
      id: m.id,
      position: { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) },
      data: { label: `${m.emoji} ${m.name}` },
      style: {
        fontSize: 10,
        padding: "4px 6px",
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        width: "auto",
      },
    };
  });
}

function buildEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((rel, i) => ({
    id: `rel-${i}`,
    source: rel.from,
    target: rel.to,
    label: `${rel.type} ${rel.score}`,
    labelStyle: { fontSize: 9, fill: REL_COLORS[rel.type] },
    style: {
      stroke: REL_COLORS[rel.type],
      strokeWidth: Math.max(1, rel.score / 30),
      opacity: 0.8,
    },
    animated: rel.score < 30,
  }));
}

export default function RelationshipMap({
  members,
  relationships,
}: {
  members: Member[];
  relationships: Relationship[];
}) {
  const nodes = useMemo(() => buildNodes(members), [members]);
  const edges = useMemo(() => buildEdges(relationships), [relationships]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">🕸️ 人間関係マップ</h2>
      <div className="h-72">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
        </ReactFlow>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {Object.entries(REL_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>
    </section>
  );
}
