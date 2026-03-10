import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Node {
  slug: string;
  title: string;
  x?: number;
  y?: number;
}

interface Edge {
  source_slug: string;
  target_slug: string;
  is_embed: number;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
  currentSlug?: string;
}

export default function GraphView({ nodes, edges, currentSlug }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let displayNodes = nodes;
    let displayEdges = edges;

    if (currentSlug) {
      const connectedSlugs = new Set<string>([currentSlug]);
      edges.forEach((e) => {
        if (e.source_slug === currentSlug) connectedSlugs.add(e.target_slug);
        if (e.target_slug === currentSlug) connectedSlugs.add(e.source_slug);
      });
      displayNodes = nodes.filter((n) => connectedSlugs.has(n.slug));
      displayEdges = edges.filter(
        (e) =>
          connectedSlugs.has(e.source_slug) && connectedSlugs.has(e.target_slug),
      );
    }

    if (!svgRef.current || displayNodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);

    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    const localSlugIndex = new Map(displayNodes.map((n, i) => [n.slug, i]));

    const connCount = new Map<string, number>();
    displayEdges.forEach((e) => {
      connCount.set(e.source_slug, (connCount.get(e.source_slug) || 0) + 1);
      connCount.set(e.target_slug, (connCount.get(e.target_slug) || 0) + 1);
    });

    const links = displayEdges
      .filter(
        (e) =>
          localSlugIndex.has(e.source_slug) && localSlugIndex.has(e.target_slug),
      )
      .map((e) => ({
        source: localSlugIndex.get(e.source_slug)!,
        target: localSlugIndex.get(e.target_slug)!,
        is_embed: e.is_embed,
      }));

    const simulation = d3
      .forceSimulation(displayNodes as any)
      .force(
        "link",
        d3.forceLink(links).distance(90).strength(0.5),
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(18));

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#1a1a1a")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", (d) => (d.is_embed ? "4 4" : "none"))
      .attr("stroke-opacity", 0.6);

    const node = g
      .append("g")
      .selectAll("g")
      .data(displayNodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        window.location.href = `/notes/${d.slug}`;
      })
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      );

    node
      .append("circle")
      .attr("r", (d) => {
        const c = connCount.get(d.slug) || 0;
        return 4 + Math.min(c * 1.5, 10);
      })
      .attr("fill", (d) =>
        d.slug === currentSlug ? "#FFD000" : "#1e1e1e",
      )
      .attr("stroke", (d) => (d.slug === currentSlug ? "none" : "#333"))
      .attr("stroke-width", 1)
      .attr("filter", (d) =>
        d.slug === currentSlug ? "url(#glow)" : "none",
      )
      .style("transition", "fill 0.15s, r 0.15s");

    const label = node
      .append("text")
      .text((d) => d.title)
      .attr("x", 10)
      .attr("y", 3)
      .attr("font-size", "9px")
      .attr("font-family", "Commit Mono, monospace")
      .attr("fill", "#787878")
      .attr("opacity", (d) => {
        if (d.slug === currentSlug) return 1;
        const c = connCount.get(d.slug) || 0;
        return c >= 3 ? 0.7 : 0;
      })
      .attr("pointer-events", "none");

    node
      .on("mouseenter", function (_event, d) {
        const slug = d.slug;
        const connected = new Set<string>([slug]);
        displayEdges.forEach((e) => {
          if (e.source_slug === slug) connected.add(e.target_slug);
          if (e.target_slug === slug) connected.add(e.source_slug);
        });

        node.select("circle").attr("fill", (n: any) => {
          if (n.slug === slug) return "#FFD000";
          return connected.has(n.slug) ? "#333" : "#1e1e1e";
        });

        node
          .select("circle")
          .attr("fill-opacity", (n: any) =>
            connected.has(n.slug) ? 1 : 0.15,
          );

        link.attr("stroke-opacity", (l: any) => {
          const s =
            displayNodes[
              typeof l.source === "object" ? l.source.index : l.source
            ]?.slug;
          const t =
            displayNodes[
              typeof l.target === "object" ? l.target.index : l.target
            ]?.slug;
          return connected.has(s!) && connected.has(t!) ? 0.6 : 0.05;
        });

        d3.select(this).select("text").attr("opacity", 1);
        d3.select(this)
          .select("circle")
          .attr("filter", "url(#glow)");

        node
          .filter((n: any) => connected.has(n.slug) && n.slug !== slug)
          .select("text")
          .attr("opacity", 0.6);
      })
      .on("mouseleave", function () {
        node.select("circle").attr("fill", (d: any) =>
          d.slug === currentSlug ? "#FFD000" : "#1e1e1e",
        );
        node.select("circle").attr("fill-opacity", 1);
        node
          .select("circle")
          .attr("filter", (d: any) =>
            d.slug === currentSlug ? "url(#glow)" : "none",
          );
        link.attr("stroke-opacity", 0.6);
        label.attr("opacity", (d: any) => {
          if (d.slug === currentSlug) return 1;
          const c = connCount.get(d.slug) || 0;
          return c >= 3 ? 0.7 : 0;
        });
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoomIn = document.getElementById("graph-zoom-in");
    const zoomOut = document.getElementById("graph-zoom-out");
    const resetBtn = document.getElementById("graph-reset");
    zoomIn?.addEventListener("click", () =>
      svg.transition().duration(300).call(zoom.scaleBy, 1.3),
    );
    zoomOut?.addEventListener("click", () =>
      svg.transition().duration(300).call(zoom.scaleBy, 0.7),
    );
    resetBtn?.addEventListener("click", () =>
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity),
    );

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, currentSlug]);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  );
}
