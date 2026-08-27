import type { PathCommand } from "../types";

export function pathCommandsToD(commands: PathCommand[]): string {
  return commands.map(command => {
    switch (command.type) {
      case "M": case "L": return `${command.type} ${command.x} ${command.y}`;
      case "H": return `H ${command.x}`;
      case "V": return `V ${command.y}`;
      case "C": return `C ${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
      case "Q": return `Q ${command.x1} ${command.y1} ${command.x} ${command.y}`;
      case "Z": return "Z";
    }
  }).join(" ");
}

export function linePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function roundedRectPath(width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (!r) return `M 0 0 H ${width} V ${height} H 0 Z`;
  return `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r} V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height} H ${r} A ${r} ${r} 0 0 1 0 ${height - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

export function orthogonalPoint(startX: number, startY: number, x: number, y: number, horizontalFirst = true) {
  return horizontalFirst ? { x, y: startY } : { x: startX, y };
}
