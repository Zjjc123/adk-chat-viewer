"use client";

import { useState, useEffect, MouseEvent } from "react";
import { FileUploadDropzone } from "@/components/FileUploadDropzone";
import { FileRejection } from "@mantine/dropzone";
import {
  Box,
  Container,
  Title,
  Text,
  Paper,
  Avatar,
  Divider,
  Alert,
  Group,
  Button,
  Card,
  Collapse,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconDownload,
  IconFile,
  IconFileText,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/markdown-styles.css";

interface InlineData {
  displayName: string;
  data: string;
  mimeType?: string;
}

interface FunctionCall {
  name: string;
  args: Record<string, any>;
  id?: string;
  response?: any;
  author?: string;
}

interface Message {
  role: string;
  content: string;
  timestamp?: string;
  inlineFiles?: InlineData[];
  author?: string;
  functionCalls?: FunctionCall[];
}

interface ChatSession {
  id: string;
  appName: string;
  userId: string;
  state?: any;
  events?: Array<{
    content: {
      parts: Array<any>;
      role: string;
    };
    author?: string;
    invocationId?: string;
    timestamp?: string;
  }>;
}

interface ExpandedState {
  [key: string]: boolean;
}

export default function ADKPage() {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [expandedCalls, setExpandedCalls] = useState<ExpandedState>({});

  const extractInlineData = (part: any): InlineData | null => {
    if (
      part &&
      part.inlineData &&
      part.inlineData.displayName &&
      part.inlineData.data
    ) {
      console.log(
        "Found inlineData with displayName:",
        part.inlineData.displayName
      );
      return {
        displayName: part.inlineData.displayName,
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }

    return null;
  };

  useEffect(() => {
    if (chatSession && chatSession.events) {
      const callMap: Record<string, FunctionCall> = {};

      chatSession.events.forEach((event) => {
        if (event.content && event.content.parts) {
          event.content.parts.forEach((part: any) => {
            // Extract function calls
            if (part.functionCall && part.functionCall.id) {
              callMap[part.functionCall.id] = {
                name: part.functionCall.name,
                args: part.functionCall.args,
                id: part.functionCall.id,
                author: event.author || event.content?.role || "unknown",
              };
            }

            // Extract function responses
            if (part.functionResponse && part.functionResponse.id) {
              if (callMap[part.functionResponse.id]) {
                callMap[part.functionResponse.id].response =
                  part.functionResponse.response;
              } else {
                callMap[part.functionResponse.id] = {
                  name: part.functionResponse.name,
                  args: {},
                  id: part.functionResponse.id,
                  response: part.functionResponse.response,
                };
              }
            }
          });
        }
      });

      const extractedMessages = chatSession.events
        .map((event) => {
          const inlineFiles: InlineData[] = [];
          const functionCalls: FunctionCall[] = [];
          let isResponseOnlyMessage = false;

          // Check for inline data and function calls in parts
          if (event.content && event.content.parts) {
            // Check if this message only contains function responses
            isResponseOnlyMessage = event.content.parts.every(
              (part) =>
                part.functionResponse &&
                !part.functionCall &&
                !part.text &&
                !part.inlineData
            );

            event.content.parts.forEach((part: any) => {
              // Try to extract inline data
              const inlineData = extractInlineData(part);
              if (inlineData) {
                console.log("Adding file:", inlineData.displayName);
                inlineFiles.push(inlineData);
              }

              // Extract function calls
              if (part.functionCall && part.functionCall.id) {
                functionCalls.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args,
                  id: part.functionCall.id,
                });
              }

              // We'll handle function responses in the second pass
            });
          }

          // Skip messages that only contain function responses
          if (isResponseOnlyMessage) {
            return null;
          }

          // Extract text content from parts
          let textContent = "";
          if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
              if (typeof part === "string") {
                textContent = part;
                break;
              } else if (part.text) {
                textContent = part.text;
                break;
              } else if (part.content && typeof part.content === "string") {
                textContent = part.content;
                break;
              }
            }
          }

          // Add function calls with their responses
          const callsWithResponses = functionCalls.map((call) => {
            if (call.id && callMap[call.id] && callMap[call.id].response) {
              return {
                ...call,
                response: callMap[call.id].response,
              };
            }
            return call;
          });

          return {
            role: event.content?.role || "unknown",
            author: event.author || "unknown",
            content: textContent || "",
            timestamp: event.timestamp,
            inlineFiles: inlineFiles.length > 0 ? inlineFiles : undefined,
            functionCalls:
              callsWithResponses.length > 0 ? callsWithResponses : undefined,
          };
        })
        .filter(Boolean) as Message[]; // Filter out null messages and cast to Message[]

      setMessages(extractedMessages);
    }
  }, [chatSession]);

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    try {
      const content = await file.text();
      const jsonData = JSON.parse(content);

      setChatSession(jsonData);
      setError(null);

      // Debug the structure of the JSON
      console.log("Session ID:", jsonData.id);
      console.log("Events count:", jsonData.events?.length || 0);
    } catch (err) {
      setError(
        "Failed to parse JSON file. Please ensure it's a valid ADK session file."
      );
      console.error("Error parsing JSON:", err);
    }
  };

  const handleReject = (fileRejections: FileRejection[]) => {
    setError("Invalid file type. Please upload a JSON file.");
  };

  const getMimeType = (file: InlineData): string => {
    // Use provided mimeType if available
    if (file.mimeType) {
      console.log("Using provided mime type:", file.mimeType);
      return file.mimeType;
    }

    // Try to determine mime type from file extension
    const extension = file.displayName.split(".").pop()?.toLowerCase();

    if (!extension) return "application/octet-stream";

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      txt: "text/plain",
      csv: "text/csv",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      json: "application/json",
      html: "text/html",
      css: "text/css",
      js: "text/javascript",
      xml: "application/xml",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
    };

    return mimeTypes[extension] || "application/octet-stream";
  };

  const saveFile = (file: InlineData) => {
    try {
      // For PDF files, use the server-side approach
      if (file.displayName.toLowerCase().endsWith(".pdf")) {
        // Create a form to submit to a server endpoint that will return the file
        const form = document.createElement("form");
        form.method = "post";
        form.action = "/api/download-pdf";
        form.style.display = "none";

        // Add the file data as a hidden input
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "data";
        input.value = file.data;
        form.appendChild(input);

        // Add the filename as a hidden input
        const nameInput = document.createElement("input");
        nameInput.type = "hidden";
        nameInput.name = "filename";
        nameInput.value = file.displayName;
        form.appendChild(nameInput);

        // Submit the form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        return;
      }

      // For other files, use the standard approach
      const mimeType = getMimeType(file);

      // Clean up the base64 string
      let base64Data = file.data;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      // Create a link with download attribute
      const link = document.createElement("a");
      link.href = `data:${mimeType};base64,${base64Data}`;
      link.download = file.displayName;
      link.style.display = "none";

      // Add to document, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error saving file:", err);
      setError("Failed to save file. The file data may be corrupted.");
    }
  };

  const renderInlineFiles = (files: InlineData[]) => {
    return (
      <Box mt="md" mb="md">
        <Text size="sm" fw={500} mb="xs">
          Attached Files:
        </Text>
        <Group>
          {files.map((file, index) => {
            const isPdf =
              file.mimeType === "application/pdf" ||
              file.displayName.toLowerCase().endsWith(".pdf");

            return (
              <Card key={index} shadow="sm" padding="md" radius="md" withBorder>
                <Group>
                  {isPdf ? (
                    <IconFileText size={20} color="red" />
                  ) : (
                    <IconFile size={20} />
                  )}
                  <Text truncate maw={200} size="sm" title={file.displayName}>
                    {file.displayName}
                  </Text>
                </Group>
                <Button
                  mt="xs"
                  size="xs"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => saveFile(file)}
                  fullWidth
                >
                  Download
                </Button>
              </Card>
            );
          })}
        </Group>
      </Box>
    );
  };

  // Add a function to toggle expanded state
  const toggleFunctionCall = (callId: string) => {
    setExpandedCalls((prev) => ({
      ...prev,
      [callId]: !prev[callId],
    }));
  };

  // Modify the renderFunctionCalls function to fix Mantine component props
  const renderFunctionCalls = (functionCalls: FunctionCall[]) => {
    return (
      <Box mt="md" mb="md">
        <Text size="sm" fw={500} mb="xs">
          Function Calls:
        </Text>
        {functionCalls.map((call, index) => {
          const callId = call.id || `call-${index}`;
          const isExpanded = expandedCalls[callId] || false;

          return (
            <Paper key={index} withBorder p="xs" mb="xs">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    p={0}
                    onClick={() => toggleFunctionCall(callId)}
                  >
                    {isExpanded ? (
                      <IconChevronDown size={16} />
                    ) : (
                      <IconChevronRight size={16} />
                    )}
                  </Button>
                  <Text fw={700} size="sm" color="blue">
                    {call.name}
                  </Text>
                </Group>
                {call.response && (
                  <Text size="xs" c="dimmed">
                    Response available
                  </Text>
                )}
              </Group>

              <Collapse in={isExpanded}>
                <Box mt="xs">
                  <Text size="xs" mt="xs">
                    Arguments:
                  </Text>
                  <Paper
                    bg="gray.1"
                    p="xs"
                    mt="xs"
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                  >
                    {Object.entries(call.args).map(([key, value]) => (
                      <Text key={key} size="xs">
                        {key}:{" "}
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </Text>
                    ))}
                  </Paper>
                  {call.id && (
                    <Text size="xs" mt="xs" c="dimmed">
                      ID: {call.id}
                    </Text>
                  )}

                  {/* Display response if available */}
                  {call.response && (
                    <>
                      <Text size="xs" mt="lg" fw={500}>
                        Response:
                      </Text>
                      <Paper
                        bg="gray.1"
                        p="xs"
                        mt="xs"
                        style={{ maxHeight: "300px", overflow: "auto" }}
                      >
                        {typeof call.response === "object" ? (
                          <Box className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {call.response.result ||
                                JSON.stringify(call.response, null, 2)}
                            </ReactMarkdown>
                          </Box>
                        ) : (
                          <Text size="xs">{call.response}</Text>
                        )}
                      </Paper>
                    </>
                  )}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Box>
    );
  };

  // Add a function to format timestamps correctly
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return "";

    try {
      // Convert the timestamp to a number (it could be in seconds or milliseconds)
      const timestampNum = parseFloat(timestamp);

      // Check if the timestamp is in seconds (Unix epoch) - if it's less than 10^12, it's likely in seconds
      const date =
        timestampNum < 10000000000
          ? new Date(timestampNum * 1000) // Convert seconds to milliseconds
          : new Date(timestampNum); // Already in milliseconds

      return date.toLocaleString();
    } catch (e) {
      console.error("Error parsing timestamp:", e);
      return timestamp; // Return the original timestamp if parsing fails
    }
  };

  const jsonMimeTypes = {
    "application/json": [".json"],
  };

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="lg">
        ADK Chat History Viewer
      </Title>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          mb="md"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {!chatSession && (
        <Box mb="xl">
          <Text mb="md">
            Upload your ADK session JSON file to view the chat history.
          </Text>
          <FileUploadDropzone
            onDrop={handleDrop}
            onReject={handleReject}
            remainingSlots={1}
            mimeTypes={jsonMimeTypes}
            multiple={false}
          />
        </Box>
      )}

      {chatSession && (
        <>
          <Button
            mb="md"
            variant="outline"
            onClick={() => setChatSession(null)}
          >
            Upload Another File
          </Button>
          {messages.length > 0 && (
            <Box>
              <Title order={2} mb="md">
                Chat History
              </Title>
              <Paper withBorder p="md">
                {messages.map((message, index) => (
                  <Box key={index} mb="md">
                    <Group mb="xs" align="flex-start">
                      <Avatar
                        color={message.role === "user" ? "blue" : "green"}
                        radius="xl"
                      >
                        {message.role === "user" ? "U" : "A"}
                      </Avatar>
                      <Box style={{ width: "calc(100% - 50px)" }}>
                        <Text fw={500} mb="xs">
                          {message.role === "user"
                            ? "User"
                            : message.author && message.author !== "user"
                            ? message.author
                            : "ADK Agent"}
                          {message.timestamp && (
                            <Text span size="xs" c="dimmed" ml="xs">
                              {formatTimestamp(message.timestamp)}
                            </Text>
                          )}
                        </Text>
                        <Box className="markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </Box>
                        {message.functionCalls &&
                          message.functionCalls.length > 0 &&
                          renderFunctionCalls(message.functionCalls)}
                        {message.inlineFiles &&
                          message.inlineFiles.length > 0 &&
                          renderInlineFiles(message.inlineFiles)}
                      </Box>
                    </Group>
                    {index < messages.length - 1 && <Divider my="sm" />}
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          {messages.length === 0 && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="No Content Found"
              color="yellow"
              mb="md"
            >
              No chat messages or files were found in the uploaded file.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
}
