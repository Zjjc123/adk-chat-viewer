import React from 'react';
import { Group, Text, rem, useMantineTheme } from '@mantine/core';
import { Dropzone, FileRejection } from '@mantine/dropzone';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';

interface FileUploadDropzoneProps {
  onDrop: (files: File[]) => void;
  onReject?: (fileRejections: FileRejection[]) => void;
  mimeTypes?: Record<string, string[]>;
  remainingSlots?: number;
  multiple?: boolean;
}

export function FileUploadDropzone({
  onDrop,
  onReject,
  mimeTypes,
  remainingSlots = 1,
  multiple = false,
}: FileUploadDropzoneProps) {
  const theme = useMantineTheme();

  return (
    <Dropzone
      onDrop={onDrop}
      onReject={onReject}
      maxSize={30 * 1024 * 1024} // 30MB
      accept={mimeTypes}
      multiple={multiple}
      styles={{
        root: {
          borderWidth: '2px',
          borderStyle: 'dashed',
          borderColor: 'var(--mantine-color-blue-4)',
          backgroundColor: 'var(--mantine-color-blue-0)'
        }
      }}
    >
      <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
            stroke={1.5}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
            stroke={1.5}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconFile
            style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-dimmed)' }}
            stroke={1.5}
          />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag files here or click to select
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            {remainingSlots > 0
              ? `Attach up to ${remainingSlots} file${remainingSlots !== 1 ? 's' : ''}`
              : 'Maximum number of files reached'}
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
} 