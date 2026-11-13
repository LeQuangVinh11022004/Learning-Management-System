import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  uploadCurrentUserAvatar,
  updateCurrentUserProfile,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

function getDateInputValue(value) {
  if (!value) return "";
  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getProfileForm(user) {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    dob: getDateInputValue(user.dob ?? user.birthday),
  };
}

function ProfilePage() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setForm(getProfileForm(currentUser));
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải thông tin tài khoản."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }

    loadProfile();
  }, [loadProfile, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccessMessage("");
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".jpg")) {
      setErrorMessage("Ảnh đại diện phải có định dạng .jpg.");
      setSuccessMessage("");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUploadingAvatar(true);

    try {
      const avatarUrl = await uploadCurrentUserAvatar(file);
      const refreshedUrl = new URL(avatarUrl, window.location.origin);
      if (!["http:", "https:"].includes(refreshedUrl.protocol)) {
        throw new Error("Máy chủ trả về đường dẫn ảnh không an toàn.");
      }

      refreshedUrl.searchParams.set("t", String(Date.now()));
      setUser((current) => ({ ...current, avatar: refreshedUrl.toString() }));
      setSuccessMessage("Ảnh đại diện đã được cập nhật.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật ảnh đại diện."),
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const userId = user.id ?? user._id;
      const updatedProfile = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        dob: form.dob,
      };

      await updateCurrentUserProfile(userId, updatedProfile);
      setUser((current) => ({ ...current, ...updatedProfile }));
      setForm(updatedProfile);
      setSuccessMessage("Thông tin hồ sơ đã được cập nhật.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật hồ sơ. Vui lòng thử lại."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <Link className="library-header__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="library-header__nav">
          <Link to="/courses">Khóa học</Link>
          <Link to="/my-courses">Khóa học của tôi</Link>
          <Link to="/wishlist">Yêu thích</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <Link aria-current="page" to="/profile">
            Tài khoản
          </Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/my-courses">
          ← Khóa học của tôi
        </Link>
        <div className="library-title-row">
          <div>
            <p className="library-eyebrow">Tài khoản học viên</p>
            <h1>Hồ sơ cá nhân</h1>
            <p className="library-description">
              Xem và cập nhật thông tin liên hệ của bạn.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            {!user && (
              <button disabled={isLoading} onClick={loadProfile} type="button">
                Thử lại
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <p aria-live="polite" className="profile-success" role="status">
            {successMessage}
          </p>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải hồ sơ...
          </p>
        ) : user && form ? (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form__identity">
              <div className="profile-form__avatar-wrap">
                <div aria-hidden="true" className="profile-form__avatar">
                  {user.avatar ? (
                    <img alt="" src={user.avatar} />
                  ) : (
                    `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`
                      .trim()
                      .toLocaleUpperCase("vi") || "L"
                  )}
                </div>
                <input
                  accept=".jpg,image/jpeg"
                  aria-label="Chọn ảnh đại diện JPG"
                  className="visually-hidden"
                  onChange={handleAvatarChange}
                  ref={avatarInputRef}
                  type="file"
                />
                <button
                  className="profile-form__avatar-button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                  type="button"
                >
                  {isUploadingAvatar ? "Đang tải ảnh..." : "Đổi ảnh"}
                </button>
              </div>
              <div>
                <h2>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "Học viên"}
                </h2>
                <p>{user.email || "Chưa có email"}</p>
                <span>{user.role ?? user.userRole ?? "Học viên"}</span>
              </div>
            </div>

            <div className="profile-form__grid">
              <label>
                Họ
                <input
                  autoComplete="family-name"
                  maxLength={80}
                  name="lastName"
                  onChange={handleChange}
                  required
                  value={form.lastName}
                />
              </label>
              <label>
                Tên
                <input
                  autoComplete="given-name"
                  maxLength={80}
                  name="firstName"
                  onChange={handleChange}
                  required
                  value={form.firstName}
                />
              </label>
              <label>
                Email
                <input
                  autoComplete="email"
                  disabled
                  type="email"
                  value={user.email ?? ""}
                />
              </label>
              <label>
                Số điện thoại
                <input
                  autoComplete="tel"
                  maxLength={30}
                  name="phone"
                  onChange={handleChange}
                  type="tel"
                  value={form.phone}
                />
              </label>
              <label>
                Ngày sinh
                <input
                  autoComplete="bday"
                  max={new Date().toISOString().slice(0, 10)}
                  name="dob"
                  onChange={handleChange}
                  type="date"
                  value={form.dob}
                />
              </label>
              <label className="profile-form__address">
                Địa chỉ
                <input
                  autoComplete="street-address"
                  maxLength={200}
                  name="address"
                  onChange={handleChange}
                  value={form.address}
                />
              </label>
            </div>

            <div className="profile-form__actions">
              <Link className="profile-form__cancel" to="/my-courses">
                Hủy
              </Link>
              <button disabled={isSaving} type="submit">
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export default ProfilePage;
