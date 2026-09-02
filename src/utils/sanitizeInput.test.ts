import { describe, expect, it } from "vitest";
import {
  sanitizeInput,
  sanitizeHTML,
  validateEmail,
  validatePhoneNumber,
} from "./sanitizeInput";

describe("sanitizeInput", () => {
  it("leaves plain text untouched", () => {
    expect(sanitizeInput("John Doe")).toBe("John Doe");
  });

  it("strips HTML tags", () => {
    expect(sanitizeInput("<b>bold</b> text")).toBe("bold text");
  });

  it("strips a script tag payload", () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe(
      'alert("xss")hello',
    );
  });

  it("blocks javascript: URIs regardless of case", () => {
    expect(sanitizeInput("javascript:alert(1)")).toBe("alert(1)");
    expect(sanitizeInput("JavaScript:alert(1)")).toBe("alert(1)");
  });

  it("removes the on<event>= prefix of inline event handler attributes", () => {
    // The regex only strips the "onerror="/"onClick=" prefix itself, not the
    // attribute value that follows - documenting the current behavior.
    expect(sanitizeInput('onerror=alert(1) onClick="x"')).toBe('alert(1) "x"');
  });

  it("blocks data: and vbscript: URIs", () => {
    expect(sanitizeInput("data:text/html,<script>1</script>")).toBe(
      "text/html,1",
    );
    expect(sanitizeInput("vbscript:msgbox(1)")).toBe("msgbox(1)");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeInput("  hello  ")).toBe("hello");
  });
});

describe("sanitizeHTML", () => {
  it("removes script tags including their content", () => {
    expect(sanitizeHTML('<div>safe</div><script>evil()</script>')).toBe(
      "<div>safe</div>",
    );
  });

  it("removes iframe tags including their content", () => {
    expect(
      sanitizeHTML('<p>ok</p><iframe src="evil.com"></iframe>'),
    ).toBe("<p>ok</p>");
  });

  it("removes the on<event>= prefix but keeps the surrounding tag", () => {
    // Same caveat as sanitizeInput: only the "onerror=" prefix is stripped,
    // not the quoted value after it - documenting the current behavior.
    expect(sanitizeHTML('<img src="x" onerror="alert(1)">')).toBe(
      '<img src="x" "alert(1)">',
    );
  });

  it("blocks javascript:/data:/vbscript: URIs", () => {
    expect(sanitizeHTML('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a href="alert(1)">x</a>',
    );
  });
});

describe("validateEmail", () => {
  it("accepts a well-formed email", () => {
    expect(validateEmail("user@example.com")).toBe(true);
  });

  it("rejects an email missing a domain", () => {
    expect(validateEmail("user@")).toBe(false);
  });

  it("rejects an email with no @ symbol", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("rejects an email with spaces", () => {
    expect(validateEmail("user name@example.com")).toBe(false);
  });
});

describe("validatePhoneNumber", () => {
  it("accepts a plain digit string", () => {
    expect(validatePhoneNumber("97312345678")).toBe(true);
  });

  it("accepts a number formatted with spaces, dashes and parentheses", () => {
    expect(validatePhoneNumber("+973 1234 5678")).toBe(true);
    expect(validatePhoneNumber("(973) 1234-5678")).toBe(true);
  });

  it("rejects a number starting with 0 after stripping formatting", () => {
    expect(validatePhoneNumber("0123456789")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(validatePhoneNumber("not-a-phone")).toBe(false);
  });
});
