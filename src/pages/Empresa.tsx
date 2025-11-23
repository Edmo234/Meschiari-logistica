import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Empresa = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profileData || profileData.user_type !== "empresa") {
      navigate("/auth");
      return;
    }

    setProfile(profileData);
  };

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileData) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("empresa_id", profileData.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) throw new Error("Perfil não encontrado");

      // Create or find customer profile
      let customerId = null;
      const { data: existingCustomer } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", customerName)
        .eq("user_type", "cliente")
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }

      const { error } = await supabase.from("orders").insert({
        empresa_id: profileData.id,
        customer_id: customerId,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        description,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Solicitação de entrega criada com sucesso!");
      setPickupAddress("");
      setDeliveryAddress("");
      setDescription("");
      setCustomerName("");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar solicitação");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: { variant: "secondary", text: "Pendente" },
      accepted: { variant: "default", text: "Aceito" },
      delivered: { variant: "default", text: "Entregue" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">🚚 Meschiari Logistica</h1>
            <p className="text-muted-foreground mt-2">Bem-vindo, {profile?.name}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nova Solicitação de Entrega</CardTitle>
              <CardDescription>Crie uma solicitação para entregadores</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Nome do Cliente</Label>
                  <Input
                    id="customer"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup">Endereço de Coleta</Label>
                  <Input
                    id="pickup"
                    placeholder="Rua, número, bairro..."
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery">Endereço de Entrega</Label>
                  <Input
                    id="delivery"
                    placeholder="Rua, número, bairro..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Pedido</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que será entregue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar Solicitação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minhas Solicitações</CardTitle>
              <CardDescription>Acompanhe suas solicitações de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma solicitação ainda
                  </p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{order.description}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>📍 Coleta: {order.pickup_address}</p>
                        <p>📍 Entrega: {order.delivery_address}</p>
                        <p className="text-xs">
                          {new Date(order.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Empresa;
