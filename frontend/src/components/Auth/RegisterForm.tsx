
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { cleanupAuthState } from '@/integrations/supabase/client';

interface RegisterFormProps {
  onRegister?: (userData: {
    nome: string;
    email: string;
    senha: string;
    tipo?: 'motoboy' | 'motorista';
    selfieUrl?: string | null;
    placaVeiculo?: string;
  }) => Promise<void>;
  planoSelecionado?: {
    nome: string;
    entregas_dia_max: number;
    saldo_creditos: number;
  };
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, planoSelecionado }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmar: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.senha !== form.confirmar) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      const supabase = (window as any).supabase;
      if (!supabase) {
        toast({ 
          title: "Erro de conexão", 
          description: "Não foi possível conectar ao servidor",
          variant: "destructive"
        });
        return;
      }

      // Clean up any existing auth state
      cleanupAuthState();
      
      // Try global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Global sign out failed, continuing with registration", err);
      }

      if (onRegister) {
        await onRegister({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
        });
      } else {
        // Create user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.senha,
          options: {
            data: { 
              nome: form.nome,
              ...(planoSelecionado ? {
                plano_nome: planoSelecionado.nome,
                plano_ativo: true
              } : {})
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session?.user) {
          // Create profile in usuarios_rotaspeed table with plan info
          const profileData = {
            id: data.session.user.id,
            nome: form.nome,
            plano_nome: planoSelecionado?.nome || 'Start',
            plano_ativo: true,
            entregas_dia_max: planoSelecionado?.entregas_dia_max || 85,
            entregas_hoje: 0,
            ultima_atualizacao: new Date().toISOString(),
            saldo_creditos: planoSelecionado?.saldo_creditos || 0,
            created_at: new Date().toISOString()
          };

          const { error: profileError } = await supabase
            .from('usuarios_rotaspeed')
            .insert([profileData]);

          if (profileError) {
            console.error("Error creating profile:", profileError);
            toast({ 
              title: "Cadastro parcial", 
              description: "Sua conta foi criada, mas houve um erro ao configurar seu plano. Por favor, contate o suporte.",
              variant: "destructive" 
            });
          } else {
            toast({ 
              title: "Cadastro feito", 
              description: "Sua conta foi criada com sucesso" 
            });
            
            setTimeout(() => window.location.href = "/login", 1500);
          }
        } else {
          // If email verification is enabled in Supabase
          toast({ 
            title: "Verifique seu email", 
            description: "Enviamos um link de confirmação para seu email" 
          });
          
          setTimeout(() => window.location.href = "/login", 1500);
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Erro no cadastro", 
        description: error?.message || "Ocorreu um erro ao criar sua conta", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
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
      toast({ title: "Erro com Google", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Nome completo" name="nome" onChange={handleChange} required />
      <Input type="email" placeholder="E-mail" name="email" onChange={handleChange} required />
      <Input type="password" placeholder="Senha" name="senha" onChange={handleChange} required />
      <Input type="password" placeholder="Confirmar senha" name="confirmar" onChange={handleChange} required />
      
      {planoSelecionado && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-sm font-medium text-blue-700 mb-1">Plano selecionado: {planoSelecionado.nome}</p>
          <p className="text-xs text-blue-600">
            {planoSelecionado.entregas_dia_max} entregas/dia, 
            {planoSelecionado.saldo_creditos > 0 ? ` ${planoSelecionado.saldo_creditos} créditos de voz` : ' sem créditos de voz'}
          </p>
        </div>
      )}
      
      <Button
        type="submit"
        className="w-full bg-rotaspeed-primary hover:bg-blue-700 text-white"
        disabled={loading}
      >
        {loading ? "Cadastrando..." : "Cadastrar"}
      </Button>

      <div className="relative flex items-center justify-center mt-4">
        <div className="border-t border-gray-300 flex-grow"></div>
        <span className="px-2 bg-white text-gray-500 text-sm">ou</span>
        <div className="border-t border-gray-300 flex-grow"></div>
      </div>

      <Button
        type="button"
        onClick={handleGoogle}
        variant="outline"
        className="w-full"
      >
        <Mail className="mr-2" size={18} /> Criar conta com Google
      </Button>

      <p className="text-center text-sm text-gray-600">
        Já tem conta? <Link to="/login" className="text-blue-600 hover:underline">Entrar</Link>
      </p>
    </form>
  );
};

export default RegisterForm;
