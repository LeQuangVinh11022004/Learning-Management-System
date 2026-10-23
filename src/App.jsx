import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";

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
                <Link className="welcome__login" to="/login">
                  Đăng nhập
                </Link>
              </section>
            </main>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
