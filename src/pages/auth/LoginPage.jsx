import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../api/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginUser({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      const tokens = result?.data ?? result;

      if (!tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error(
          result?.message || "Phản hồi đăng nhập không có đủ token.",
        );
      }

      window.localStorage.setItem("accessToken", tokens.accessToken);
      window.localStorage.setItem("refreshToken", tokens.refreshToken);
      navigate("/", { replace: true });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <Link className="login-card__back" to="/">
          ← Trang chủ
        </Link>
        <p className="login-card__eyebrow">Learning Management System</p>
        <h1 id="login-title">Chào mừng trở lại</h1>
        <p className="login-card__description">
          Đăng nhập để tiếp tục hành trình học tập của bạn.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          <label className="login-form__field">
            <span>Mật khẩu</span>
            <span className="login-form__password">
              <input
                autoComplete="current-password"
                minLength={8}
                name="password"
                placeholder="Nhập mật khẩu"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="login-form__toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </span>
          </label>

          {errorMessage && (
            <p className="login-form__error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="login-form__submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="login-card__note">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </p>
        <p className="login-card__note">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
