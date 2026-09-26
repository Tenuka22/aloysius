import { describe, expect, it } from "vitest";

import { sanitizeRichText } from "./sanitize-rich-text";

describe(sanitizeRichText, () => {
  it("keeps allowlisted formatting markup", () => {
    expect(
      sanitizeRichText(
        "<p>Faith, <strong>discipline</strong> and <em>excellence</em>.</p>"
      )
    ).toBe(
      "<p>Faith, <strong>discipline</strong> and <em>excellence</em>.</p>"
    );
  });

  it("keeps headings, lists and quotes", () => {
    expect(
      sanitizeRichText(
        "<h2>Welcome</h2><ul><li>One</li><li>Two</li></ul><blockquote>Quoted</blockquote>"
      )
    ).toBe(
      "<h2>Welcome</h2><ul><li>One</li><li>Two</li></ul><blockquote>Quoted</blockquote>"
    );
  });

  it("removes script tags and their contents", () => {
    expect(sanitizeRichText("<p>a</p><script>alert(1)</script><p>b</p>")).toBe(
      "<p>a</p><p>b</p>"
    );
  });

  it("removes style and iframe contents too", () => {
    expect(
      sanitizeRichText("<style>body{display:none}</style><p>kept</p>")
    ).toBe("<p>kept</p>");
    expect(sanitizeRichText('<iframe src="https://evil.test"></iframe>')).toBe(
      ""
    );
  });

  it("drops event handler attributes but keeps the text", () => {
    expect(sanitizeRichText('<p onclick="steal()">hello</p>')).toBe(
      "<p>hello</p>"
    );
    expect(sanitizeRichText('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("drops style attributes", () => {
    expect(sanitizeRichText('<p style="position:fixed">hi</p>')).toBe(
      "<p>hi</p>"
    );
  });

  it("rejects javascript: and data: hrefs, dropping the anchor", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe("x");
    expect(sanitizeRichText('<a href="data:text/html,<b>x">y</a>')).toBe("y");
  });

  it("rejects obfuscated javascript: hrefs", () => {
    expect(sanitizeRichText('<a href="java\0script:alert(1)">x</a>')).toBe("x");
    expect(sanitizeRichText('<a href="JaVaScRiPt:alert(1)">x</a>')).toBe("x");
  });

  it("keeps safe hrefs", () => {
    expect(sanitizeRichText('<a href="/about">x</a>')).toBe(
      '<a href="/about">x</a>'
    );
    expect(sanitizeRichText('<a href="https://a.test/p">x</a>')).toBe(
      '<a href="https://a.test/p">x</a>'
    );
    expect(sanitizeRichText('<a href="mailto:a@b.test">x</a>')).toBe(
      '<a href="mailto:a@b.test">x</a>'
    );
  });

  it("escapes stray angle brackets in text", () => {
    expect(sanitizeRichText("5 < 6 and 7 > 2")).toBe("5 &lt; 6 and 7 &gt; 2");
  });

  it("does not double-encode existing entities", () => {
    expect(
      sanitizeRichText("<p>Tom &amp; Jerry &mdash; cena viriliter</p>")
    ).toBe("<p>Tom &amp; Jerry — cena viriliter</p>");
  });

  it("closes tags left open", () => {
    expect(sanitizeRichText("<p>unclosed")).toBe("<p>unclosed</p>");
    expect(sanitizeRichText("<ul><li>a")).toBe("<ul><li>a</li></ul>");
  });

  it("repairs crossed tags", () => {
    expect(sanitizeRichText("<p><strong>a</p>b</strong>")).toBe(
      "<p><strong>a</strong></p>b"
    );
  });

  it("treats a second paragraph as implicitly closing the first", () => {
    expect(sanitizeRichText("<p>a<p>b")).toBe("<p>a</p><p>b</p>");
  });

  it("unwraps unknown tags but keeps their text", () => {
    expect(sanitizeRichText("<p>a <span>b</span> c</p>")).toBe("<p>a b c</p>");
    expect(sanitizeRichText("<marquee>text</marquee>")).toBe("text");
  });

  it("removes comments", () => {
    expect(sanitizeRichText("<p>a</p><!-- secret --><p>b</p>")).toBe(
      "<p>a</p><p>b</p>"
    );
  });

  it("normalises b and i to strong and em", () => {
    expect(sanitizeRichText("<p><b>x</b> <i>y</i></p>")).toBe(
      "<p><strong>x</strong> <em>y</em></p>"
    );
  });

  it("self-closes void elements and drops their closing tag", () => {
    expect(sanitizeRichText("<p>a<br>b</p>")).toBe("<p>a<br />b</p>");
    expect(sanitizeRichText("<hr>")).toBe("<hr />");
    expect(sanitizeRichText("</br>")).toBe("");
  });

  it("is idempotent", () => {
    const dirty =
      '<p style="x">a<script>bad()</script><b>b</b><a href="javascript:x">l</a></p>';
    const once = sanitizeRichText(dirty);
    expect(sanitizeRichText(once)).toBe(once);
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeRichText("")).toBe("");
  });

  it("preserves whitespace between inline tags", () => {
    expect(sanitizeRichText("<p><strong>a</strong> <em>b</em></p>")).toBe(
      "<p><strong>a</strong> <em>b</em></p>"
    );
  });
});
