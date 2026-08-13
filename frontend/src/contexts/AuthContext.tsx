
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { cleanupAuthState } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Get Supabase client
        const supabase = (window as any).supabase;
        if (!supabase) {
          console.error("Supabase client not initialized");
          setLoading(false);
          return;
        }

        // Configure auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log("Auth state changed:", event);
            
            if (session) {
              setIsAuthenticated(true);
              setUser(session.user);
              
              // Fetch user profile data with a small delay to avoid potential deadlocks
              setTimeout(async () => {
                try {
                  const { data: profile, error } = await supabase
                    .from('usuarios_rotaspeed')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                    
                  if (profile && !error) {
                    // Merge profile data with user data
                    setUser({ ...session.user, ...profile });
                  } else if (error) {
                    console.error("Error fetching user profile:", error);
                  }
                } catch (err) {
                  console.error("Error in profile fetch:", err);
                }
              }, 100);
            } else if (event === 'SIGNED_OUT') {
              setIsAuthenticated(false);
              setUser(null);
            }
          }
        );

        // Check for existing session
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.log("Existing session found");
          setIsAuthenticated(true);
          setUser(data.session.user);
          
          // Fetch user profile data
          const { data: profile, error } = await supabase
            .from('usuarios_rotaspeed')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profile && !error) {
            // Merge profile data with user data
            setUser({ ...data.session.user, ...profile });
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }

        // Return cleanup function for the listener
        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Verificar se é o usuário de teste
      if (email === "teste@rotaspeed.com" && password === "123456") {
        // Simular login de teste
        const testUser = {
          id: "test-user-id",
          email: "teste@rotaspeed.com",
          nome: "Usuário de Teste",
          plano_nome: "Premium Inteligente",
          plano_ativo: true,
          entregas_dia_max: 250,
          entregas_hoje: 5,
          saldo_creditos: 100
        };
        
        setIsAuthenticated(true);
        setUser(testUser);
        
        toast({
          title: "Login de teste realizado",
          description: "Bem-vindo ao RotaSpeed (modo teste)"
        });
        
        return;
      }

      const supabase = (window as any).supabase;
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      
      // Clean up any existing auth state to prevent conflicts
      cleanupAuthState();
      
      // Try global sign out first to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
        console.log("Global sign out failed, continuing with login", err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error("Login error:", error);
        throw new Error(error?.message || "Invalid email or password.");
      }

      console.log("Login successful");
      // Auth state listener will update context
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro no login",
        description: error?.message || "Email ou senha inválidos",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Se for usuário de teste, apenas limpar estado
      if (user?.id === "test-user-id") {
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
        
        toast({
          title: "Logout realizado",
          description: "Você saiu do modo teste"
        });
        return;
      }

      const supabase = (window as any).supabase;
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Clean up auth state first
      cleanupAuthState();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Update state
      setIsAuthenticated(false);
      setUser(null);
      
      // Navigate to homepage
      navigate('/');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Erro durante logout",
        description: error?.message || "Ocorreu um erro durante o logout",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
