import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  FireSimpleIcon,
} from "@phosphor-icons/react";
import { useHabits } from "../hooks/useHabits";
import { useEntries } from "../hooks/useEntries";
import { Scribble } from "../components/Scribble";
import { SketchBox } from "../components/SketchBox";
import { Btn } from "../components/Btn";
import { todayLocalDate, utcToLocalDate, addDays } from "../lib/dateUtils";
import { useAuthContext } from "../context/AuthContext";
import { type Habit } from "../api/client";

function getLocalDateString(y: number, m: number, d: number): string {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_NAMES_SHORT = ["D", "L", "M", "X", "J", "V", "S"]; // Sunday to Saturday

export function HabitStatistics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { timezone } = useAuthContext();
  const { habits } = useHabits();

  const habit = useMemo(() => habits.find((h) => h.id === id), [habits, id]);

  // Fetch all entries for this habit
  const { entries, loading } = useEntries({ habitId: id });

  // Current month displayed in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Helper to determine if a day is active based on the frequency config
  const isDayActive = (dateStr: string, currentHabit: Habit): boolean => {
    if (currentHabit.frequency_type === "daily") return true;

    // Parse the date in local timezone
    const date = new Date(`${dateStr}T12:00:00`);

    if (currentHabit.frequency_type === "weekly") {
      const dayNames = ["D", "L", "M", "X", "J", "V", "S"];
      const jsDay = date.getDay();
      const targetChar = dayNames[jsDay];
      try {
        const cfg = JSON.parse(currentHabit.frequency_config) as {
          days?: string[];
        };
        return cfg.days?.includes(targetChar) ?? true;
      } catch {
        return true;
      }
    }

    if (currentHabit.frequency_type === "monthly") {
      const dayOfMonth = date.getDate();
      try {
        const cfg = JSON.parse(currentHabit.frequency_config) as {
          days?: number[];
        };
        return cfg.days?.includes(dayOfMonth) ?? true;
      } catch {
        return true;
      }
    }

    if (currentHabit.frequency_type === "interval") {
      try {
        const cfg = JSON.parse(currentHabit.frequency_config) as {
          every?: number;
        };
        const every = cfg.every ?? 1;
        const createdLocalDateStr = utcToLocalDate(
          currentHabit.created_at,
          timezone,
        );
        const created = new Date(`${createdLocalDateStr}T12:00:00`);
        const diffTime = date.getTime() - created.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % every === 0;
      } catch {
        return true;
      }
    }

    return true;
  };

  // Compile calculations when habit or entries load
  const stats = useMemo(() => {
    if (!habit) return null;

    const today = todayLocalDate(timezone);
    const createdLocalDate = utcToLocalDate(habit.created_at, timezone);

    // Group entry values by local date
    const valByDate: Record<string, number> = {};
    entries.forEach((e) => {
      const d = utcToLocalDate(e.logged_at, timezone);
      valByDate[d] = (valByDate[d] ?? 0) + e.value;
    });

    // 1. Generate status map for all days from created date to today
    const statusMap: Record<
      string,
      "SUCCESS" | "FAILED" | "SKIPPED" | "PENDING"
    > = {};
    let datesList: string[] = [];

    let curr = createdLocalDate;
    // Safety guard to avoid locking browser
    let loopGuard = 0;
    while (curr <= today && loopGuard < 10000) {
      datesList.push(curr);
      curr = addDays(curr, 1);
      loopGuard++;
    }

    datesList.forEach((d) => {
      const sum = valByDate[d] ?? 0;
      const active = isDayActive(d, habit);
      const met = habit.type === "yn" ? sum >= 1 : sum >= habit.goal;

      if (active) {
        if (met) {
          statusMap[d] = "SUCCESS";
        } else if (d === today) {
          statusMap[d] = "PENDING";
        } else {
          statusMap[d] = "FAILED";
        }
      } else {
        statusMap[d] = "SKIPPED";
      }
    });

    // 2. Compute overall metrics
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    Object.keys(statusMap).forEach((d) => {
      const status = statusMap[d];
      if (status === "SUCCESS") successCount++;
      else if (status === "FAILED") failedCount++;
      else if (status === "SKIPPED") skippedCount++;
    });

    // 3. Calculate streak (consecutive SUCCESS days, ignoring SKIPPED)
    let streak = 0;
    let checkDate = today;

    // If today is active but goal not met yet, streak is based on yesterday
    const todayStatus = statusMap[today];
    if (todayStatus === "PENDING") {
      checkDate = addDays(today, -1);
    }

    let streakGuard = 0;
    while (streakGuard < 5000) {
      // If we go before the habit's creation date, stop
      if (checkDate < createdLocalDate) {
        break;
      }

      const status = statusMap[checkDate];
      if (status === "SUCCESS") {
        streak++;
      } else if (status === "FAILED") {
        // Active day and not met breaks the streak
        break;
      } else {
        // SKIPPED or PENDING (if we somehow hit it) doesn't break, we just skip back
      }

      checkDate = addDays(checkDate, -1);
      streakGuard++;
    }

    // 4. Weekly row calculations (last 7 days ending today)
    const weeklyDays: {
      dateStr: string;
      weekdayName: string;
      status: "SUCCESS" | "FAILED" | "SKIPPED" | "PENDING";
    }[] = [];

    const dayNamesES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(today, -i);
      const dObj = new Date(`${dateStr}T12:00:00`);
      const weekdayName = dayNamesES[dObj.getDay()];

      // Compute status (if it exists in our map, use it. Otherwise, if it's in the future it's pending/inactive, etc.)
      let status: "SUCCESS" | "FAILED" | "SKIPPED" | "PENDING" = "PENDING";
      if (dateStr in statusMap) {
        status = statusMap[dateStr];
      } else {
        // If outside of createdLocalDate to today range
        if (dateStr < createdLocalDate) {
          status = "SKIPPED";
        } else {
          status = "PENDING";
        }
      }

      weeklyDays.push({
        dateStr,
        weekdayName,
        status,
      });
    }

    // 5. Recent (last 7 days) metrics for trend highlights
    let recentSuccess = 0;
    let recentFailed = 0;
    let recentSkipped = 0;
    let recentLogs = 0;

    const sevenDaysAgo = addDays(today, -6);
    entries.forEach((e) => {
      const d = utcToLocalDate(e.logged_at, timezone);
      if (d >= sevenDaysAgo && d <= today) {
        recentLogs++;
      }
    });

    weeklyDays.forEach((wd) => {
      if (wd.status === "SUCCESS") recentSuccess++;
      else if (wd.status === "FAILED") recentFailed++;
      else if (wd.status === "SKIPPED") recentSkipped++;
    });

    return {
      statusMap,
      successCount,
      failedCount,
      skippedCount,
      streak,
      weeklyDays,
      recentSuccess,
      recentFailed,
      recentSkipped,
      recentLogs,
      createdLocalDate,
      today,
      valByDate,
    };
  }, [habit, entries, timezone]);

  // Generate monthly calendar cells
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayIdx = firstDay.getDay(); // 0 = Sunday

    const prevMonthDays = new Date(year, month, 0).getDate();
    const currMonthDays = new Date(year, month + 1, 0).getDate();

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Previous month trailing days
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      let pm = month - 1;
      let py = year;
      if (pm < 0) {
        pm = 11;
        py--;
      }
      const dateStr = getLocalDateString(py, pm, dayNum);
      cells.push({ dateStr, dayNum, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= currMonthDays; i++) {
      const dateStr = getLocalDateString(year, month, i);
      cells.push({ dateStr, dayNum: i, isCurrentMonth: true });
    }

    // Next month leading days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      let nm = month + 1;
      let ny = year;
      if (nm > 11) {
        nm = 0;
        ny++;
      }
      const dateStr = getLocalDateString(ny, nm, i);
      cells.push({ dateStr, dayNum: i, isCurrentMonth: false });
    }

    return cells;
  }, [currentMonth]);

  if (!habit) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const navigateMonth = (direction: number) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const streakMessage = (days: number): string => {
    if (days === 0) return "¡Empieza hoy mismo! Cada día cuenta.";
    if (days === 1) return "¡Racha de 1 día! Cada día cuenta. ¡Sigue así!";
    if (days < 4)
      return `¡Racha de ${days} días! ¡Celebra estas primeras victorias!`;
    if (days < 7)
      return `¡Gran racha de ${days} días! Estás creando el hábito.`;
    return `¡Increíble racha de ${days} días! Sigue sumando victorias.`;
  };

  return (
    <div className="screen">
      {/* Header */}
      <div
        style={{
          padding: "14px 14px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Btn
          onClick={() => navigate(-1)}
          style={{ height: 36, padding: "0 14px", fontSize: 16 }}
        >
          <ArrowLeft size={16} /> Detalle
        </Btn>
        <span
          className="font-hand text-ink-soft overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ fontSize: 15, maxWidth: 150 }}
        >
          {habit.name}
        </span>
        <div style={{ width: 90 }} />
      </div>

      <div className="screen-scroll" style={{ padding: "12px 14px 24px" }}>
        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <div className="font-display leading-none" style={{ fontSize: 34 }}>
            Estadísticas
          </div>
          <Scribble width={130} style={{ marginTop: 3 }} />
        </div>

        {loading && !stats ? (
          <div
            className="font-hand text-ink-soft text-center"
            style={{ fontSize: 17, padding: "20px 0" }}
          >
            Cargando estadísticas…
          </div>
        ) : stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Streak Card */}
            <SketchBox
              padding={18}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 110,
                }}
              >
                <FireSimpleIcon size={104} weight="fill" color="var(--coral)" />
                <span
                  className="font-display"
                  style={{
                    position: "absolute",
                    fontSize: stats.streak > 99 ? 24 : 32,
                    fontWeight: 700,
                    color: "var(--paper)",
                    top: "55%",
                    transform: "translateY(-10%)",
                  }}
                >
                  {stats.streak}
                </span>
              </div>

              <div
                className="font-display"
                style={{ fontSize: 24, marginTop: 4, lineHeight: 1.1 }}
              >
                {stats.streak === 1 ? "día en racha!" : "días en racha!"}
              </div>

              <div
                className="font-hand text-ink-soft"
                style={{ fontSize: 15, marginTop: 6, maxWidth: "90%" }}
              >
                {streakMessage(stats.streak)}
              </div>

              {/* Last 7 Days Circles */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  maxWidth: 320,
                  marginTop: 18,
                  padding: "0 4px",
                }}
              >
                {stats.weeklyDays.map((wd) => {
                  const isSuccess = wd.status === "SUCCESS";
                  const isPending = wd.status === "PENDING";
                  const isSkipped = wd.status === "SKIPPED";

                  let circleBg = "transparent";
                  let circleBorder = "1.6px solid var(--ink)";
                  let circleOpacity = 1;

                  if (isSuccess) {
                    circleBg = "var(--coral)";
                    circleBorder = "1.6px solid var(--ink)";
                  } else if (isPending) {
                    circleBorder = "1.6px dashed var(--coral)";
                  } else if (isSkipped) {
                    circleBorder = "1.6px dashed var(--ink-soft)";
                    circleOpacity = 0.35;
                  } else {
                    // Failed
                    circleBorder = "1.6px solid var(--ink-soft)";
                    circleBg = "rgba(0,0,0,0.03)";
                    circleOpacity = 0.55;
                  }

                  return (
                    <div
                      key={wd.dateStr}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: circleBg,
                          border: circleBorder,
                          opacity: circleOpacity,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSuccess && (
                          <span
                            style={{
                              color: "var(--paper)",
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        className="font-hand text-ink-soft"
                        style={{ fontSize: 12 }}
                      >
                        {wd.weekdayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SketchBox>

            {/* Metrics 2x2 Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {/* SUCCESS CARD */}
              <SketchBox
                padding={12}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  className="font-hand text-ink-soft"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  ✓ ÉXITO
                </span>
                <span
                  className="font-display"
                  style={{ fontSize: 24, lineHeight: 1 }}
                >
                  {stats.successCount}{" "}
                  {stats.successCount === 1 ? "Día" : "Días"}
                </span>
                <span
                  className="font-hand"
                  style={{
                    fontSize: 12,
                    color:
                      stats.recentSuccess > 0
                        ? "var(--coral)"
                        : "var(--ink-soft)",
                  }}
                >
                  {stats.recentSuccess > 0
                    ? `▲ ${stats.recentSuccess}d esta sem.`
                    : "---"}
                </span>
              </SketchBox>

              {/* FAILED CARD */}
              <SketchBox
                padding={12}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  className="font-hand text-ink-soft"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  ✗ FALLADO
                </span>
                <span
                  className="font-display"
                  style={{ fontSize: 24, lineHeight: 1 }}
                >
                  {stats.failedCount} {stats.failedCount === 1 ? "Día" : "Días"}
                </span>
                <span
                  className="font-hand text-ink-soft"
                  style={{ fontSize: 12 }}
                >
                  {stats.recentFailed > 0
                    ? `▲ ${stats.recentFailed}d esta sem.`
                    : "---"}
                </span>
              </SketchBox>

              {/* SKIPPED CARD */}
              <SketchBox
                padding={12}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  className="font-hand text-ink-soft"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  → OMITIDO
                </span>
                <span
                  className="font-display"
                  style={{ fontSize: 24, lineHeight: 1 }}
                >
                  {stats.skippedCount}{" "}
                  {stats.skippedCount === 1 ? "Día" : "Días"}
                </span>
                <span
                  className="font-hand text-ink-soft"
                  style={{ fontSize: 12 }}
                >
                  {stats.recentSkipped > 0
                    ? `▲ ${stats.recentSkipped}d esta sem.`
                    : "---"}
                </span>
              </SketchBox>

              {/* TOTAL CARD */}
              <SketchBox
                padding={12}
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  className="font-hand text-ink-soft"
                  style={{
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  TOTAL
                </span>
                <span
                  className="font-display"
                  style={{ fontSize: 24, lineHeight: 1 }}
                >
                  {stats.recentLogs + (entries.length - stats.recentLogs)}{" "}
                  {entries.length === 1 ? "Vez" : "Veces"}
                </span>
                <span
                  className="font-hand"
                  style={{
                    fontSize: 12,
                    color:
                      stats.recentLogs > 0 ? "var(--coral)" : "var(--ink-soft)",
                  }}
                >
                  {stats.recentLogs > 0
                    ? `▲ ${stats.recentLogs} reg. esta sem.`
                    : "---"}
                </span>
              </SketchBox>
            </div>

            {/* Monthly Calendar Card */}
            <SketchBox padding={14}>
              {/* Calendar Header with Navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span className="font-display" style={{ fontSize: 22 }}>
                  {MONTH_NAMES[currentMonth.getMonth()]}{" "}
                  {currentMonth.getFullYear()}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn
                    onClick={() => navigateMonth(-1)}
                    style={{ padding: "4px 8px", borderRadius: 8 }}
                  >
                    <CaretLeft size={16} />
                  </Btn>
                  <Btn
                    onClick={() => navigateMonth(1)}
                    style={{ padding: "4px 8px", borderRadius: 8 }}
                  >
                    <CaretRight size={16} />
                  </Btn>
                </div>
              </div>

              {/* Weekday Headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                {WEEKDAY_NAMES_SHORT.map((name) => (
                  <span
                    key={name}
                    className="font-hand text-ink-soft"
                    style={{ fontSize: 12, fontWeight: "bold" }}
                  >
                    {name}
                  </span>
                ))}
              </div>

              {/* Days Grid (42 cells) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                }}
              >
                {calendarCells.map((cell, idx) => {
                  const dayStatus = stats.statusMap[cell.dateStr];
                  const isSuccess = dayStatus === "SUCCESS";
                  const isSkipped = dayStatus === "SKIPPED";
                  const isFailed = dayStatus === "FAILED";
                  const isToday = cell.dateStr === stats.today;

                  // Disabled if not current month, or before creation date, or in the future
                  const isDisabled =
                    !cell.isCurrentMonth ||
                    cell.dateStr < stats.createdLocalDate ||
                    cell.dateStr > stats.today;

                  let cellColor = "var(--ink)";
                  let cellBg = "transparent";
                  let cellBorder = "none";
                  let cellOpacity = 1;

                  if (isDisabled) {
                    cellColor = "var(--ink-soft)";
                    cellOpacity = 0.35;
                  } else {
                    if (isSuccess) {
                      cellColor = "var(--paper)";
                      cellBg = "var(--coral)";
                      cellBorder = "1.6px solid var(--ink)";
                    } else if (isToday) {
                      cellBorder = "1.6px dashed var(--coral)";
                    } else if (isFailed) {
                      cellOpacity = 0.7;
                    } else if (isSkipped) {
                      cellColor = "var(--ink-soft)";
                      cellOpacity = 0.4;
                    }
                  }

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: cellBg,
                          border: cellBorder,
                          opacity: cellOpacity,
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 13,
                            fontWeight: isToday ? "bold" : "normal",
                            color: cellColor,
                          }}
                        >
                          {cell.dayNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SketchBox>
          </div>
        ) : null}
      </div>
    </div>
  );
}
