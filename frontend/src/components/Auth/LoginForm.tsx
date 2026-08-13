
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, TestTube } from "lucide-react";
import { Link } from "react-router-dom";

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = () => {
    setEmail("teste@rotaspeed.com");
    setSenha("123456");
    toast({
      title: "Credenciais de teste preenchidas",
      description: "Email: teste@rotaspeed.com | Senha: 123456"
    });
  };

  const handleGoogleLogin = async () => {
    const supabase = (window as any).supabase;
    if (!supabase) {
      toast({ 
        title: "Erro de conexão", 
        description: "Não foi possível conectar ao servidor",
        variant: "destructive" 
      });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      toast({
        title: "Erro ao entrar com Google",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (onLogin) {
        await onLogin(email, senha);
      } else {
        await login(email, senha);
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo de volta"
        });
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      toast({ 
        title: "Erro ao entrar", 
        description: error?.message || "Verifique suas credenciais e tente novamente", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Login de Teste</p>
            <p className="text-xs text-blue-600">Use as credenciais de demonstração</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestLogin}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            <TestTube className="mr-1" size={14} />
            Preencher
          </Button>
        </div>
      </div>

      <Input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full"
      />
      <Input
        type="password"
        placeholder="Sua senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
        className="w-full"
      />
      <Button
        type="submit"
        className="w-full bg-rotaspeed-primary text-white hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
        <LogIn className="ml-1" size={18} />
      </Button>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-gray-300 flex-grow"></div>
        <span className="px-2 text-sm text-gray-500">ou</span>
        <div className="border-t border-gray-300 flex-grow"></div>
      </div>

      <Button
        type="button"
        onClick={handleGoogleLogin}
        variant="outline"
        className="w-full"
      >
        <Mail className="mr-2" size={18} /> Entrar com Google
      </Button>

      <div className="text-center mt-4 text-sm text-gray-600">
        Não tem uma conta?{" "}
        <Link to="/registro" className="text-blue-600 hover:underline">
          Criar conta
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
