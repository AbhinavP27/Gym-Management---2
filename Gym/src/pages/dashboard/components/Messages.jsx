import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoon from "./ComingSoon";

const Reports = () => {
  return (
    <DashboardLayout role = "trainer" >
      <ComingSoon
        title="Messages"
        message="Message functionality is coming soon."
      />
    </DashboardLayout>
  );
};

export default Reports;
