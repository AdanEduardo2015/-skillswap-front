import { describe, expect, it, vi } from "vitest";
import {
  buildPublicationPayload,
  parsePublicationTags,
  validatePublicationForm,
  validateVideoFile,
  createEmptyPublicationFormValues,
  inferPublicationFormat,
  getPublicationFormValues,
  readVideoDuration,
  validateVideoDuration,
} from "./publicationForm";

describe("educational publication form", () => {
  it("validates required educational fields", () => {
    const errors = validatePublicationForm({
      title: "",
      content: "",
      categoryId: "",
      format: "article",
      tags: [],
      videoUrl: null,
    });

    expect(errors.title).toBeTruthy();
    expect(errors.content).toBeTruthy();
    expect(errors.categoryId).toContain("obligatoriamente");
  });

  it("limits tags to five normalized values", () => {
    expect(parsePublicationTags("#ts, react, ts, api, web, cloud")).toEqual([
      "ts",
      "react",
      "api",
      "web",
      "cloud",
    ]);
  });

  it("builds the backend payload with educational fields", () => {
    const payload = buildPublicationPayload({
      title: " TypeScript ",
      content: " Contenido ",
      categoryId: "tecnologia",
      format: "article",
      tags: ["typescript"],
      videoUrl: null,
    });

    expect(payload).toMatchObject({
      title: "TypeScript",
      content: "Contenido",
      categoryId: "tecnologia",
      format: "article",
      tags: ["typescript"],
    });
  });

  it("validates video file contracts", () => {
    const validVideo = new File(["x"], "video.mp4", { type: "video/mp4" });
    const ambiguousMobileVideo = new File(["x"], "mobile.mp4", { type: "application/octet-stream" });
    const invalidVideo = new File(["x"], "video.mov", { type: "video/quicktime" });

    expect(validateVideoFile(validVideo)).toBeNull();
    expect(validateVideoFile(ambiguousMobileVideo)).toBeNull();
    expect(validateVideoFile(invalidVideo)).toContain("MP4");
  });

  it("validates publication form bounds and limits", () => {
    // Title too long
    expect(validatePublicationForm({
      title: "a".repeat(101),
      content: "content",
      categoryId: "tech",
      format: "article",
      tags: [],
      videoUrl: null,
    }).title).toContain("100 caracteres");

    // Content too long
    expect(validatePublicationForm({
      title: "title",
      content: "a".repeat(1001),
      categoryId: "tech",
      format: "article",
      tags: [],
      videoUrl: null,
    }).content).toContain("1000 caracteres");

    // Too many tags
    expect(validatePublicationForm({
      title: "title",
      content: "content",
      categoryId: "tech",
      format: "article",
      tags: ["1", "2", "3", "4", "5", "6"],
      videoUrl: null,
    }).tags).toContain("5 etiquetas");

    // Tag too long
    expect(validatePublicationForm({
      title: "title",
      content: "content",
      categoryId: "tech",
      format: "article",
      tags: ["a".repeat(31)],
      videoUrl: null,
    }).tags).toContain("30 caracteres");

    // Validation no longer requires videoUrl to be present if format is video, it allows text-only fallback
  });

  it("handles empty values and format inference", () => {
    const empty = createEmptyPublicationFormValues();
    expect(empty.title).toBe("");
    expect(empty.videoUrl).toBeNull();

    expect(inferPublicationFormat("video.mp4")).toBe("video");
    expect(inferPublicationFormat(null)).toBe("article");

    const formValues = getPublicationFormValues({
      id: "1",
      content: "some content",
      title: "some title",
      categoryId: "cat-1",
      videoUrl: "video.mp4",
      createdAt: "2026-07-09",
      likesCount: 0,
      dislikesCount: 0,
      sharesCount: 0,
    });
    expect(formValues.title).toBe("some title");
    expect(formValues.format).toBe("video");
  });

  it("validates video file size constraints", () => {
    const hugeVideo = {
      name: "huge.mp4",
      type: "video/mp4",
      size: 100 * 1024 * 1024 + 1,
    } as File;

    expect(validateVideoFile(hugeVideo)).toContain("100 MB");
  });

  it("resolves video duration in jsdom environment", async () => {
    const file = new File(["x"], "video.mp4", { type: "video/mp4" });
    
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();

    const originalCreateElement = document.createElement.bind(document);
    
    // Test success duration
    document.createElement = vi.fn().mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === "video") {
        Object.defineProperty(el, "duration", {
          get() { return 120; }
        });
        setTimeout(() => {
          if (el.onloadedmetadata) el.onloadedmetadata({} as Event);
        }, 10);
      }
      return el;
    });

    const duration = await readVideoDuration(file);
    expect(duration).toBe(120);

    // Test error branch
    document.createElement = vi.fn().mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === "video") {
        setTimeout(() => {
          if (el.onerror) el.onerror(new Event("error"));
        }, 10);
      }
      return el;
    });

    const errorDuration = await readVideoDuration(file);
    expect(errorDuration).toBeNull();

    // Test too long video duration validation
    document.createElement = vi.fn().mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === "video") {
        Object.defineProperty(el, "duration", {
          get() { return 10 * 60 + 1; }
        });
        setTimeout(() => {
          if (el.onloadedmetadata) el.onloadedmetadata({} as Event);
        }, 10);
      }
      return el;
    });

    const tooLongVal = await validateVideoDuration(file);
    expect(tooLongVal).toContain("10 minutos");

    // Test valid video duration validation (not null and <= max seconds)
    document.createElement = vi.fn().mockImplementation((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === "video") {
        Object.defineProperty(el, "duration", {
          get() { return 120; }
        });
        setTimeout(() => {
          if (el.onloadedmetadata) el.onloadedmetadata({} as Event);
        }, 10);
      }
      return el;
    });

    const validDurationVal = await validateVideoDuration(file);
    expect(validDurationVal).toBeNull();

    // Clean up
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
  });

  it("returns null for readVideoDuration if document or URL is undefined", async () => {
    const file = new File(["x"], "video.mp4", { type: "video/mp4" });
    const originalURL = global.URL;
    
    // @ts-expect-error: URL must be temporarily deleted to mock non-browser environments
    delete global.URL;

    const duration = await readVideoDuration(file);
    expect(duration).toBeNull();

    global.URL = originalURL;
  });
});
