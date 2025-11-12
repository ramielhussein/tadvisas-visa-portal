import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache sales team data
export const useSalesTeam = () => {
  return useQuery({
    queryKey: ["salesTeam"],
    queryFn: async () => {
      const { data: profilesData, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, permissions")
        .order("email");

      if (error) throw error;

      // Filter for users with sales/deals permissions or lead assignment permissions
      const salesUsers = (profilesData || []).filter((user: any) => {
        const permissions = user.permissions as any;
        return (
          permissions?.leads?.assign === true ||
          permissions?.deals?.create === true ||
          permissions?.deals?.edit === true
        );
      });

      return salesUsers;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Cache lead sources data
export const useLeadSources = () => {
  return useQuery({
    queryKey: ["leadSources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_sources")
        .select("id, source_name")
        .eq("is_active", true)
        .order("sort_order")
        .order("source_name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Cache inquiry packages data
export const useInquiryPackages = () => {
  return useQuery({
    queryKey: ["inquiryPackages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiry_packages")
        .select("id, package_name")
        .eq("is_active", true)
        .order("sort_order")
        .order("package_name");

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
