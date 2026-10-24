import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./LoginPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await forgotPassword({
        email: email.trim(),
        callbackUrl: `${window.location.origin}/reset-password`,
      });

      if (
        typeof result?.status === "number" &&
        result.status !== 200 &&
        result.status !== 202
      ) {
        throw new Error(
          result?.message || "Không thể gửi yêu cầu đặt lại mật khẩu.",
        );
      }

      setIsSubmitted(true);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể gửi yêu cầu lúc này. Vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="forgot-password-title">
        <Link className="login-card__back" to="/login">
          ← Quay lại đăng nhập
        </Link>
        <p className="login-card__eyebrow">Khôi phục tài khoản</p>
        <h1 id="forgot-password-title">Quên mật khẩu?</h1>
        {isSubmitted ? (
          <>
            <p className="login-card__description" role="status">
              Nếu email đã được đăng ký, hướng dẫn đặt lại mật khẩu sẽ được gửi
              đến <strong>{email}</strong>.
            </p>
            <Link
              className="login-form__submit login-form__submit-link"
              to="/login"
            >
              Về trang đăng nhập
            </Link>
          </>
        ) : (
          <>
            <p className="login-card__description">
              Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
            </p>
            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-form__field">
                <span>Email</span>
                <input
                  autoComplete="email"
                  autoFocus
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
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
                {isSubmitting ? "Đang gửi..." : "Gửi liên kết"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
