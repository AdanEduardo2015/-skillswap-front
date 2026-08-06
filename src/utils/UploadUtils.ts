import { api } from "../services/api";
import { API_BASE_URL, IS_LOCAL_AUTH_ENABLED, LOCAL_AUTH_EMAIL, LOCAL_AUTH_ROLE } from "../config/api";
import { getToken } from "./GlobalVariables";
import { useUserData } from "./UserStore";

export const sanitizeFileName = (fileName: string): string => {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const name = parts.join(".");

  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const cleanExt = (ext ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const finalName = cleanName || "media_file";
  return cleanExt ? `${finalName}.${cleanExt}` : finalName;
};

const contentTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
};

export const getUploadContentType = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type || contentTypeByExtension[extension] || "application/octet-stream";
};

const isLocalBucketUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1"].includes(url.hostname) || url.hostname.endsWith(".localhost");
  } catch {
    return false;
  }
};

const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

const uploadDirectToS3 = async (uploadUrl: string, file: File, contentType: string) => {
  const uploadHeaders: HeadersInit = {};
  if (contentType) uploadHeaders["Content-Type"] = contentType;

  return fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: uploadHeaders,
  });
};

const uploadViaBackendProxy = async (uploadUrl: string, file: File, contentType: string) => {
  const body = {
    uploadUrl,
    contentType,
    fileBase64: await fileToBase64(file),
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = await getToken().catch(() => null);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (IS_LOCAL_AUTH_ENABLED && LOCAL_AUTH_EMAIL) {
    headers["X-Local-User-Email"] = LOCAL_AUTH_EMAIL;
    const currentRole = useUserData.getState().role || LOCAL_AUTH_ROLE;
    if (currentRole) headers["X-Local-User-Role"] = currentRole;
  }

  return fetch(`${API_BASE_URL}/media/upload`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

export const uploadFile = async (file: File, type: "publications" | "profile"): Promise<string | null> => {
  const contentType = getUploadContentType(file);
  const isVideoUpload = type === "publications" || contentType.startsWith("video/");
  let presigned: Awaited<ReturnType<typeof api.media.getPresignedUrl>>;

  try {
    presigned = await api.media.getPresignedUrl(sanitizeFileName(file.name), contentType, type, file.size);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`No se pudo generar la URL de subida: ${detail}`);
  }

  let response: Response;
  try {
    if (isLocalBucketUrl(presigned.uploadUrl) && !isVideoUpload) {
      response = await uploadViaBackendProxy(presigned.uploadUrl, file, contentType);
    } else {
      response = await uploadDirectToS3(presigned.uploadUrl, file, contentType);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error de red o CORS";
    throw new Error(`No se pudo subir el archivo a S3: ${detail}`);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`No se pudo subir el archivo a S3 (${response.status})${detail ? `: ${detail}` : ""}`);
  }

  return presigned.fileUrl;
};
