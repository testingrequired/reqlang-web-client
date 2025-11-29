import { createFileRoute } from "@tanstack/react-router";
import Uploader, { UploadedFile } from "@/components/Uploader";
import { useState } from "react";
import { Code } from "@mantine/core";
import { CloseRequestFileButton } from "@/components/CloseRequestFileButton";

export const Route = createFileRoute("/")({
  component: () => {
    const [loadedRequestFile, setLoadedRequestFile] =
      useState<UploadedFile | null>(null);

    return loadedRequestFile === null ? (
      <Uploader onUpload={setLoadedRequestFile} />
    ) : (
      <LoadedRequestFile
        loadedRequest={loadedRequestFile}
        onClickCloseRequest={() => setLoadedRequestFile(null)}
      />
    );
  },
});

type LoadedRequestFileProps = {
  loadedRequest: UploadedFile;
  onClickCloseRequest: () => void;
};

const LoadedRequestFile: React.FC<LoadedRequestFileProps> = ({
  loadedRequest,
  onClickCloseRequest: handleClearUpload,
}) => {
  return (
    <>
      <div>{loadedRequest.fileName}</div>

      <Code block>{loadedRequest.text}</Code>

      <CloseRequestFileButton onClick={handleClearUpload} />
    </>
  );
};
