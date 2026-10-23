import api from "./api.js";

export async function loginUser(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}

export async function registerUser(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data;
}

export async function verifyOtp(verificationData) {
  const response = await api.post("/auth/verify-account", verificationData);
  return response.data;
}

export async function sendOTP(email) {
  const response = await api.post("/auth/send-verify-email", { email });
  return response.data;
}
