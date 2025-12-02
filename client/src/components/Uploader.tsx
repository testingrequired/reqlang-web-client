import { useState } from "react";
import "./Uploader.css";
import { Card, Text } from "@mantine/core";

export type UploadedFile = {
  fileName: string;
  text: string;
};

type Props = {
  onUpload?: (uploadedFile: UploadedFile) => void;
};

const DragDropFileReader: React.FC<Props> = (props) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        props?.onUpload?.call(null, {
          fileName: file.name,
          text: e.target?.result as string,
        });
      };

      reader.readAsText(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed p-6 rounded-lg ${
        dragging ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <Card p="xl" withBorder>
        <Text m={0} style={{ cursor: "default" }}>
          📄 Drag & drop to load a request file
        </Text>

        <input type="file" className="hidden" data-testid="uploader" />
      </Card>
    </div>
  );
};

export default DragDropFileReader;
