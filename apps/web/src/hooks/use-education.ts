"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Course } from "@/lib/types";

export function useCourses() {
  return useQuery({
    queryKey: ["education", "courses"],
    queryFn: () => api.get<Course[]>("/education/courses"),
  });
}
