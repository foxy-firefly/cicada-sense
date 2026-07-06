import { type ArgumentsHost, Catch, type ExceptionFilter } from "@nestjs/common";
import { DomainError } from "../../domain/error-codes.js";
import { DomainErrorMapper } from "./domain-error-mapper.js";

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  public catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    const mappedResponse = DomainErrorMapper.toHttpResponse(error);
    response.status(mappedResponse.statusCode).json(mappedResponse.body);
  }
}
