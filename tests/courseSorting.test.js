import test from "node:test";
import assert from "node:assert/strict";
import { getCatalogPrice, sortCoursesByPrice } from "../src/utils/courseSorting.js";

test("sorts by the displayed price and keeps unavailable prices last", () => {
  const courses = [
    { id: "unknown" },
    { id: "discounted", price: 100, priceDiscount: 20 },
    { id: "free", price: 0 },
    { id: "regular", price: "50" },
    { id: "invalid", price: "invalid" },
  ];

  assert.deepEqual(
    sortCoursesByPrice(courses, "price-asc").map((course) => course.id),
    ["free", "discounted", "regular", "unknown", "invalid"],
  );
  assert.deepEqual(
    sortCoursesByPrice(courses, "price-desc").map((course) => course.id),
    ["regular", "discounted", "free", "unknown", "invalid"],
  );
  assert.equal(courses[0].id, "unknown");
});

test("preserves default order and handles missing or invalid prices", () => {
  const courses = [{ price: null }, { discountPrice: 12 }, { price: -1 }];
  assert.equal(sortCoursesByPrice(courses, "default"), courses);
  assert.equal(getCatalogPrice(courses[0]), null);
  assert.equal(getCatalogPrice(courses[1]), 12);
  assert.equal(getCatalogPrice(courses[2]), null);
});
