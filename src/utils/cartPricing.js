export function getCoursePrice(course) {
  const directPrice = course.priceDiscount ?? course.discountPrice;
  if (directPrice != null && directPrice !== "") {
    const parsedDirectPrice = Number(directPrice);
    if (Number.isFinite(parsedDirectPrice) && parsedDirectPrice >= 0) {
      return parsedDirectPrice;
    }
  }

  if (course.price == null || course.price === "") return null;

  const price = Number(course.price);
  if (!Number.isFinite(price) || price < 0) return null;

  const discount = Number(course.discount ?? 0);
  if (!Number.isFinite(discount) || discount <= 0) return price;

  return price * (1 - Math.min(discount, 100) / 100);
}

export function getCartTotal(courses) {
  let total = 0;
  for (const course of courses) {
    const price = getCoursePrice(course);
    if (price === null) return null;
    total += price;
  }
  return total;
}
