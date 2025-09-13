export const sanitizeInput = (input: string) => {
  return input
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Block JS injections
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Block data URI injections
    .replace(/vbscript:/gi, "") // Block VBScript
    .trim();
};

export const sanitizeHTML = (html: string) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframe tags
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/javascript:/gi, "") // Block JS injections
    .replace(/data:/gi, "") // Block data URI injections
    .replace(/vbscript:/gi, ""); // Block VBScript
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
};
