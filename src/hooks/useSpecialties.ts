import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Specialty } from "../types";

export const useSpecialties = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSpecialties = async () => {
      try {
        const data = await api.specialties.list();
        if (mounted) {
          setSpecialties(data);
        }
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSpecialties();
    return () => {
      mounted = false;
    };
  }, []);

  return { specialties, loading };
};
