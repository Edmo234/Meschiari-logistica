import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"cliente" | "empresa" | "entregador">("cliente");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("user_id", data.user.id)
            .single();

          if (profile) {
            // Verificar se o tipo de conta corresponde ao selecionado
            if (profile.user_type !== userType) {
              toast.error(`Esta conta é do tipo ${profile.user_type}. Por favor, selecione o tipo correto.`);
              await supabase.auth.signOut();
              return;
            }

            const routes = {
              cliente: "/cliente",
              empresa: "/empresa",
              entregador: "/entregador"
            };
            navigate(routes[profile.user_type as keyof typeof routes]);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              phone,
              user_type: userType,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            user_id: data.user.id,
            name,
            phone,
            user_type: userType,
          });

          if (profileError) throw profileError;

          toast.success("Cadastro realizado com sucesso!");
          const routes = {
            cliente: "/cliente",
            empresa: "/empresa",
            entregador: "/entregador"
          };
          navigate(routes[userType]);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            🚚 Meschiari Logistica
          </CardTitle>
          <CardDescription>
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-3">
              <Label>Tipo de conta</Label>
              <RadioGroup value={userType} onValueChange={(value: any) => setUserType(value)}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="cliente" id="cliente" />
                  <Label htmlFor="cliente" className="cursor-pointer flex-1">
                    Cliente - Receber entregas
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="empresa" id="empresa" />
                  <Label htmlFor="empresa" className="cursor-pointer flex-1">
                    Empresa - Solicitar entregas
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="entregador" id="entregador" />
                  <Label htmlFor="entregador" className="cursor-pointer flex-1">
                    Entregador - Realizar entregas
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {!isLogin && (
              <></>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
