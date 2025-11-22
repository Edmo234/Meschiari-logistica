import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        navigate(profile.user_type === "cliente" ? "/cliente" : "/entregador");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="text-center max-w-4xl">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-primary mb-4">🍔 DeliveryApp</h1>
          <p className="text-2xl text-muted-foreground mb-2">
            Entregas rápidas e seguras
          </p>
          <p className="text-lg text-muted-foreground">
            Conectando clientes e entregadores
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">👤 Para Clientes</CardTitle>
              <CardDescription>Faça pedidos de entrega com facilidade</CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-2">
              <p>✓ Crie pedidos rapidamente</p>
              <p>✓ Acompanhe suas entregas</p>
              <p>✓ Histórico completo</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">🏍️ Para Entregadores</CardTitle>
              <CardDescription>Aceite entregas e ganhe dinheiro</CardDescription>
            </CardHeader>
            <CardContent className="text-left space-y-2">
              <p>✓ Veja pedidos disponíveis</p>
              <p>✓ Aceite entregas em tempo real</p>
              <p>✓ Gerencie suas entregas</p>
            </CardContent>
          </Card>
        </div>

        <Button size="lg" className="text-lg px-8" onClick={() => navigate("/auth")}>
          Começar Agora
        </Button>
      </div>
    </div>
  );
};

export default Index;
