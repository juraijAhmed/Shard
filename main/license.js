const fs = require("fs");
const path = require("path");
const { app } = require("electron");
require("dotenv").config();

const DODO_API_KEY =
  process.env.DODO_API_KEY 
const LICENSE_FILE = path.join(app.getPath("userData"), "license.json");

// ─── Dodo SDK client ──────────────────────────────────────────────────────────

const DodoPayments = require("dodopayments");

const client = new DodoPayments({
  bearerToken: DODO_API_KEY,
  baseURL: "https://live.dodopayments.com",
});

// ─── File helpers ─────────────────────────────────────────────────────────────

function readLicense() {
  try {
    if (!fs.existsSync(LICENSE_FILE)) return null;
    return JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeLicense(data) {
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function clearLicense() {
  if (fs.existsSync(LICENSE_FILE)) fs.unlinkSync(LICENSE_FILE);
}

// ─── Dodo API calls ───────────────────────────────────────────────────────────

async function activateLicense(licenseKey) {
  const result = await client.licenses.activate({
    license_key: licenseKey,
    name: `Shard - ${require("os").hostname()}`,
  });
  return result;
}

async function validateLicense(licenseKey, activationId) {
  const result = await client.licenses.validate({
    license_key: licenseKey,
    activation_id: activationId,
  });
  return result; // { valid: true/false, ... }
}

// ─── Main logic ───────────────────────────────────────────────────────────────

async function checkLicense() {
  const saved = readLicense();

  if (!saved?.license_key) {
    return { licensed: false };
  }

  try {
    const result = await validateLicense(
      saved.license_key,
      saved.activation_id,
    );
    if (result.valid) {
      return { licensed: true };
    } else {
      clearLicense();
      return { licensed: false, reason: "License has been revoked." };
    }
  } catch (err) {
    // Network error — allow offline if key was previously saved
    console.warn(
      "Shard: license validation network error, allowing offline:",
      err.message,
    );
    return { licensed: true };
  }
}

async function activateAndSave(licenseKey) {
  const trimmed = licenseKey.trim();
  if (!trimmed) return { success: false, error: "Please enter a license key." };

  try {
    const result = await activateLicense(trimmed);
    writeLicense({
      license_key: trimmed,
      activation_id: result.id,
      activated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (err) {
    const msg = err.message || "";
    if (msg.toLowerCase().includes("limit")) {
      return {
        success: false,
        error:
          "This key has reached its activation limit. Please contact support.",
      };
    }
    if (
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("invalid")
    ) {
      return {
        success: false,
        error: "Invalid license key. Please check and try again.",
      };
    }
    if (
      msg.toLowerCase().includes("disabled") ||
      msg.toLowerCase().includes("revoked")
    ) {
      return { success: false, error: "This license key has been disabled." };
    }
    return {
      success: false,
      error: msg || "Activation failed. Please try again.",
    };
  }
}

module.exports = { checkLicense, activateAndSave, readLicense, clearLicense };
