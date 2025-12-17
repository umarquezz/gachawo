import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Package, Mail, Lock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  external_id: string;
  status: string;
  delivery_status: string;
  amount: number;
  customer_email: string;
  created_at: string;
  product_id: string;
  account_id: number | null;
  accounts: {
    email: string;
    password: string;
  } | null;
}

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPurchaseHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.email) {
          navigate('/auth');
          return;
        }

        setUserEmail(user.email);

        // Fetch orders from Supabase
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            external_id,
            status,
            delivery_status,
            amount,
            customer_email,
            created_at,
            product_id,
            account_id,
            accounts!account_id (
              email,
              password
            )
          `)
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to handle accounts as single object or null
        const transformedData = (data || []).map(order => ({
          ...order,
          accounts: Array.isArray(order.accounts) ? order.accounts[0] || null : order.accounts
        }));

        setOrders(transformedData);
      } catch (err) {
        console.error('Error loading purchase history:', err);
        setError('Erro ao carregar histórico de compras. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseHistory();
  }, [navigate]);

  function getStatusBadge(order: Order) {
    const isDelivered = 
      order.delivery_status === 'delivered' || 
      ['completed', 'paid', 'approved'].includes(order.status.toLowerCase());

    if (isDelivered) {
      return <Badge className="bg-green-500">Entregue</Badge>;
    }
    
    if (order.status === 'failed' || order.delivery_status === 'error') {
      return <Badge variant="destructive">Falhou</Badge>;
    }

    return <Badge variant="secondary">Pendente</Badge>;
  }

  function formatAmount(amount: number): string {
    // If amount is in cents, convert to reais
    const value = amount > 1000 ? amount / 100 : amount;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full mb-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Histórico de Compras
            </h1>
            <p className="text-purple-200">
              Acompanhe todas as suas transações e entregas
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {orders.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-purple-300" />
              <p className="text-xl text-white mb-2">
                Nenhuma compra encontrada
              </p>
              <p className="text-purple-200">
                Suas compras aparecerão aqui após a conclusão
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isDelivered = order.delivery_status === 'delivered';
              const hasCredentials = order.accounts && isDelivered;

              return (
                <Card key={order.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          {order.product_id || 'Produto'}
                        </CardTitle>
                        <CardDescription className="text-purple-200 mt-1">
                          ID: {order.external_id}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-purple-100">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="text-2xl font-bold text-white">
                      {formatAmount(order.amount)}
                    </div>

                    {hasCredentials && (
                      <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg space-y-2">
                        <p className="text-sm font-semibold text-green-400 mb-3">
                          ✅ Conta Entregue - Credenciais:
                        </p>
                        <div className="flex items-center gap-2 text-white">
                          <Mail className="h-4 w-4 text-green-400" />
                          <span className="text-sm">
                            <span className="text-green-400 font-medium">Email:</span>{' '}
                            {order.accounts.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <Lock className="h-4 w-4 text-green-400" />
                          <span className="text-sm">
                            <span className="text-green-400 font-medium">Senha:</span>{' '}
                            {order.accounts.password}
                          </span>
                        </div>
                      </div>
                    )}

                    {!isDelivered && (
                      <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-200">
                          ⏳ Aguardando confirmação do pagamento...
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
