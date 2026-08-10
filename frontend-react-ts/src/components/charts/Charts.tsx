import { FC } from "react";

export interface ChartSegment {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    segments: ChartSegment[];
    size?: number;
    thickness?: number;
    centerLabel?: string;
    centerValue?: string;
}

export const DonutChart: FC<DonutChartProps> = ({
    segments,
    size = 168,
    thickness = 20,
    centerLabel,
    centerValue,
}) => {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="block -rotate-90">
                    {total > 0 ? (
                        segments.map((seg, index) => {
                            const fraction = seg.value / total;
                            const dash = fraction * circumference;
                            const dashOffset = -offset * circumference;
                            offset += fraction;
                            return (
                                <circle
                                    key={`${seg.label}-${index}`}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={seg.color}
                                    strokeWidth={thickness}
                                    strokeDasharray={`${dash} ${circumference - dash}`}
                                    strokeDashoffset={dashOffset}
                                />
                            );
                        })
                    ) : (
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth={thickness}
                        />
                    )}
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tracking-tight">{centerValue ?? total}</span>
                    {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
                </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-1.5">
                {segments.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground">Belum ada data</p>
                )}
                {segments.map((seg, index) => {
                    const percent = total > 0 ? Math.round((seg.value / total) * 100) : 0;
                    return (
                        <div key={`legend-${seg.label}-${index}`} className="flex items-center gap-2 text-sm">
                            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                            <span className="flex-1 truncate text-muted-foreground">{seg.label}</span>
                            <span className="font-semibold">{seg.value}</span>
                            <span className="w-9 text-right text-xs text-muted-foreground">{percent}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface HorizontalBarItem {
    label: string;
    value: number;
    color?: string;
}

interface HorizontalBarProps {
    items: HorizontalBarItem[];
    formatValue?: (value: number) => string;
    emptyText?: string;
}

export const HorizontalBar: FC<HorizontalBarProps> = ({
    items,
    formatValue = (v) => String(v),
    emptyText = "Belum ada data",
}) => {
    const max = items.reduce((m, item) => Math.max(m, item.value), 0);

    return (
        <div className="space-y-3">
            {items.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">{emptyText}</p>
            )}
            {items.map((item, index) => {
                const width = max > 0 ? (item.value / max) * 100 : 0;
                const color = item.color ?? "hsl(var(--primary))";
                return (
                    <div key={`bar-${item.label}-${index}`} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
                        <span className="truncate text-sm text-muted-foreground" title={item.label}>
                            {item.label}
                        </span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.max(width, item.value > 0 ? 2 : 0)}%`,
                                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                                }}
                            />
                        </div>
                        <span className="w-12 text-right text-sm font-semibold">{formatValue(item.value)}</span>
                    </div>
                );
            })}
        </div>
    );
};