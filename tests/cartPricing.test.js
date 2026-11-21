import test from "node:test";
import assert from "node:assert/strict";
import { getCartTotal, getCoursePrice } from "../src/utils/cartPricing.js";

test("uses discounted prices and validates missing or invalid values", () => {
  assert.equal(getCoursePrice({ price: 100, discount: 25 }), 75);
  assert.equal(getCoursePrice({ price: 100, priceDiscount: "40" }), 40);
  assert.equal(getCoursePrice({ price: 100, discount: 150 }), 0);
  assert.equal(getCoursePrice({}), null);
  assert.equal(getCoursePrice({ price: "invalid" }), null);
});

test("returns no total when any course price is unavailable", () => {
  assert.equal(
    getCartTotal([{ price: 20 }, { price: 100, discount: 50 }]),
    70,
  );
  assert.equal(getCartTotal([{ price: 20 }, {}]), null);
});
