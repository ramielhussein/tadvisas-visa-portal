import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeadManagement = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to consolidated CRM page at /crm
    navigate("/crm", { replace: true });
  }, [navigate]);

  return null;
};

export default LeadManagement;
