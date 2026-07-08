import { getIndexSuffix } from "../elasticClient";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Weekly ES index suffix as an ISO 8601 week-date in UTC: `<isoWeekYear>.<isoWeek>` (`xxxx.ww`), week un-padded (e.g. "2026.1").
// It MUST use the ISO week-year, not the calendar year — otherwise late-December logs collide with the prior January's same-numbered week.
// https://www.elastic.co/docs/reference/logstash/plugins/plugins-outputs-elasticsearch#plugins-outputs-elasticsearch-index
describe("getIndexSuffix", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // The year-boundary rows below are the ones a naive calendar-year + week
    // suffix (`${year}.${week}`) would get wrong by using the calendar year
    // instead of the ISO week-year.
    it.each([
        { date: "2024-01-01T12:00:00Z", expected: "2024.1" },
        { date: "2024-06-10T12:00:00Z", expected: "2024.24" },
        // Early January can still belong to the previous ISO week-year.
        { date: "2023-01-01T12:00:00Z", expected: "2022.52" },
        // 2020 has 53 ISO weeks; Jan 1 2021 still belongs to week 53 of 2020.
        { date: "2021-01-01T12:00:00Z", expected: "2020.53" },
        // Late December can belong to the next ISO week-year.
        { date: "2024-12-31T12:00:00Z", expected: "2025.1" },
        { date: "2025-12-29T12:00:00Z", expected: "2026.1" }
    ])("returns $expected for $date", ({ date, expected }) => {
        vi.setSystemTime(new Date(date));

        expect(getIndexSuffix()).toBe(expected);
    });
});
