
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NovaEntrega from "./pages/NovaEntrega";
import Entregas from "./pages/Entregas";
import Rota from "./pages/Rota";
import Estatisticas from "./pages/Estatisticas";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import RotasConfirmadas from "./pages/RotasConfirmadas";
import ComoUsar from "./pages/ComoUsar";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/nova-entrega" element={
              <ProtectedRoute>
                <NovaEntrega />
              </ProtectedRoute>
            } />
            <Route path="/entregas" element={
              <ProtectedRoute>
                <Entregas />
              </ProtectedRoute>
            } />
            <Route path="/rota" element={
              <ProtectedRoute>
                <Rota />
              </ProtectedRoute>
            } />
            <Route path="/estatisticas" element={
              <ProtectedRoute>
                <Estatisticas />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/rotas-confirmadas" element={
              <ProtectedRoute>
                <RotasConfirmadas />
              </ProtectedRoute>
            } />
            <Route path="/como-usar" element={
              <ProtectedRoute>
                <ComoUsar />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
