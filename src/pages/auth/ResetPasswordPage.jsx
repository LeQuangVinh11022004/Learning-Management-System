import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./LoginPage.css";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      setIsSubmitting(false);
      return;
    }

    if (!token) {
      setErrorMessage("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await resetPassword({ token, newPassword: password });

      if (
        typeof result?.status === "number" &&
        result.status !== 200 &&
        result.status !== 202
      ) {
        throw new Error(result?.message || "Không thể đặt lại mật khẩu.");
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="reset-password-title">
        <Link className="login-card__back" to="/forgot-password">
          ← Yêu cầu liên kết mới
        </Link>
        <p className="login-card__eyebrow">Bảo mật tài khoản</p>
        <h1 id="reset-password-title">Đặt lại mật khẩu</h1>
        {!token ? (
          <p className="login-form__error" role="alert">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
        ) : isSubmitted ? (
          <>
            <p className="login-card__description" role="status">
              Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <Link
              className="login-form__submit login-form__submit-link"
              to="/login"
            >
              Đăng nhập
            </Link>
          </>
        ) : (
          <>
            <p className="login-card__description">
              Tạo mật khẩu mới có ít nhất 8 ký tự.
            </p>
            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-form__field">
                <span>Mật khẩu mới</span>
                <input
                  autoComplete="new-password"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <label className="login-form__field">
                <span>Xác nhận mật khẩu</span>
                <input
                  autoComplete="new-password"
                  minLength={8}
                  name="confirmPassword"
                  required
                  type="password"
                />
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
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default ResetPasswordPage;
