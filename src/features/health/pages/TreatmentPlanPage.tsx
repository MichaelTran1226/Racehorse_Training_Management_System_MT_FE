import { Navigate, useParams } from "react-router-dom";

export default function TreatmentPlanPage() {
  const { id } = useParams();
  if (id) {
    return <Navigate to={`/medical/records/${id}`} replace />;
  }
  return <Navigate to="/medical/records" replace />;
}
