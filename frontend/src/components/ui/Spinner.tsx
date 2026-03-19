import "./Spinner.css";

interface SpinnerProps {
    size: number;
    color?: string;
};

function Spinner({ size, color = "currentColor" }: SpinnerProps) {
    const strokeWidth = size / 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference * 0.25; // Quart de cercle

    return (
        <svg
            className="spinner"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ display: "block", margin: "0 auto" }}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
            />
        </svg>
    );
};

export default Spinner;