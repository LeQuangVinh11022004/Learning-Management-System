import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="not-found">
      <section aria-labelledby="not-found-title" className="not-found__card">
        <p className="not-found__eyebrow">Learning Management System</p>
        <p aria-hidden="true" className="not-found__code">
          404
        </p>
        <h1 id="not-found-title">Không tìm thấy trang</h1>
        <p className="not-found__description">
          Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay về
          trang chủ hoặc khám phá các khóa học.
        </p>
        <div className="not-found__actions">
          <Link className="not-found__primary" to="/courses">
            Khám phá khóa học
          </Link>
          <Link className="not-found__secondary" to="/">
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;
