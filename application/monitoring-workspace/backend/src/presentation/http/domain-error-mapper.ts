import { DomainError, ErrorCode } from "../../domain/error-codes.js";

interface ErrorResponseBody {
  readonly error: string;
  readonly message?: string;
}

interface HttpErrorResponse {
  readonly statusCode: number;
  readonly body: ErrorResponseBody;
}

export class DomainErrorMapper {
  public static toHttpResponse(error: unknown): HttpErrorResponse {
    if (!(error instanceof DomainError)) {
      return {
        statusCode: 500,
        body: { error: "INTERNAL_SERVER_ERROR" },
      };
    }

    switch (error.code) {
      case ErrorCode.NotFound:
        return DomainErrorMapper.response(404, error);
      case ErrorCode.TenantMismatch:
        return DomainErrorMapper.response(403, error);
      default:
        return DomainErrorMapper.response(400, error);
    }
  }

  private static response(statusCode: number, error: DomainError): HttpErrorResponse {
    return {
      statusCode,
      body: {
        error: error.code,
        message: error.message,
      },
    };
  }
}
