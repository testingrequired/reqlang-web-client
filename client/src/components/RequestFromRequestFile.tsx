import { ParseResult } from "reqlang-types";
import { CopyCode } from "./CopyCode";

type Props = {
  result: ParseResult;
  requestFileText: string;
};

export const RequestFromRequestFile = ({ result, requestFileText }: Props) => {
  const requestSpan = result.full.request[1];
  const requestText = requestFileText.slice(requestSpan.start, requestSpan.end);

  return <CopyCode>{requestText}</CopyCode>;
};
