import { ParseResult } from "reqlang-types";
import { CopyCode } from "./CopyCode";
import { ReactNode } from "react";

type Props = {
  result: ParseResult;
  requestFileText: string;
  renderText?: (text: string) => ReactNode;
};

export const RequestFromRequestFile = ({
  result,
  requestFileText,
  renderText = (text: string) => text,
}: Props) => {
  const requestSpan = result.full.request[1];
  const requestText = requestFileText.slice(requestSpan.start, requestSpan.end);

  const codeText = renderText ? renderText(requestText) : requestText;

  return <CopyCode text={requestText}>{codeText}</CopyCode>;
};
