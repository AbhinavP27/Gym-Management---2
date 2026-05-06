import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoon from "./ComingSoon";

const Reports = () => {
  return (
    <DashboardLayout role="admin">
      <ComingSoon
        title="Reports"
        message="Insights and exports are on the way. Thanks for your patience."
      />
    </DashboardLayout>
  );
};

export default Reports;
