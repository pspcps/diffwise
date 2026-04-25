interface MoveArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
  animated?: boolean;
  label?: string;
}

export default function MoveArrow({ fromX, fromY, toX, toY, color = '#89b4fa', animated = true, label }: MoveArrowProps) {
  const dx = toX - fromX;

  // Cubic bezier control points — curve through the middle
  const cp1x = fromX + dx * 0.5;
  const cp1y = fromY;
  const cp2x = fromX + dx * 0.5;
  const cp2y = toY;

  const d = `M ${fromX} ${fromY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${toX} ${toY}`;

  // Arrow head direction at end point
  const arrowAngle = Math.atan2(toY - cp2y, toX - cp2x);
  const arrowLen = 10;
  const ax1 = toX - arrowLen * Math.cos(arrowAngle - 0.4);
  const ay1 = toY - arrowLen * Math.sin(arrowAngle - 0.4);
  const ax2 = toX - arrowLen * Math.cos(arrowAngle + 0.4);
  const ay2 = toY - arrowLen * Math.sin(arrowAngle + 0.4);

  return (
    <g>
      {/* Glow effect */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeOpacity={0.15}
        strokeLinecap="round"
      />

      {/* Main path */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={animated ? '8 4' : 'none'}
        style={animated ? { animation: 'dashMove 0.5s linear infinite' } : undefined}
      />

      {/* Arrowhead */}
      <polygon
        points={`${toX},${toY} ${ax1},${ay1} ${ax2},${ay2}`}
        fill={color}
      />

      {/* Source dot */}
      <circle cx={fromX} cy={fromY} r={4} fill={color} />

      {/* Label */}
      {label && (
        <g>
          <rect
            x={(fromX + toX) / 2 - label.length * 3.5}
            y={(fromY + toY) / 2 - 9}
            width={label.length * 7 + 8}
            height={18}
            rx={3}
            fill="#1e1e2e"
            stroke={color}
            strokeWidth={1}
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 + 4}
            textAnchor="middle"
            fontSize={10}
            fill={color}
            fontFamily="monospace"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
