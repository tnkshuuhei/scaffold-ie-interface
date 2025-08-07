import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";

export const FlowVisualization = ({
  recipients,
  rootSplits,
  totalBalance,
  allocations,
}: {
  recipients: string[];
  rootSplits: string;
  totalBalance: string;
  allocations: number[];
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredFlow, setHoveredFlow] = useState<number | null>(null);

  const colors = [
    { start: "#ec4899", end: "#be185d" }, // pink
    { start: "#3b82f6", end: "#1d4ed8" }, // blue
    { start: "#10b981", end: "#047857" }, // green
    { start: "#f59e0b", end: "#d97706" }, // yellow
    { start: "#8b5cf6", end: "#6d28d9" }, // purple
    { start: "#ef4444", end: "#dc2626" }, // red
  ];

  useEffect(() => {
    if (!svgRef.current || recipients.length === 0 || allocations.length === 0)
      return;

    // Validate that recipients and allocations arrays have same length
    if (recipients.length !== allocations.length) {
      console.error(
        "Recipients and allocations arrays must have the same length"
      );
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 350;
    const sourceX = 50;
    const targetX = width - 50;
    const centerY = height / 2;

    // Setup gradients
    const defs = svg.append("defs");

    recipients.forEach((_, index) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `flow-gradient-${index}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

      const color = colors[index % colors.length];
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color.start)
        .attr("stop-opacity", "0.7");

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color.end)
        .attr("stop-opacity", "0.9");
    });

    // Calculate flow positions and data
    const flows = recipients.map((recipient, index) => {
      const allocation = allocations[index];
      const totalAllocation = allocations.reduce(
        (sum, alloc) => sum + alloc,
        0
      );
      const percentage =
        totalAllocation > 0 ? (allocation / totalAllocation) * 100 : 0;
      const flowHeight = Math.max((percentage * 120) / 100, 8); // Scale to viewport, min height for visibility
      const targetY =
        40 + (index * (height - 80)) / Math.max(recipients.length - 1, 1);

      return {
        recipient,
        index,
        allocation,
        percentage,
        flowHeight,
        sourceY: centerY,
        targetY,
        color: colors[index % colors.length],
      };
    });

    // Add source endpoint
    svg
      .append("circle")
      .attr("cx", sourceX)
      .attr("cy", centerY)
      .attr("r", 8)
      .attr("fill", "#ffffff")
      .attr("stroke", "#374151")
      .attr("stroke-width", 2);

    // Draw flows
    flows.forEach((flow, index) => {
      const pathData = [];
      const steps = 50;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = sourceX + (targetX - sourceX) * t;

        // Create smooth transition from center to target position
        const easedT = d3.easeCubicInOut(t);
        const y = flow.sourceY + (flow.targetY - flow.sourceY) * easedT;

        // Calculate width based on flow allocation
        const width = flow.flowHeight * (1 - Math.abs(2 * t - 1) * 0.3); // Slight narrowing in middle

        pathData.push({
          x,
          y: y - width / 2,
          y2: y + width / 2,
        });
      }

      // Create the flow area
      const area = d3
        .area<{ x: number; y: number; y2: number }>()
        .x((d) => d.x)
        .y0((d) => d.y)
        .y1((d) => d.y2)
        .curve(d3.curveBasis);

      const flowGroup = svg
        .append("g")
        .attr("class", `flow-${index}`)
        .style("cursor", "pointer");

      // Add the flow path
      flowGroup
        .append("path")
        .datum(pathData)
        .attr("d", area)
        .attr("fill", `url(#flow-gradient-${index})`)
        .attr("opacity", hoveredFlow === index ? 1 : 0.8)
        .style("transition", "all 0.3s ease")
        .on("mouseenter", function () {
          setHoveredFlow(index);
          d3.select(this).transition().duration(200).attr("opacity", 1);
        })
        .on("mouseleave", function () {
          setHoveredFlow(null);
          d3.select(this).transition().duration(200).attr("opacity", 0.8);
        });

      // Add recipient endpoint
      flowGroup
        .append("circle")
        .attr("cx", targetX)
        .attr("cy", flow.targetY)
        .attr("r", 6)
        .attr("fill", flow.color.end)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2)
        .attr("opacity", hoveredFlow === index ? 1 : 0.9)
        .style("transition", "all 0.3s ease");

      // Add flow allocation label
      flowGroup
        .append("text")
        .attr("x", (sourceX + targetX) / 2)
        .attr("y", flow.targetY - 5)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12")
        .attr("font-weight", "bold")
        .style("pointer-events", "none")
        .style("opacity", hoveredFlow === index ? 1 : 0)
        .text(`${flow.percentage.toFixed(1)}%`);
    });

    // Add animated particles along the flows
    const addParticles = () => {
      flows.forEach((flow) => {
        if (Math.random() > 0.7) {
          // Random chance to spawn particle
          const particle = svg
            .append("circle")
            .attr("r", 2)
            .attr("fill", flow.color.end)
            .attr("opacity", 0.8)
            .attr("cx", sourceX)
            .attr("cy", flow.sourceY);

          particle
            .transition()
            .duration(2000 + Math.random() * 1000)
            .ease(d3.easeCubicInOut)
            .attr("cx", targetX)
            .attr("cy", flow.targetY)
            .attr("opacity", 0)
            .remove();
        }
      });
    };

    // Start particle animation
    const particleInterval = setInterval(addParticles, 500);

    return () => {
      clearInterval(particleInterval);
    };
  }, [recipients, allocations, totalBalance, hoveredFlow]);

  return (
    <div className="relative h-96 flex items-center">
      {/* Source */}
      <div className="flex-shrink-0 w-32">
        <div className="bg-gray-700 rounded-lg p-4 text-center shadow-lg">
          <div className="text-2xl font-bold text-white">
            {totalBalance} ETH
          </div>
          <div className="text-gray-300 text-sm">Total</div>
          <Link
            href={`https://app.splits.org/accounts/${rootSplits}/?chainId=11155111`}
            target="_blank"
            className="hover:underline text-gray-300"
          >
            {rootSplits.slice(0, 6)}...{rootSplits.slice(-4)}
          </Link>
        </div>
      </div>

      {/* D3.js Flow paths */}
      <div className="flex-1 relative mx-8">
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 500 350"
          style={{ overflow: "visible" }}
        />
      </div>

      {/* Recipients */}
      <div className="flex-shrink-0 w-64 space-y-3">
        {recipients.map((recipient, index) => {
          const allocation = allocations[index];
          const totalAllocation = allocations.reduce(
            (sum, alloc) => sum + alloc,
            0
          );
          const percentage =
            totalAllocation > 0 ? (allocation / totalAllocation) * 100 : 0;

          return (
            <div
              key={index}
              className={`bg-gray-800 rounded-lg p-3 flex items-center justify-between transition-all duration-300 ${
                hoveredFlow === index
                  ? "bg-gray-700 shadow-lg transform scale-105"
                  : ""
              }`}
              onMouseEnter={() => setHoveredFlow(index)}
              onMouseLeave={() => setHoveredFlow(null)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: `linear-gradient(45deg, ${
                      colors[index % colors.length].start
                    }, ${colors[index % colors.length].end})`,
                  }}
                ></div>
                <div>
                  <div className="text-white text-sm font-medium">
                    <Link
                      href={`https://app.splits.org/accounts/${recipient}/?chainId=11155111`}
                      target="_blank"
                      className="hover:underline text-gray-300"
                    >
                      {recipient.slice(0, 6)}...{recipient.slice(-4)}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-white font-bold">
                {percentage.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
