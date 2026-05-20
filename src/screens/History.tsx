import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useHabits } from "../hooks/useHabits";
import { useEntries } from "../hooks/useEntries";
import { HandIcon } from "../components/HandIcon";
import { Btn } from "../components/Btn";
import { SketchBox } from "../components/SketchBox";
import { Scribble } from "../components/Scribble";
import {
  daysAgoLocalDate,
  utcToLocalDate,
  todayLocalDate,
  localDayUtcRange,
  formatTime,
} from "../lib/dateUtils";
import { useAuthContext } from "../context/AuthContext";

const TABS = ["Día", "Semana", "Mes", "Año"];

function formatDateHeader(dateStr: string, timezone: string): string {
  const today = todayLocalDate(timezone);
  const yesterday = daysAgoLocalDate(1, timezone);
  if (dateStr === today) return "HOY";
  if (dateStr === yesterday) return "AYER";

  const d = new Date(dateStr + "T12:00:00");
  const weekday = new Intl.DateTimeFormat("es", { weekday: "long" }).format(d);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("es", { month: "short" }).format(d);
  return `${weekday} ${day} ${month}`.toUpperCase();
}

export function History() {
  const [activeTab, setActiveTab] = useState(1);
  const { timezone } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const navigate = useNavigate();
  const tabDays = [0, 6, 29, 364];
  const from = localDayUtcRange(
    daysAgoLocalDate(tabDays[activeTab], timezone),
    timezone,
  ).from;
  const { entries: recentEntries, loading: loadingRecent } = useEntries({
    from,
  });
  const { entries: heatmapEntries, loading: loadingHeatmap } = useEntries({
    from: localDayUtcRange(daysAgoLocalDate(97, timezone), timezone).from,
  });

  function habitHeatmap(habitId: string): number[] {
    const byDay: Record<string, number> = {};
    heatmapEntries
      .filter((e) => e.habit_id === habitId)
      .forEach((e) => {
        const d = utcToLocalDate(e.logged_at, timezone);
        byDay[d] = (byDay[d] ?? 0) + 1;
      });
    const vals: number[] = [];
    for (let i = 97; i >= 0; i--) {
      const d = daysAgoLocalDate(i, timezone);
      vals.push(Math.min(1, (byDay[d] ?? 0) * 0.5));
    }
    return vals;
  }

  const recent = recentEntries.slice(0, 20);

  // Group recent entries by local date
  const groupedRecent: { dateStr: string; items: typeof recent }[] = [];
  const dateMap: Record<string, typeof recent> = {};

  recent.forEach((e) => {
    const d = utcToLocalDate(e.logged_at, timezone);
    if (!dateMap[d]) {
      dateMap[d] = [];
    }
    dateMap[d].push(e);
  });

  // Sort dates descending
  Object.keys(dateMap)
    .sort((a, b) => b.localeCompare(a))
    .forEach((d) => {
      groupedRecent.push({
        dateStr: d,
        items: dateMap[d],
      });
    });

  return (
    <div className="screen">
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.38; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: "14px 18px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          className="font-display leading-none flex items-center"
          style={{ fontSize: 42, marginTop: 4 }}
        >
          Histórico{" "}
          <Scribble
            width={54}
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              marginLeft: 6,
              marginTop: -2,
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[6px]" style={{ padding: "8px 14px 12px" }}>
        {TABS.map((t, i) => (
          <Btn
            key={t}
            variant="segment"
            active={i === activeTab}
            onClick={() => setActiveTab(i)}
            className="flex-1"
            style={{ padding: "8px 0", fontSize: 15 }}
          >
            {t}
          </Btn>
        ))}
      </div>

      <div
        className="screen-scroll flex flex-col gap-[16px]"
        style={{ padding: "8px 14px 100px" }}
      >
        {/* Per-habit heatmap rows */}
        <div>
          <div
            className="font-hand text-ink-soft"
            style={{
              fontSize: 12,
              letterSpacing: 0.6,
              padding: "4px 4px 6px",
              textTransform: "uppercase",
            }}
          >
            Calor por Hábito · 4 semanas
          </div>
          {loadingHabits || loadingHeatmap ? (
            <div className="flex flex-col gap-[10px]">
              <HeatmapRowSkeleton />
              <HeatmapRowSkeleton />
              <HeatmapRowSkeleton />
            </div>
          ) : habits.length === 0 ? (
            <SketchBox
              padding={16}
              radius={14}
              dashed
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div className="font-hand text-ink-soft" style={{ fontSize: 15 }}>
                Sin hábitos activos
              </div>
            </SketchBox>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {habits.map((h) => {
                const cells = habitHeatmap(h.id).slice(-28); // 4 weeks
                const habitEntries = heatmapEntries.filter(
                  (e) => e.habit_id === h.id,
                );
                const totalLogs = habitEntries.length;
                const totalPoints = habitEntries.reduce(
                  (sum, e) => sum + e.points,
                  0,
                );

                return (
                  <SketchBox
                    key={h.id}
                    onClick={() => navigate(`/habits/${h.id}/history`)}
                    padding={12}
                    radius={14}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <HandIcon kind={h.icon} size={20} />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                        }}
                      >
                        <span
                          className="font-hand overflow-hidden text-ellipsis whitespace-nowrap"
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "var(--ink)",
                          }}
                        >
                          {h.name}
                        </span>
                        <span
                          className="font-hand text-ink-soft"
                          style={{ fontSize: 12, marginTop: 1 }}
                        >
                          {totalLogs}{" "}
                          {totalLogs === 1 ? "registro" : "registros"} · +
                          {totalPoints} pts
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        className="grid gap-[3px]"
                        style={{
                          gridAutoFlow: "column",
                          gridTemplateRows: "repeat(2, 9px)",
                          gridAutoColumns: "9px",
                        }}
                      >
                        {cells.map((v, i) => (
                          <div
                            key={i}
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: 1.5,
                              border: "0.75px solid var(--ink)",
                              background:
                                v <= 0
                                  ? "transparent"
                                  : `rgba(42,42,42,${0.15 + v * 0.7})`,
                            }}
                          />
                        ))}
                      </div>
                      <CaretRightIcon size={14} className="text-ink-soft" />
                    </div>
                  </SketchBox>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div>
          <div
            className="font-hand text-ink-soft"
            style={{
              fontSize: 12,
              letterSpacing: 0.6,
              padding: "4px 4px 6px",
              textTransform: "uppercase",
            }}
          >
            RECIENTES
          </div>
          {loadingRecent ? (
            <RecentLogsSkeleton />
          ) : groupedRecent.length === 0 ? (
            <SketchBox
              padding={16}
              radius={14}
              dashed
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div className="font-hand text-ink-soft" style={{ fontSize: 15 }}>
                Sin registros en este período
              </div>
            </SketchBox>
          ) : (
            <SketchBox padding={14} radius={14}>
              <div className="flex flex-col gap-[14px]">
                {groupedRecent.map(({ dateStr, items }, groupIdx) => (
                  <div
                    key={dateStr}
                    style={{
                      borderBottom:
                        groupIdx === groupedRecent.length - 1
                          ? "none"
                          : "1.6px dashed var(--ink-soft)",
                      paddingBottom:
                        groupIdx === groupedRecent.length - 1 ? 0 : 12,
                    }}
                  >
                    <div
                      className="font-hand text-ink-soft"
                      style={{
                        fontSize: 12,
                        letterSpacing: 0.5,
                        marginBottom: 6,
                        fontWeight: "bold",
                      }}
                    >
                      {formatDateHeader(dateStr, timezone)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {items.map((e, itemIdx) => {
                        const resolvedIcon =
                          e.habit_icon ??
                          habits.find((h) => h.id === e.habit_id)?.icon;
                        return (
                          <div
                            key={e.id}
                            className="flex justify-between items-center font-hand"
                            style={{
                              fontSize: 16,
                              padding: "6px 0",
                              borderBottom:
                                itemIdx === items.length - 1
                                  ? "none"
                                  : "1px dashed var(--ink-soft)",
                              opacity: 0.9,
                            }}
                          >
                            <div className="flex items-center gap-[8px] flex-1 min-w-0">
                              {resolvedIcon && (
                                <HandIcon kind={resolvedIcon} size={16} />
                              )}
                              <span
                                className="text-ink-soft"
                                style={{
                                  fontSize: 13,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {formatTime(e.logged_at, timezone)}
                              </span>
                              <span
                                className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-ink"
                                style={{ marginLeft: 6 }}
                              >
                                {e.habit_name ?? "Hábito"}
                                {e.value > 1 ? ` +${e.value}` : ""}
                              </span>
                            </div>
                            <span
                              className="font-display text-coral"
                              style={{ fontSize: 18, fontWeight: "bold" }}
                            >
                              +{e.points} XP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SketchBox>
          )}
        </div>
      </div>
    </div>
  );
}

function HeatmapRowSkeleton() {
  return (
    <SketchBox
      padding={12}
      radius={14}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Fake HandIcon */}
        <div
          className="skeleton-pulse"
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "rgba(42, 42, 42, 0.12)",
          }}
        />
        {/* Fake text lines */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            className="skeleton-pulse"
            style={{
              height: 16,
              width: "60%",
              backgroundColor: "rgba(42, 42, 42, 0.12)",
              borderRadius: 4,
            }}
          />
          <div
            className="skeleton-pulse"
            style={{
              height: 12,
              width: "40%",
              backgroundColor: "rgba(42, 42, 42, 0.06)",
              borderRadius: 3,
              marginTop: 4,
            }}
          />
        </div>
      </div>

      {/* Fake Heatmap grid */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        <div
          className="grid gap-[3px] skeleton-pulse"
          style={{
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(2, 9px)",
            gridAutoColumns: "9px",
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 1.5,
                border: "0.75px solid rgba(42, 42, 42, 0.25)",
                background: "transparent",
              }}
            />
          ))}
        </div>
        <CaretRightIcon
          size={14}
          className="text-ink-soft"
          style={{ opacity: 0.3 }}
        />
      </div>
    </SketchBox>
  );
}

function RecentLogsSkeleton() {
  return (
    <SketchBox padding={14} radius={14}>
      <div className="flex flex-col gap-[14px]">
        {/* Simulate 2 group dates */}
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div
            key={groupIdx}
            style={{
              borderBottom:
                groupIdx === 1 ? "none" : "1.6px dashed var(--ink-soft)",
              paddingBottom: groupIdx === 1 ? 0 : 12,
            }}
          >
            {/* Fake date header */}
            <div
              className="skeleton-pulse"
              style={{
                height: 12,
                width: "25%",
                backgroundColor: "rgba(42, 42, 42, 0.08)",
                borderRadius: 3,
                marginBottom: 10,
              }}
            />
            {/* Fake list items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Array.from({ length: groupIdx === 0 ? 3 : 2 }).map(
                (_, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex justify-between items-center"
                    style={{
                      padding: "6px 0",
                      borderBottom:
                        itemIdx === (groupIdx === 0 ? 2 : 1)
                          ? "none"
                          : "1px dashed var(--ink-soft)",
                    }}
                  >
                    <div className="flex items-center gap-[8px] flex-1 min-w-0">
                      {/* Fake icon */}
                      <div
                        className="skeleton-pulse"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: "rgba(42, 42, 42, 0.12)",
                        }}
                      />
                      {/* Fake time */}
                      <div
                        className="skeleton-pulse"
                        style={{
                          height: 12,
                          width: 35,
                          backgroundColor: "rgba(42, 42, 42, 0.06)",
                          borderRadius: 2,
                        }}
                      />
                      {/* Fake habit name */}
                      <div
                        className="skeleton-pulse"
                        style={{
                          height: 14,
                          width: "45%",
                          backgroundColor: "rgba(42, 42, 42, 0.12)",
                          borderRadius: 3,
                          marginLeft: 6,
                        }}
                      />
                    </div>
                    {/* Fake XP */}
                    <div
                      className="skeleton-pulse"
                      style={{
                        height: 16,
                        width: 45,
                        backgroundColor: "rgba(235, 94, 85, 0.12)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </SketchBox>
  );
}
