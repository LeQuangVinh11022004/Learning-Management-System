import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import CourseCatalogPage from "./pages/courses/CourseCatalogPage.jsx";
import CourseDetailPage from "./pages/courses/CourseDetailPage.jsx";
import WishlistPage from "./pages/student/WishlistPage.jsx";
import CartPage from "./pages/student/CartPage.jsx";
import CheckoutPage from "./pages/student/CheckoutPage.jsx";
import EnrolledCoursesPage from "./pages/student/EnrolledCoursesPage.jsx";

function App() {
  return (
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route
          path="/"
          element={
            <main className="welcome">
              <section
                className="welcome__card"
                aria-labelledby="welcome-title"
              >
                <p className="welcome__eyebrow">
                  Learning Management System
                </p>
                <h1 id="welcome-title">Nền tảng học tập đang được xây dựng</h1>
                <p className="welcome__description">
            Chúng tôi đang xây dựng một nền tảng học tập hiện đại, giúp quản lý và theo dõi tiến trình học 
            tập một cách hiệu quả.
                </p>
                <div className="welcome__status">
                  <span className="welcome__indicator" aria-hidden="true" />
                  <span>Nền tảng ứng dụng đã sẵn sàng</span>
                </div>
                <Link className="welcome__login" to="/courses">
                  Khám phá khóa học
                </Link>
                <Link className="welcome__login" to="/login">
                  Đăng nhập
                </Link>
              </section>
            </main>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/course-detail/:id" element={<CourseDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/my-courses" element={<EnrolledCoursesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
