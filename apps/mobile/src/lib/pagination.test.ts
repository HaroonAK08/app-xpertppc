import { describe, expect, it } from "vitest";
import { flattenUniquePages } from "./pagination";

describe("flattenUniquePages", () => {
  it("keeps provider order and removes overlapping cursor rows", () => {
    const result = flattenUniquePages([
      { data: [{ id: "3" }, { id: "2" }] },
      { data: [{ id: "2" }, { id: "1" }] },
    ]);
    expect(result.map((item) => item.id)).toEqual(["3", "2", "1"]);
  });

  it("returns an empty stable shape before pages load", () => {
    expect(flattenUniquePages(undefined)).toEqual([]);
  });
});
