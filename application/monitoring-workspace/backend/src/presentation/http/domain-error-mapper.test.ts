import { describe, expect, it } from "vitest";
import { DomainError, ErrorCode } from "../../domain/error-codes.js";
import { DomainErrorMapper } from "./domain-error-mapper.js";

describe("DomainErrorMapper", () => {
  it("maps known domain errors", () => {
    expect(DomainErrorMapper.toHttpResponse(new DomainError(ErrorCode.NotFound))).toEqual({
      statusCode: 404,
      body: {
        error: ErrorCode.NotFound,
        message: ErrorCode.NotFound,
      },
    });

    expect(DomainErrorMapper.toHttpResponse(new DomainError(ErrorCode.InvalidDetectionConfidence))).toEqual({
      statusCode: 400,
      body: {
        error: ErrorCode.InvalidDetectionConfidence,
        message: ErrorCode.InvalidDetectionConfidence,
      },
    });
  });

  it("falls back for unknown errors", () => {
    expect(DomainErrorMapper.toHttpResponse(new Error("boom"))).toEqual({
      statusCode: 500,
      body: {
        error: "INTERNAL_SERVER_ERROR",
      },
    });
  });
});
