import { api } from "../services/api";

export const sanitizeFileName = (fileName: string): string => {
    return fileName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .toLowerCase();
};

export const uploadFile = async (file: File, type: "publications" | "profile"): Promise<string | null> => {
    try {
        const { uploadUrl, fileUrl } = await api.media.getPresignedUrl(
            sanitizeFileName(file.name),
            file.type,
            type
        );

        await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
                "Content-Type": file.type,
            },
        });

        return fileUrl;
    } catch (err) {
        throw err;
    }
};
