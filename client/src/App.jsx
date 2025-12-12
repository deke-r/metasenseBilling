import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MGDashboard from "./pages/MGDashboard";
import Invoice from "./pages/Invoice";
import ViewInvoices from "./pages/ViewInvoices";
import ViewApprovals from "./pages/ViewApprovals";
import ViewHistory from "./pages/ViewHistory";
import AMViewHistory from "./pages/AMViewHistory";
import ChangePassword from "./pages/ChangePassword";
import PaymentForm from "./pages/PaymentForm";
import ReceiptForm from "./pages/ReceiptForm";
import AccountInvoiceForm from "./pages/AccountInvoiceForm";
import EditPaymentForm from "./pages/EditPaymentForm";
import EditReceiptForm from "./pages/EditReceiptForm";
import EditAccountInvoiceForm from "./pages/EditAccountInvoiceForm";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Assistant Manager (AM) Routes */}
          <Route
            path="/dashboard/am"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice/new"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <Invoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/new"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <PaymentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt/new"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <ReceiptForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-invoice/new"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <AccountInvoiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/am-view-history"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <AMViewHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <EditPaymentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <EditReceiptForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-invoice/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['AM']}>
                <EditAccountInvoiceForm />
              </ProtectedRoute>
            }
          />

          {/* Manager (MG) Routes */}
          <Route
            path="/dashboard/mg"
            element={
              <ProtectedRoute allowedRoles={['MG']}>
                <MGDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-approvals"
            element={
              <ProtectedRoute allowedRoles={['MG']}>
                <ViewApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-history"
            element={
              <ProtectedRoute allowedRoles={['MG']}>
                <ViewHistory />
              </ProtectedRoute>
            }
          />

          {/* Shared Routes (AM & MG) */}
          <Route
            path="/view-invoices"
            element={
              <ProtectedRoute allowedRoles={['AM', 'MG']}>
                <ViewInvoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRoles={['AM', 'MG']}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Catch all for 404 or unauthorized access attempts not caught by ProtectedRoute logic usually handled by a * route, but for now strict Routing is fine */}
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
