import api from "./api.js";

function unwrapList(response, key) {
  const payload = response.data?.data ?? response.data;
  const items = Array.isArray(payload) ? payload : payload?.[key];

  if (!Array.isArray(items)) {
    throw new Error(`Dữ liệu ${key} từ máy chủ không hợp lệ.`);
  }

  return items;
}

export async function fetchBookmarks() {
  const response = await api.get("/bookmarks/bookmarked-by-user");
  return unwrapList(response, "data");
}

export async function addBookmark(courseId) {
  const response = await api.post(
    `/bookmarks/bookmarked/${encodeURIComponent(courseId)}`,
  );
  return response.data;
}

export async function removeBookmark(courseId) {
  await api.put(`/bookmarks/unbookmarked/${encodeURIComponent(courseId)}`);
}

export async function fetchCart() {
  const response = await api.get("/cart");
  const payload = response.data?.data ?? response.data;
  const courses = payload?.courses;

  if (!Array.isArray(courses)) {
    throw new Error("Dữ liệu giỏ hàng từ máy chủ không hợp lệ.");
  }

  return courses;
}

export async function addCourseToCart(courseId) {
  const response = await api.post("/cart", { courseID: courseId });
  return response.data;
}

export async function removeCourseFromCart(courseId) {
  await api.delete("/cart", { data: { courseID: courseId } });
}

export async function fetchCurrentUser() {
  const response = await api.get("/users/me");
  const user = response.data?.data ?? response.data;

  if (!user || typeof user !== "object" || Array.isArray(user)) {
    throw new Error("Dữ liệu tài khoản từ máy chủ không hợp lệ.");
  }

  return user;
}

export async function checkoutWithWallet(balance) {
  const response = await api.post("/orders/checkout", { balance });
  return response.data;
}
