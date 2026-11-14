import api from "./api.js";

function getPagePayload(response) {
  const payload = response.data?.data ?? response.data;

  if (Array.isArray(payload)) {
    return { courses: payload, totalPages: 1 };
  }

  const courses = payload?.results ?? payload?.courses;

  if (!Array.isArray(courses)) {
    throw new Error("Dữ liệu khóa học từ máy chủ không hợp lệ.");
  }

  return {
    courses,
    totalPages: Number.isInteger(payload.totalPages)
      ? payload.totalPages
      : 1,
  };
}

export async function fetchCourses() {
  const courses = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await api.get("/courses/", { params: { page } });
    const result = getPagePayload(response);
    courses.push(...result.courses);
    totalPages = Math.max(result.totalPages, 1);
    page += 1;
  } while (page <= totalPages);

  return courses;
}

export async function fetchCourseById(courseId) {
  const response = await api.get(`/courses/detail/${encodeURIComponent(courseId)}`);
  const course = response.data?.data ?? response.data;

  if (!course || typeof course !== "object" || Array.isArray(course)) {
    throw new Error("Không tìm thấy khóa học này.");
  }

  return course;
}

export async function fetchCourseReviews(courseId) {
  const response = await api.get(
    `/reviews/course/${encodeURIComponent(courseId)}`,
  );
  const payload = response.data?.data ?? response.data;
  const reviews = Array.isArray(payload) ? payload : payload?.reviews;

  if (!Array.isArray(reviews)) {
    throw new Error("Dữ liệu đánh giá từ máy chủ không hợp lệ.");
  }

  return reviews;
}

export async function fetchUserReviews(userId) {
  const response = await api.get(
    `/reviews/user/${encodeURIComponent(userId)}`,
  );
  const payload = response.data?.data ?? response.data;

  if (!Array.isArray(payload)) {
    throw new Error("Dữ liệu đánh giá của bạn từ máy chủ không hợp lệ.");
  }

  return payload;
}

export async function createReview(courseId, review) {
  const response = await api.post("/reviews/createReview", {
    courseID: courseId,
    rating: review.rating,
    comment: review.comment,
  });
  return response.data;
}

export async function updateReview(reviewId, review) {
  const response = await api.patch(
    `/reviews/updateReview/${encodeURIComponent(reviewId)}`,
    {
      rating: review.rating,
      comment: review.comment,
    },
  );
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(
    `/reviews/deleteReview/${encodeURIComponent(reviewId)}`,
  );
  return response.data;
}
