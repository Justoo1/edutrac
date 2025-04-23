"use client";

import { useEffect, useState } from 'react';
import { SelectSchool } from '@/lib/schema';
import { useSession } from 'next-auth/react';

export const useSchool = () => {
  const { data: session } = useSession();
  const [school, setSchool] = useState<SelectSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        if (!session?.user?.schoolId) {
          setError('No school ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/schools/${session.user.schoolId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch school information');
        }

        const data = await response.json();
        setSchool(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [session?.user?.schoolId]);

  return {
    school,
    loading,
    error,
    schoolType: school?.schoolType as 'BASIC' | 'SHS' | undefined,
  };
}; 