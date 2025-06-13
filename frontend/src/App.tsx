
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import Dashboard from "./pages/DashboardPage";
import Purchases from "./pages/PurchasesPage";
import Transfers from "./pages/TransfersPage";
import Assignments from "./pages/AssignmentsPage";
import Expenditures from "./pages/ExpendituresPage";
import Unauthorized from "./pages/UnauthorizedPage";
import NotFound from "./pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route 
                path="purchases" 
                element={
                  <ProtectedRoute requiredRoles={['Admin', 'Logistics Officer']}>
                    <Purchases />
                  </ProtectedRoute>
                } 
              />
              <Route path="transfers" element={<Transfers />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="expenditures" element={<Expenditures />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
