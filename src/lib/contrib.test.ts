import { test } from "node:test";
import assert from "node:assert/strict";
import { parseContributions } from "./contrib.ts";

test("reads days, levels, tooltips and the yearly total; junk gives nothing", () => {
  const html = `<h2 id="x" class="f4">
      364
      contributions
        in the last year
    </h2>
    <td tabindex="0" data-ix="2" style="width: 10px" data-date="2025-10-19" id="contribution-day-component-0-2" data-level="1" role="gridcell"></td>
    <tool-tip id="t" for="contribution-day-component-0-2" popover="manual">1 contribution on October 19th.</tool-tip>`;
  assert.deepEqual(parseContributions(html), { total: "364", days: [{ date: "2025-10-19", row: 0, col: 2, level: 1, tip: "1 contribution on October 19th." }] });
  assert.deepEqual(parseContributions("<html>rate limited</html>"), { total: null, days: [] });
});
