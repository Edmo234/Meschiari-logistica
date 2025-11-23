import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Entregador = () => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    if (!profileData || profileData.user_type !== "entregador") {
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
      const { data: available } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const { data: mine } = await supabase
        .from("orders")
        .select("*")
        .eq("delivery_person_id", profileData.id)
        .order("created_at", { ascending: false });

      setAvailableOrders(available || []);
      setMyOrders(mine || []);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          delivery_person_id: profile.id,
          status: "accepted",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido aceito com sucesso!");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar pedido");
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Pedido marcado como entregue!");
      loadOrders();
    } catch (error: any) {
      toast.error(error.message || "Erro ao completar pedido");
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

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">
              Pedidos Disponíveis ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="mine">
              Meus Pedidos ({myOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <div className="grid gap-4">
              {availableOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Nenhum pedido disponível no momento
                  </CardContent>
                </Card>
              ) : (
                availableOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{order.description}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <p className="font-medium mb-1">📍 Endereço de Coleta:</p>
                          <p className="text-muted-foreground">{order.pickup_address}</p>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium mb-1">📍 Endereço de Entrega:</p>
                          <p className="text-muted-foreground">{order.delivery_address}</p>
                        </div>
                        <Button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="w-full mt-4"
                        >
                          Aceitar Pedido
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-6">
            <div className="grid gap-4">
              {myOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Você ainda não aceitou nenhum pedido
                  </CardContent>
                </Card>
              ) : (
                myOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{order.description}</CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <p className="font-medium mb-1">📍 Endereço de Coleta:</p>
                          <p className="text-muted-foreground">{order.pickup_address}</p>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium mb-1">📍 Endereço de Entrega:</p>
                          <p className="text-muted-foreground">{order.delivery_address}</p>
                        </div>
                        {order.status === "accepted" && (
                          <Button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="w-full mt-4"
                          >
                            Marcar como Entregue
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Entregador;
