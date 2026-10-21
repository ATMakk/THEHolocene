const UserModel = require("../models/user.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const cloudinary = require("../utils/cloudinary");
const transporter = require("../utils/mailer");
const RegistrationOtp = require("../models/registrationOtp.model");
const {
  normalizeEmail,
  isValidEmail,
  isValidName,
  isValidTag,
  isValidPassword,
} = require("../utils/authValidation");

const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, tag } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirstname =
    typeof firstname === "string" ? firstname.trim() : "";
  const normalizedLastname =
    typeof lastname === "string" ? lastname.trim() : "";
  const normalizedTag = typeof tag === "string" ? tag.trim() : undefined;

  try {
    if (
      !isValidName(normalizedFirstname) ||
      !isValidName(normalizedLastname) ||
      !isValidEmail(normalizedEmail) ||
      !isValidTag(normalizedTag) ||
      !isValidPassword(password)
    ) {
      return res.status(400).send({
        message:
          "Check your name, email, username, and password. Passwords must be 10–72 characters with at least one letter and one number.",
      });
    }

    if (!process.env.APP_EMAIL || !process.env.APP_PASS || !process.env.JWT_SECRET) {
      return res.status(503).send({
        message: "Email verification is temporarily unavailable",
      });
    }

    const now = new Date();
    const genericResponse = {
      message:
        "If this email can be registered, a verification code has been sent.",
      data: { email: normalizedEmail },
    };

    if (await UserModel.exists({ email: normalizedEmail })) {
      return res.status(202).send(genericResponse);
    }

    const pending = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (pending?.nextRequestAt > now && pending.expiresAt > now) {
      return res.status(429).send({
        message: "Please wait before requesting another verification code.",
      });
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const passwordHash = await bcryptjs.hash(password, 12);
    const otpHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(`${normalizedEmail}:${otp}`)
      .digest("hex");

    const update = {
      email: normalizedEmail,
      firstname: normalizedFirstname,
      lastname: normalizedLastname,
      passwordHash,
      otpHash,
      attempts: 0,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      nextRequestAt: new Date(now.getTime() + 60 * 1000),
    };
    if (normalizedTag) update.tag = normalizedTag;

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: update,
        ...(!normalizedTag && { $unset: { tag: 1 } }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await transporter.sendMail({
        from: process.env.APP_EMAIL,
        to: normalizedEmail,
        subject: "Your THE Holocene verification code",
        text: `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${otp}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
      });
    } catch (mailError) {
      await RegistrationOtp.deleteOne({ email: normalizedEmail, otpHash });
      console.error("Registration verification email could not be sent:", mailError.message);
      return res.status(503).send({
        message: "Could not send a verification email. Please try again later.",
      });
    }

    res.status(202).send(genericResponse);
  } catch (error) {
    console.error("Registration verification request failed:", error.message);
    res.status(500).send({ message: "Could not request email verification" });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const { otp, photo } = req.body;

  try {
    if (
      !isValidEmail(normalizedEmail) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).send({ message: "Invalid or expired verification code" });
    }

    const pending = await RegistrationOtp.findOne({
      email: normalizedEmail,
    }).select("+otpHash +passwordHash");
    if (!pending || pending.expiresAt <= new Date() || pending.attempts >= 5) {
      if (pending && pending.attempts >= 5) {
        await RegistrationOtp.deleteOne({ _id: pending._id });
      }
      return res.status(400).send({ message: "Invalid or expired verification code" });
    }

    const submittedHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET)
      .update(`${normalizedEmail}:${otp}`)
      .digest("hex");
    const matches = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(pending.otpHash, "hex")
    );

    if (!matches) {
      pending.attempts += 1;
      if (pending.attempts >= 5) await pending.deleteOne();
      else await pending.save();
      return res.status(400).send({ message: "Invalid or expired verification code" });
    }

    if (
      photo !== undefined &&
      (typeof photo !== "string" ||
        photo.length > 7_000_000 ||
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))
    ) {
      return res.status(400).send({ message: "Profile image is invalid or too large" });
    }

    const generatedID = `CC${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    let profilePicture = {};
    if (photo) {
      const uploaded = await cloudinary.uploader.upload(photo, {
        folder: "profile_pictures",
      });
      profilePicture = {
        secure_url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const user = await UserModel.create({
      firstname: pending.firstname,
      lastname: pending.lastname,
      email: normalizedEmail,
      tag: pending.tag,
      password: pending.passwordHash,
      idNumber: generatedID,
      profilePicture,
      emailVerified: true,
    });

    await RegistrationOtp.deleteOne({ _id: pending._id });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(201).send({
      message: "Email verified and account created",
      data: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        tag: user.tag || null,
        idNumber: user.idNumber,
        token,
        photo: user.profilePicture?.secure_url || null,
      },
    });
  } catch (error) {
    console.error("Registration OTP verification failed:", error.message);
    if (error.code === 11000) {
      return res.status(409).send({
        message: "Could not create an account with these details",
      });
    }
    res.status(500).send({ message: "Could not verify email and create account" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (
      !isValidEmail(normalizedEmail) ||
      typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const isUser = await UserModel.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!isUser || !isUser.password || isUser.emailVerified === false) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const isMatch = await bcryptjs.compare(password, isUser.password);
    if (!isMatch) {
      return res.status(401).send({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: isUser._id, role: isUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h", algorithm: "HS256" }
    );

    res.status(200).send({
      message: "User login successful",
      data: {
        _id: isUser._id,
        firstname: isUser.firstname,
        lastname: isUser.lastname,
        email: isUser.email,
        role: isUser.role,
        token,
        tag: isUser.tag || null,
        photo: isUser.profilePicture?.secure_url || null,
      },
    });
  } catch (error) {
    console.error("User login failed:", error.message);
    res.status(401).send({ message: "Invalid email or password" });
  }
};

const socialLoginUser = async (req, res) => {
  try {
    const { provider, credential, nonce } = req.body;
    if (
      provider !== "google" ||
      typeof credential !== "string" ||
      credential.length > 10_000 ||
      typeof nonce !== "string" ||
      !/^[a-f0-9]{64}$/.test(nonce)
    ) {
      return res.status(400).send({ message: "A valid Google sign-in credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
      return res.status(503).send({ message: "Google sign-in is not configured" });
    }

    const { data: claims } = await axios.get(
      "https://oauth2.googleapis.com/tokeninfo",
      { params: { id_token: credential }, timeout: 10_000 }
    );
    if (
      claims.aud !== process.env.GOOGLE_CLIENT_ID ||
      !["accounts.google.com", "https://accounts.google.com"].includes(claims.iss) ||
      claims.email_verified !== "true" ||
      claims.nonce !== nonce ||
      !claims.sub ||
      !isValidEmail(normalizeEmail(claims.email))
    ) {
      return res.status(401).send({ message: "Google sign-in could not be verified" });
    }

    return sendSocialLogin(res, {
      provider: "google",
      providerId: claims.sub,
      email: normalizeEmail(claims.email),
      firstname: claims.given_name,
      lastname: claims.family_name,
      photo: claims.picture,
    });
  } catch (error) {
    console.error("Google credential verification failed:", error.message);
    res.status(401).send({ message: "Google sign-in could not be verified" });
  }
};

const createSocialLoginResponse = async (identity) => {
  const { provider, providerId, email, firstname, lastname, photo } = identity;
  if (
    !["google", "github"].includes(provider) ||
    typeof providerId !== "string" ||
    !isValidEmail(normalizeEmail(email))
  ) {
    throw new Error("Social account could not be verified");
  }

  const idField = `${provider}Id`;
  let user = await UserModel.findOne({ [idField]: providerId });
  if (!user) {
    user = await UserModel.findOne({ email: normalizeEmail(email) });
  }

  if (user) {
    if (user[idField] && user[idField] !== providerId) {
      const error = new Error("This email is already linked to another social account");
      error.statusCode = 409;
      throw error;
    }
    user[idField] = providerId;
    user.emailVerified = true;
    await user.save();
  } else {
    const generatedID = `SOC${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const names = `${firstname || ""} ${lastname || ""}`.trim().split(/\s+/);
    user = await UserModel.create({
      firstname: names[0] || "User",
      lastname: names.slice(1).join(" ") || (provider === "github" ? "Member" : "User"),
      email: normalizeEmail(email),
      provider,
      [idField]: providerId,
      idNumber: generatedID,
      emailVerified: true,
      ...(photo && {
        profilePicture: { secure_url: photo },
      }),
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h", algorithm: "HS256" }
  );
  return {
    message: `${provider} authentication successful`,
    data: {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      token,
      tag: user.tag || null,
      photo: user.profilePicture?.secure_url || null,
    },
  };
};

const sendSocialLogin = async (res, identity) => {
  try {
    const result = await createSocialLoginResponse(identity);
    return res.status(200).send(result);
  } catch (error) {
    console.error("Social account login failed:", error.message);
    return res
      .status(error.statusCode || 401)
      .send({ message: error.statusCode ? error.message : "Social account could not be verified" });
  }
};

const getFrontendUrl = () => {
  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim();
  const url = new URL(frontend);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    (process.env.NODE_ENV === "production" && url.protocol !== "https:")
  ) {
    throw new Error("FRONTEND_URL must be HTTPS in production");
  }
  return url.origin;
};

const githubStateCookie = "github_oauth_state";

const startGithubLogin = (req, res) => {
  const { GITHUB_CLIENT_ID, GITHUB_CALLBACK_URL } = process.env;
  if (!GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
    return res.redirect(`${getFrontendUrl()}/login?socialError=github-config`);
  }

  let callback;
  try {
    callback = new URL(GITHUB_CALLBACK_URL);
  } catch {
    return res.redirect(`${getFrontendUrl()}/login?socialError=github-config`);
  }
  if (
    !["http:", "https:"].includes(callback.protocol) ||
    (process.env.NODE_ENV === "production" && callback.protocol !== "https:")
  ) {
    return res.status(503).send({ message: "GitHub callback URL is not secure" });
  }

  const state = crypto.randomBytes(32).toString("hex");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${githubStateCookie}=${state}; Path=/api/v1/users/oauth/github; HttpOnly; SameSite=Lax; Max-Age=600${secure}`
  );

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", callback.href);
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);
  res.redirect(authorize.href);
};

const githubLoginCallback = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const clearCookie =
    `${githubStateCookie}=; Path=/api/v1/users/oauth/github; HttpOnly; ` +
    `SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", clearCookie);

  const stateCookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${githubStateCookie}=`))
    ?.slice(githubStateCookie.length + 1);
  const queryState = typeof req.query.state === "string" ? req.query.state : "";
  const cookieBuffer = Buffer.from(stateCookie || "");
  const queryBuffer = Buffer.from(queryState);
  const validState =
    cookieBuffer.length === queryBuffer.length &&
    cookieBuffer.length > 0 &&
    crypto.timingSafeEqual(cookieBuffer, queryBuffer);

  let frontend;
  try {
    frontend = getFrontendUrl();
  } catch (error) {
    console.error("GitHub OAuth redirect configuration error:", error.message);
    return res.status(500).send({ message: "Social sign-in is not configured" });
  }

  if (!validState || typeof req.query.code !== "string") {
    return res.redirect(`${frontend}/login?socialError=github`);
  }

  try {
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL, JWT_SECRET } =
      process.env;
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL || !JWT_SECRET) {
      throw new Error("GitHub OAuth is not configured");
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: req.query.code,
        redirect_uri: new URL(GITHUB_CALLBACK_URL).href,
      },
      {
        headers: { Accept: "application/json" },
        timeout: 10_000,
      }
    );
    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) throw new Error("GitHub did not return an access token");

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "THE-Holocene",
    };
    const [profileResponse, emailsResponse] = await Promise.all([
      axios.get("https://api.github.com/user", { headers, timeout: 10_000 }),
      axios.get("https://api.github.com/user/emails", { headers, timeout: 10_000 }),
    ]);
    const verifiedEmail = emailsResponse.data?.find(
      (entry) => entry.primary && entry.verified
    )?.email;
    if (!verifiedEmail || !isValidEmail(normalizeEmail(verifiedEmail))) {
      return res.redirect(`${frontend}/login?socialError=github-email`);
    }

    const profile = profileResponse.data;
    const displayNames = (profile.name || profile.login || "GitHub Member")
      .trim()
      .split(/\s+/);
    const socialResult = await createSocialLoginResponse({
      provider: "github",
      providerId: String(profile.id),
      email: normalizeEmail(verifiedEmail),
      firstname: displayNames[0],
      lastname: displayNames.slice(1).join(" ") || "Member",
      photo: profile.avatar_url,
    });

    const token = socialResult?.data?.token;
    if (!token) throw new Error("Could not complete GitHub sign-in");
    return res.redirect(`${frontend}/auth/callback#token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error("GitHub OAuth callback failed:", error.message);
    return res.redirect(`${frontend}/login?socialError=github`);
  }
};

const getUser = async (req, res) => {
  const { id } = req.user;
  try {
    const user = await UserModel.findById(id).populate("bookmarks");
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send({ message: "User profile fetched", data: user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "User cannot be fetched at this time" });
  }
};

const getUserByOperator = async (req, res) => {
  const { role } = req.user;
  const { userId } = req.params;

  try {
    if (role !== "operator" && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).send({ message: "User not found" });
    res.status(200).send({ message: "User profile fetched", data: user });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "User cannot be fetched at this time" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { id: requesterId, role } = req.user;
  const { firstname, lastname, tag } = req.body;

  try {
    if (requesterId !== id && role !== "operator" && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }

    const allowedUpdate = {
      ...(firstname && { firstname: firstname.trim() }),
      ...(lastname && { lastname: lastname.trim() }),
      ...(tag && { tag: tag.trim() }),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(id, allowedUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser)
      return res.status(400).send({ message: "Cannot update user" });

    res.status(200).send({ message: "User updated", data: updatedUser });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update User" });
  }
};

const updateProfilePicture = async (req, res) => {
  const { id: userId } = req.user;
  const { photo } = req.body;

  try {
    if (!photo) return res.status(400).send({ message: "Photo is required" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).send({ message: "User not found" });

    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    const uploaded = await cloudinary.uploader.upload(photo, {
      folder: "profile_pictures",
    });
    user.profilePicture = {
      secure_url: uploaded.secure_url,
      public_id: uploaded.public_id,
    };
    await user.save();

    res.status(200).send({
      message: "Profile picture updated",
      data: { photo: user.profilePicture.secure_url },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot update profile picture" });
  }
};

const changePassword = async (req, res) => {
  const { id: userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    if (
      typeof oldPassword !== "string" ||
      !isValidPassword(newPassword)
    ) {
      return res.status(400).send({
        message:
          "Enter your current password and a new password with 10–72 characters, at least one letter and one number, and no spaces.",
      });
    }
    const user = await UserModel.findById(userId).select("+password");
    if (!user?.password) {
      return res.status(400).send({ message: "Current password is incorrect" });
    }
    const match = await bcryptjs.compare(oldPassword, user.password);
    if (!match) return res.status(400).send({ message: "Old password incorrect" });

    user.password = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10));
    await user.save();

    res.status(200).send({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot change password" });
  }
};

const forgotPassword = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  const genericResponse = {
    message:
      "If an account exists for that email, password reset instructions will be sent.",
  };

  try {
    if (!isValidEmail(normalizedEmail)) {
      return res.status(202).send(genericResponse);
    }
    if (!process.env.APP_EMAIL || !process.env.APP_PASS) {
      return res.status(503).send({
        message: "Password reset email is temporarily unavailable",
      });
    }

    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) return res.status(202).send(genericResponse);

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
    await user.save();

    const frontendBase = getFrontendUrl();
    const resetUrl = `${frontendBase}/reset-password/${rawToken}`;

    try {
      await transporter.sendMail({
        from: process.env.APP_EMAIL,
        to: user.email,
        subject: "Password Reset Request - THE Holocene",
        html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
      });
    } catch (mailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      console.error("Password reset email could not be sent:", mailError.message);
    }

    res.status(202).send(genericResponse);
  } catch (error) {
    console.error("Password reset request failed:", error.message);
    res.status(500).send({ message: "Cannot process forgot password" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!isValidPassword(newPassword)) {
      return res.status(400).send({
        message:
          "Password must be 10–72 characters with at least one letter and one number, and no spaces",
      });
    }
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) return res.status(400).send({ message: "Invalid or expired token" });

    user.password = await bcryptjs.hash(newPassword, await bcryptjs.genSalt(10));
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send({ message: "Password reset successful" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot reset password" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  const isSelf = String(req.user.id) === String(id);

  try {
    if (!isSelf && role !== "admin") {
      return res.status(403).send({ message: "Forbidden resource" });
    }
    const user = await UserModel.findById(id);
    if (!user) return res.status(404).send({ message: "User not found" });

    if (user.profilePicture?.public_id) {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    }
    await UserModel.findByIdAndDelete(id);

    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Cannot delete user" });
  }
};

module.exports = {
  registerUser,
  verifyRegistrationOtp,
  loginUser,
  socialLoginUser,
  startGithubLogin,
  githubLoginCallback,
  getUser,
  getUserByOperator,
  updateUser,
  updateProfilePicture,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteUser,
};