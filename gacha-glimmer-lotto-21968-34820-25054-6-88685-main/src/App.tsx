import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Shop from "./pages/Shop";
import Leaderboard from "./pages/Leaderboard";
import Auth from "./pages/Auth";
import Recharge from "./pages/Recharge";
import RoulettePlay from "./pages/RoulettePlay";
import AdminPage from "./pages/Admin";
import StockManagement from "./pages/admin/StockManagement";
import UserManagementPage from "./pages/admin/UserManagement";
import PurchaseHistory from "./pages/PurchaseHistory";
import BoxDetails from "./pages/BoxDetails";
import Thanks from "./pages/Thanks";
import NotFound from "./pages/NotFound";
import { DeliveryNoticePopup } from "./components/DeliveryNoticePopup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DeliveryNoticePopup />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/loja" element={<Shop />} />
          <Route path="/rank" element={<Leaderboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/recarga" element={<Recharge />} />
          <Route path="/roleta/:id" element={<RoulettePlay />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/stock" element={<StockManagement />} />
          <Route path="/historico-compras" element={<PurchaseHistory />} />
          <Route path="/box/:id" element={<BoxDetails />} />
          <Route path="/thanks" element={<Thanks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;