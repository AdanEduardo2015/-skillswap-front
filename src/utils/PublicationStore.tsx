import { create } from "zustand";
import type { PublicationFormat } from "../types";

export interface PublicationData {
  title: string | null;
  text: string | null;
  categoryId: string | null;
  format: PublicationFormat;
  tags: string[];
  video: string | null;
}

export interface PublicationStore extends PublicationData {
  setTitle: (title: string | null) => void;
  setText: (text: string | null) => void;
  setCategoryId: (categoryId: string | null) => void;
  setFormat: (format: PublicationFormat) => void;
  setTags: (tags: string[]) => void;
  setVideo: (video: string | null) => void;
  resetPublication: () => void;
}

export const usePublicationData = create<PublicationStore>()((set) => ({
  title: null,
  text: null,
  categoryId: null,
  format: "article",
  tags: [],
  video: null,

  setTitle: (title) => set({ title }),
  setText: (text) => set({ text }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setFormat: (format) => set({ format }),
  setTags: (tags) => set({ tags }),
  setVideo: (video) => set({ video }),

  resetPublication: () =>
    set({
      title: null,
      text: null,
      categoryId: null,
      format: "article",
      tags: [],
      video: null,
    }),
}));
