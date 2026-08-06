import { describe, expect, it } from "vitest";
import {
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASON_MAX_LENGTH,
  buildReportPayload,
  createEmptyReportFormValues,
  hasReportFormErrors,
  validateReportForm,
} from "./reportForm";

describe("report form", () => {
  it("starts with a valid default reason", () => {
    const errors = validateReportForm(createEmptyReportFormValues());

    expect(hasReportFormErrors(errors)).toBe(false);
  });

  it("validates required reason and backend text limits", () => {
    const errors = validateReportForm({
      reason: "",
      description: "x".repeat(REPORT_DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(errors.reason).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(hasReportFormErrors(errors)).toBe(true);

    expect(
      validateReportForm({
        reason: "x".repeat(REPORT_REASON_MAX_LENGTH + 1),
        description: "",
      }).reason
    ).toBeTruthy();
  });

  it("builds backend payload with trimmed values and optional description", () => {
    expect(
      buildReportPayload("publication", " pub-1 ", {
        reason: " Spam ",
        description: "  ",
      })
    ).toEqual({
      targetType: "publication",
      targetId: "pub-1",
      reason: "Spam",
    });

    expect(
      buildReportPayload("comment", "comment-1", {
        reason: "Acoso",
        description: " Detalle ",
      })
    ).toEqual({
      targetType: "comment",
      targetId: "comment-1",
      reason: "Acoso",
      description: "Detalle",
    });
  });
});
