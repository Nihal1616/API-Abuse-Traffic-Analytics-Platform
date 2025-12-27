const crypto = require("crypto");

class Helpers {
  // Generate random string
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Format bytes to human readable format
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Calculate percentage change
  static calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  // Validate IP address
  static isValidIP(ip) {
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Parse user agent
  static parseUserAgent(userAgent) {
    const ua = userAgent || "";

    return {
      browser: ua.includes("Chrome")
        ? "Chrome"
        : ua.includes("Firefox")
        ? "Firefox"
        : ua.includes("Safari")
        ? "Safari"
        : "Other",
      os: ua.includes("Windows")
        ? "Windows"
        : ua.includes("Mac")
        ? "MacOS"
        : ua.includes("Linux")
        ? "Linux"
        : ua.includes("Android")
        ? "Android"
        : "Other",
      isBot:
        ua.includes("bot") || ua.includes("crawler") || ua.includes("spider"),
      raw: ua.substring(0, 255), // Truncate long user agents
    };
  }

  // Generate secure token
  static generateSecureToken() {
    return (
      crypto.randomBytes(32).toString("hex") +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2)
    );
  }

  // Calculate threat score
  static calculateThreatScore(factors) {
    const weights = {
      requestRate: 0.3,
      errorRate: 0.2,
      geoRisk: 0.15,
      patternAnomaly: 0.2,
      reputation: 0.15,
    };

    let score = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      score += (factors[factor] || 0) * weight;
    }

    return Math.min(Math.round(score * 100), 100);
  }

  // Format date for display
  static formatDate(date, format = "relative") {
    const now = new Date();
    const diff = now - new Date(date);

    if (format === "relative") {
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      return "Just now";
    }

    return new Date(date).toLocaleString();
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects
  static mergeObjects(...objects) {
    return objects.reduce((merged, obj) => {
      return { ...merged, ...obj };
    }, {});
  }

  // Delay function
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Truncate text
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
}

module.exports = Helpers;
