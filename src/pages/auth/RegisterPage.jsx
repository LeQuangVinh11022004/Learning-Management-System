import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, sendOTP, verifyOtp } from "../../api/authApi.js";
import "./RegisterPage.css";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  address: "",
  phone: "",
  dob: "",
  certificates: [""],
};

function getErrorMessage(error) {
  const responseData = error?.response?.data;
  const errors = responseData?.errors ?? responseData?.Errors;

  if (Array.isArray(errors)) {
    return errors.join(", ");
  }

  if (typeof errors === "string") {
    return errors;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.Message === "string") {
    return responseData.Message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

function getAdultDateLimit() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function RegistrationVerification({
  email,
  feedback,
  isSubmitting,
  onClose,
  onResend,
  onSubmit,
  secondsRemaining,
  setOtp,
  otp,
}) {
  return (
    <div className="register-overlay">
      <section
        aria-labelledby="verification-title"
        aria-modal="true"
        className="register-verification"
        role="dialog"
      >
        <button
          aria-label="Đóng xác minh"
          className="register-verification__close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="register-card__eyebrow">Xác minh email</p>
        <h2 id="verification-title">Nhập mã OTP</h2>
        <p>
          Mã xác minh đã được gửi đến <strong>{email}</strong>.
        </p>
        <p className="register-verification__timer">
          {secondsRemaining > 0
            ? `Mã hết hạn sau ${formatTime(secondsRemaining)}`
            : "Mã đã hết hạn. Hãy yêu cầu gửi mã mới."}
        </p>
        {feedback.text && (
          <p
            className={
              feedback.type === "error"
                ? "register-form__error"
                : "register-form__feedback"
            }
            role="status"
          >
            {feedback.text}
          </p>
        )}
        <form className="register-form" onSubmit={onSubmit}>
          <label className="register-form__field">
            <span>Mã OTP (6 chữ số)</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              pattern="[0-9]{6}"
              required
              value={otp}
            />
          </label>
          <button
            className="register-form__submit"
            disabled={isSubmitting || secondsRemaining === 0 || otp.length !== 6}
            type="submit"
          >
            {isSubmitting ? "Đang xác minh..." : "Xác minh"}
          </button>
        </form>
        <button
          className="register-verification__resend"
          disabled={isSubmitting}
          onClick={onResend}
          type="button"
        >
          Gửi lại mã
        </button>
      </section>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [verificationFeedback, setVerificationFeedback] = useState({
    text: "",
    type: "",
  });
  const [otp, setOtp] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  useEffect(() => {
    if (!isVerificationOpen || secondsRemaining === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isVerificationOpen, secondsRemaining]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function closeVerification() {
    window.localStorage.removeItem("authToken");
    setAuthToken("");
    setIsVerificationOpen(false);
    setOtp("");
    setVerificationFeedback({ text: "", type: "" });
  }

  async function handleRegister(event) {
    event.preventDefault();
    setFeedback("");

    if (form.password !== form.confirmPassword) {
      setFeedback("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim() || !form.address.trim()) {
      setFeedback("Họ, tên và địa chỉ không được để trống.");
      return;
    }

    if (form.dob < "1888-01-01" || form.dob > getAdultDateLimit()) {
      setFeedback("Bạn phải đủ 18 tuổi và ngày sinh phải hợp lệ.");
      return;
    }

    const certificates = form.certificates
      .map((certificate) => certificate.trim())
      .filter(Boolean);

    if (form.role === "instructor" && certificates.length === 0) {
      setFeedback("Instructor cần cung cấp ít nhất một chứng chỉ.");
      return;
    }

    const userData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      address: form.address.trim(),
      phone: form.phone,
      dob: form.dob,
    };

    if (form.role === "instructor") {
      userData.certificate = certificates;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser(userData);
      const responseData = result?.data ?? result;

      if (
        typeof result?.status === "number" &&
        result.status !== 200 &&
        result.status !== 201
      ) {
        throw new Error(
          responseData?.message || "Không thể tạo tài khoản.",
        );
      }

      if (!responseData?.token) {
        throw new Error(
          responseData?.message || "Phản hồi đăng ký không có token xác minh.",
        );
      }

      window.localStorage.setItem("authToken", responseData.token);
      setAuthToken(responseData.token);
      setSecondsRemaining(300);
      setIsVerificationOpen(true);
      setVerificationFeedback({ text: "", type: "" });
      setFeedback("Tạo tài khoản thành công. Vui lòng xác minh email.");
    } catch (error) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setVerificationFeedback({ text: "", type: "" });
    setIsSubmitting(true);

    try {
      const result = await verifyOtp({ token: authToken, otp });

      if (
        typeof result?.status === "number" &&
        result.status !== 200 &&
        result.status !== 201
      ) {
        throw new Error(result?.message || "Mã OTP không hợp lệ.");
      }

      closeVerification();
      navigate("/login", { replace: true });
    } catch (error) {
      setVerificationFeedback({
        text: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setVerificationFeedback({ text: "", type: "" });
    setIsSubmitting(true);

    try {
      await sendOTP(form.email.trim());
      setSecondsRemaining(300);
      setOtp("");
      setVerificationFeedback({
        text: "Đã gửi lại mã OTP.",
        type: "success",
      });
    } catch (error) {
      setVerificationFeedback({
        text: getErrorMessage(error),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCertificate(index, value) {
    setForm((currentForm) => ({
      ...currentForm,
      certificates: currentForm.certificates.map((certificate, itemIndex) =>
        itemIndex === index ? value : certificate,
      ),
    }));
  }

  function addCertificate() {
    setForm((currentForm) => ({
      ...currentForm,
      certificates: [...currentForm.certificates, ""],
    }));
  }

  function removeCertificate(index) {
    setForm((currentForm) => ({
      ...currentForm,
      certificates: currentForm.certificates.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  return (
    <main className="register-page">
      <section className="register-card" aria-labelledby="register-title">
        <Link className="register-card__back" to="/">
          ← Trang chủ
        </Link>
        <p className="register-card__eyebrow">Learning Management System</p>
        <h1 id="register-title">Tạo tài khoản</h1>
        <p className="register-card__description">
          Tham gia nền tảng học tập với vai trò Student hoặc Instructor.
        </p>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="register-form__row">
            <label className="register-form__field">
              <span>Họ</span>
              <input
                autoComplete="family-name"
                maxLength={80}
                name="lastName"
                onChange={updateField}
                required
                value={form.lastName}
              />
            </label>
            <label className="register-form__field">
              <span>Tên</span>
              <input
                autoComplete="given-name"
                maxLength={80}
                name="firstName"
                onChange={updateField}
                required
                value={form.firstName}
              />
            </label>
          </div>

          <label className="register-form__field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={updateField}
              required
              type="email"
              value={form.email}
            />
          </label>

          <div className="register-form__row">
            <label className="register-form__field">
              <span>Mật khẩu</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                onChange={updateField}
                required
                type="password"
                value={form.password}
              />
            </label>
            <label className="register-form__field">
              <span>Xác nhận mật khẩu</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="confirmPassword"
                onChange={updateField}
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>
          </div>

          <label className="register-form__field">
            <span>Vai trò</span>
            <select
              name="role"
              onChange={updateField}
              required
              value={form.role}
            >
              <option value="">Chọn vai trò</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>

          <div className="register-form__row">
            <label className="register-form__field">
              <span>Ngày sinh (đủ 18 tuổi)</span>
              <input
                autoComplete="bday"
                max={getAdultDateLimit()}
                min="1888-01-01"
                name="dob"
                onChange={updateField}
                required
                type="date"
                value={form.dob}
              />
            </label>
            <label className="register-form__field">
              <span>Số điện thoại</span>
              <input
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                name="phone"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                pattern="[0-9]{10}"
                required
                value={form.phone}
              />
            </label>
          </div>

          <label className="register-form__field">
            <span>Địa chỉ</span>
            <input
              autoComplete="street-address"
              maxLength={200}
              name="address"
              onChange={updateField}
              required
              value={form.address}
            />
          </label>

          {form.role === "instructor" && (
            <fieldset className="register-certificates">
              <legend>Chứng chỉ Instructor</legend>
              {form.certificates.map((certificate, index) => (
                <div className="register-certificates__row" key={index}>
                  <input
                    aria-label={`Chứng chỉ ${index + 1}`}
                    maxLength={160}
                    onChange={(event) =>
                      updateCertificate(index, event.target.value)
                    }
                    placeholder="Tên chứng chỉ"
                    value={certificate}
                  />
                  {form.certificates.length > 1 && (
                    <button
                      className="register-certificates__remove"
                      onClick={() => removeCertificate(index)}
                      type="button"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ))}
              <button
                className="register-certificates__add"
                onClick={addCertificate}
                type="button"
              >
                + Thêm chứng chỉ
              </button>
            </fieldset>
          )}

          {feedback && (
            <p
              className={
                isVerificationOpen
                  ? "register-form__feedback"
                  : "register-form__error"
              }
              role="status"
            >
              {feedback}
            </p>
          )}

          <button
            className="register-form__submit"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="register-card__note">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>

      {isVerificationOpen && (
        <RegistrationVerification
          email={form.email}
          feedback={verificationFeedback}
          isSubmitting={isSubmitting}
          onClose={closeVerification}
          onResend={handleResendOtp}
          onSubmit={handleVerify}
          otp={otp}
          secondsRemaining={secondsRemaining}
          setOtp={setOtp}
        />
      )}
    </main>
  );
}

export default RegisterPage;
