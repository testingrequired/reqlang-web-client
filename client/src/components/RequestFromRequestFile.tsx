import { ParseResult } from "reqlang-types";
import { CopyCode } from "@/components/CopyCode";
import { ReactNode } from "react";
import { getRequestFromRequestFile } from "@/services/requestFile";

type Props = {
  parseResult: ParseResult;
  requestFileText: string;
  renderText?: (text: string) => ReactNode;
};

export const RequestFromRequestFile = ({
  parseResult: result,
  requestFileText,
  renderText = (text: string) => text,
}: Props) => {
  const requestText = getRequestFromRequestFile(result, requestFileText);

  const codeText = renderText ? renderText(requestText) : requestText;

  return <CopyCode text={requestText}>{codeText}</CopyCode>;
};
