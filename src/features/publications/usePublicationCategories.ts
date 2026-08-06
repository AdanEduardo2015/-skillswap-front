import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { Category } from "../../types";
import { FALLBACK_PUBLICATION_CATEGORIES } from "./publicationForm";

export const usePublicationCategories = () => {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_PUBLICATION_CATEGORIES);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadCategories = async () => {
      try {
        const result = await api.categories.list();
        const activeCategories = result.filter((category) => category.isActive !== false);

        const apiCatMap = new Map<string, Category>();
        activeCategories.forEach((cat) => apiCatMap.set(cat.id, cat));

        const merged: Category[] = [];
        const seenIds = new Set<string>();

        FALLBACK_PUBLICATION_CATEGORIES.forEach((fbCat) => {
          seenIds.add(fbCat.id);
          const apiVer = apiCatMap.get(fbCat.id);
          if (!apiVer || apiVer.isActive !== false) {
            merged.push(
              apiVer
                ? { ...fbCat, ...apiVer, description: apiVer.description || fbCat.description }
                : fbCat
            );
          }
        });

        activeCategories.forEach((apiCat) => {
          if (!seenIds.has(apiCat.id)) {
            seenIds.add(apiCat.id);
            merged.push(apiCat);
          }
        });

        if (isActive && merged.length > 0) {
          setCategories(merged);
        }
      } catch {
        if (isActive) {
          setCategories(FALLBACK_PUBLICATION_CATEGORIES);
        }
      } finally {
        if (isActive) setIsLoadingCategories(false);
      }
    };

    void loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

  return { categories, isLoadingCategories };
};
