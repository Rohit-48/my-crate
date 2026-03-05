import { useEffect } from "react";
import { useRef } from "react";
import * as d3 from "d3";


interface Node{
  slug: string,
  title:string,
  x?:number,
  y?:number,
}

interface Edge{
  source_slug: string;
  target_slug: string,
  is_embed: number;
}

interface Props{
  nodes:Node[];
  edges: Edge[];
}

export default function GraphView({nodes, edges}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() =>{
    if(!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove(); //free prev render
    

    const svg = d3.select(svgRef.current);

    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    const slugIndex = new Map(nodes.map((n, i) => [n.slug, i]));

    const links = edges
      .filter((e) => slugIndex.has(e.source_slug) && slugIndex.has(e.target_slug))
      .map((e)=>({
        source: slugIndex.get(e.source_slug)!,
        target: slugIndex.get(e.target_slug)!,
        is_embed: e.is_embed,
      }));

      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height /2))
        .force("collision", d3.forceCollide(30));

      const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", (d) => d.is_embed ? "#92400e" : "#404040")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", (d) => d.is_embed ? "4,2" : "none");

      
        const node = g.append("g")
          .selectAll("g")
          .data(nodes)
          .join("g")
          .style("cursor", "pointer")
          .on("click", (_, d) => window.location.href = `/notes/${d.slug}`)
          .call(
            d3.drag<SVGGElement, Node>()
              .on("start", (event, d: any) => {
                if(!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
              })
              .on("drag", (event,d:any) => {d.fx = event.x; d.fy = event.y;})
              .on("end", (event, d:any) =>{
                if(!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
              }) as any
          );

          node.append("circle")
            .attr("r", 6)
            .attr("fill", "#d97706")
            .attr("stroke",  "#451a03")
            .attr("stroke-width", 1.5);
          
          node.append("text")
            .text((d) => d.title)
            .attr("x", 10)
            .attr("y", 4)
            .attr("font-size", "12px")
            .attr("fill", "#a3a3a3");

          simulation.on("tick", () => {
            link
              .attr("x1", (d: any) => d.source.x)
              .attr("y1", (d: any) => d.source.y)
              .attr("x2", (d: any) => d.target.x)
              .attr("y2", (d: any) => d.target.y);

            node.attr("transform", (d:any) => `translate(${d.x},${d.y})`);
          });

          return () => {
            simulation.stop();
          };
        }, [nodes, edges]);

        return (
          <svg 
            ref={svgRef}
            className="w-full h-full"
            style={{ background: "transparent" }}

         />
        );
}