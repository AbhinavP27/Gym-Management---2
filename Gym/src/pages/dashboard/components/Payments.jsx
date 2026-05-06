import DashboardLayout from "../layouts/DashboardLayout";
import ComingSoon from "./ComingSoon";

const Payments = ({ role }) => {
  return (
    <DashboardLayout role={role}>
      <ComingSoon
        title="Payments"
        message="Payment and billing management will arrive soon."
      />
    </DashboardLayout>
  );
};

export default Payments;
