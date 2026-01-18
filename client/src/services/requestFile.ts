import { ParseResult } from "reqlang-types";

export function getRequestFromRequestFile(
  parseResult: ParseResult,
  requestFileText: string
): string {
  const requestSpan = parseResult.full.request[1];
  const requestText = requestFileText.slice(requestSpan.start, requestSpan.end);

  return requestText;
}
