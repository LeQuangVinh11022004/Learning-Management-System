import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCatalogCourses,
  getCatalogCategories,
} from "../src/utils/courseCatalogFilters.js";

const courses = [
  {
    id: "free",
    title: "Lập trình cơ bản",
    category: { name: "Lập trình" },
    price: 0,
    ratingsAverage: 4.8,
  },
  {
    id: "paid",
    title: "Thiết kế giao diện",
    category: { name: "Thiết kế" },
    price: 250,
    ratingsAverage: 4.2,
    author: { firstName: "An", lastName: "Nguyen" },
  },
  { id: "unknown-price", title: "Chưa định giá", ratingsAverage: 4.9 },
  { id: "inactive", title: "Không khả dụng", price: 0, isActive: false },
  { id: "unconfirmed", title: "Chưa duyệt", price: 0, isConfirmed: false },
];

test("filters catalog by text, category, price, and minimum rating", () => {
  assert.deepEqual(
    filterCatalogCourses(courses, {
      search: "AN NGUYEN",
      category: "Thiết kế",
      price: "paid",
      minimumRating: "4",
    }).map((course) => course.id),
    ["paid"],
  );
  assert.deepEqual(
    filterCatalogCourses(courses, { price: "free" }).map((course) => course.id),
    ["free"],
  );
  assert.deepEqual(
    filterCatalogCourses(courses, { minimumRating: "4.5" }).map(
      (course) => course.id,
    ),
    ["free", "unknown-price"],
  );
});

test("returns Vietnamese-sorted distinct categories", () => {
  assert.deepEqual(
    getCatalogCategories([
      ...courses,
      { category: { name: "Lập trình" } },
      {},
    ]),
    ["Lập trình", "Thiết kế"],
  );
});
