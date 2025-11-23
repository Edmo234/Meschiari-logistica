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

const Cliente = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

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

    if (!profileData || profileData.user_type !== "cliente") {
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
        .eq("customer_id", profileData.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
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
            <h1 className="text-4xl font-bold text-primary">🍔 DeliveryApp</h1>
            <p className="text-muted-foreground mt-2">Bem-vindo, {profile?.name}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
            <CardHeader>
            <CardTitle>Minhas Entregas</CardTitle>
            <CardDescription>Acompanhe suas entregas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma entrega ainda
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
  );
};

export default Cliente;
