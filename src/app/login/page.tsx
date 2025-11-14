"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplet, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Verificar se anamnese foi concluída
        const { data: userData } = await supabase
          .from('users')
          .select('anamnese_concluida')
          .eq('id', data.user?.id)
          .single();

        if (userData?.anamnese_concluida) {
          router.push('/');
        } else {
          router.push('/anamnese');
        }
      } else {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Criar registro na tabela users
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id,
            email: email,
            nome: email.split('@')[0],
            meta_proteina: 80,
            meta_fibra: 25,
            meta_agua: 2000,
            anamnese_concluida: false,
            data_criacao: new Date().toISOString(),
          });

          // Redirecionar para anamnese
          router.push('/anamnese');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm p-4 rounded-3xl mb-4">
            <Droplet className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Monjaro UP</h1>
          <p className="text-purple-100">Seu diário de uso do Monjaro</p>
        </div>

        {/* Card de Login/Cadastro */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Informação adicional */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 font-semibold hover:underline"
            >
              {isLogin ? 'Criar agora' : 'Fazer login'}
            </button>
          </p>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-6 text-white/80 text-xs">
          <p>
            ⚠️ Este app não substitui acompanhamento médico.
            <br />
            Monjaro é um medicamento controlado.
          </p>
        </div>
      </div>
    </div>
  );
}
