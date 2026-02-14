interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
}

export default function Sparkline({
    data,
    width = 80,
    height = 28,
    color = '#A0826D',
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="inline-block"
        >
            <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Last point dot */}
            {data.length > 0 && (
                <circle
                    cx={(data.length - 1) / (data.length - 1) * width}
                    cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
                    r="2.5"
                    fill={color}
                />
            )}
        </svg>
    );
}
