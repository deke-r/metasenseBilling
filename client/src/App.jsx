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
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard/am"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/mg"
            element={
              <ProtectedRoute>
                <MGDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice/new"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-invoices"
            element={
              <ProtectedRoute>
                <ViewInvoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/new"
            element={
              <ProtectedRoute>
                <PaymentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt/new"
            element={
              <ProtectedRoute>
                <ReceiptForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-invoice/new"
            element={
              <ProtectedRoute>
                <AccountInvoiceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-approvals"
            element={
              <ProtectedRoute>
                <ViewApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view-history"
            element={
              <ProtectedRoute>
                <ViewHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/am-view-history"
            element={
              <ProtectedRoute>
                <AMViewHistory />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
