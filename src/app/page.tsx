"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Droplet, 
  Apple, 
  Activity, 
  Weight, 
  AlertCircle,
  Plus,
  TrendingDown,
  Waves,
  Beef,
  Wheat,
  Flame,
  FileText,
  LogOut
} from 'lucide-react';
import DashboardCard from '@/components/custom/DashboardCard';
import { supabase } from '@/lib/supabase';

export default function MonjaroUpDashboard() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados do dashboard
  const [doseAtual, setDoseAtual] = useState(5);
  const [proximaDose, setProximaDose] = useState('');
  const [proteinaHoje, setProteinaHoje] = useState(0);
  const [metaProteina, setMetaProteina] = useState(80);
  const [fibraHoje, setFibraHoje] = useState(0);
  const [metaFibra, setMetaFibra] = useState(25);
  const [aguaHoje, setAguaHoje] = useState(0);
  const [metaAgua, setMetaAgua] = useState(2000);
  const [pesoAtual, setPesoAtual] = useState(85.5);
  const [pesoInicial, setPesoInicial] = useState(92.0);
  const [sintomasHoje, setSintomasHoje] = useState({ enjoo: 0, fraqueza: 0 });

  // Dados da anamnese para personalização
  const [nivelApetite, setNivelApetite] = useState('');
  const [dificuldades, setDificuldades] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Buscar dados do usuário
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar usuário:', error);
        return;
      }

      // Verificar se anamnese foi concluída
      if (!userData.anamnese_concluida) {
        router.push('/anamnese');
        return;
      }

      // Carregar dados do usuário
      setMetaProteina(userData.meta_proteina || 80);
      setMetaFibra(userData.meta_fibra || 25);
      setMetaAgua(userData.meta_agua || 2000);
      setPesoAtual(userData.peso_atual || 85.5);
      setNivelApetite(userData.nivel_apetite || '');
      setDificuldades(userData.dificuldades || []);

      // Carregar dados do dia
      await carregarDadosDoDia(user.id);

      setLoading(false);
    } catch (err) {
      console.error('Erro na autenticação:', err);
      router.push('/login');
    }
  };

  const carregarDadosDoDia = async (uid: string) => {
    const hoje = new Date().toISOString().split('T')[0];

    // Buscar nutrição do dia
    const { data: nutricao } = await supabase
      .from('nutricao')
      .select('*')
      .eq('user_id', uid)
      .eq('data', hoje)
      .single();

    if (nutricao) {
      setProteinaHoje(nutricao.proteina_g || 0);
      setFibraHoje(nutricao.fibra_g || 0);
      setAguaHoje(nutricao.agua_ml || 0);
    }

    // Buscar sintomas do dia
    const { data: sintomas } = await supabase
      .from('sintomas')
      .select('*')
      .eq('user_id', uid)
      .eq('data', hoje)
      .single();

    if (sintomas) {
      setSintomasHoje({
        enjoo: sintomas.enjoo || 0,
        fraqueza: sintomas.fraqueza || 0,
      });
    }

    // Buscar última dose
    const { data: doses } = await supabase
      .from('doses')
      .select('*')
      .eq('user_id', uid)
      .order('data_aplicacao', { ascending: false })
      .limit(1);

    if (doses && doses.length > 0) {
      setDoseAtual(doses[0].dose_mg);
      
      // Calcular próxima dose
      const ultimaDose = new Date(doses[0].data_aplicacao);
      const proximaData = new Date(ultimaDose);
      proximaData.setDate(proximaData.getDate() + 7);
      setProximaDose(proximaData.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      }));
    }
  };

  useEffect(() => {
    const hoje = new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    setCurrentDate(hoje.charAt(0).toUpperCase() + hoje.slice(1));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const registrarDose = async () => {
    if (!userId) return;

    const novaDose = prompt('Digite a dose aplicada (2.5, 5, 7.5, 10, 12.5 ou 15 mg):');
    if (!novaDose) return;

    const dose = parseFloat(novaDose);
    if (![2.5, 5, 7.5, 10, 12.5, 15].includes(dose)) {
      alert('Dose inválida! Use: 2.5, 5, 7.5, 10, 12.5 ou 15 mg');
      return;
    }

    const { error } = await supabase.from('doses').insert({
      user_id: userId,
      dose_mg: dose,
      data_aplicacao: new Date().toISOString().split('T')[0],
    });

    if (error) {
      alert('Erro ao registrar dose: ' + error.message);
      return;
    }

    setDoseAtual(dose);
    
    // Calcular próxima dose
    const proximaData = new Date();
    proximaData.setDate(proximaData.getDate() + 7);
    setProximaDose(proximaData.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    }));
    
    alert('✅ Dose registrada com sucesso!');
  };

  const registrarRefeicao = async () => {
    if (!userId) return;

    const proteina = prompt('Proteína consumida (gramas):');
    const fibra = prompt('Fibra consumida (gramas):');
    const agua = prompt('Água consumida (ml):');
    
    if (!proteina && !fibra && !agua) return;

    const hoje = new Date().toISOString().split('T')[0];
    const novaProteina = proteinaHoje + (parseFloat(proteina) || 0);
    const novaFibra = fibraHoje + (parseFloat(fibra) || 0);
    const novaAgua = aguaHoje + (parseFloat(agua) || 0);

    // Verificar se já existe registro hoje
    const { data: existing } = await supabase
      .from('nutricao')
      .select('id')
      .eq('user_id', userId)
      .eq('data', hoje)
      .single();

    if (existing) {
      // Atualizar
      await supabase
        .from('nutricao')
        .update({
          proteina_g: novaProteina,
          fibra_g: novaFibra,
          agua_ml: novaAgua,
        })
        .eq('id', existing.id);
    } else {
      // Inserir
      await supabase.from('nutricao').insert({
        user_id: userId,
        data: hoje,
        proteina_g: novaProteina,
        fibra_g: novaFibra,
        agua_ml: novaAgua,
        atividade_min: 0,
      });
    }

    setProteinaHoje(novaProteina);
    setFibraHoje(novaFibra);
    setAguaHoje(novaAgua);

    alert('✅ Refeição registrada com sucesso!');
  };

  const registrarPeso = async () => {
    if (!userId) return;

    const peso = prompt('Digite seu peso atual (kg):');
    if (!peso) return;

    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      alert('Peso inválido!');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];

    await supabase.from('pesos').insert({
      user_id: userId,
      data: hoje,
      peso_kg: pesoNum,
    });

    await supabase
      .from('users')
      .update({ peso_atual: pesoNum })
      .eq('id', userId);

    setPesoAtual(pesoNum);
    alert('✅ Peso registrado com sucesso!');
  };

  const registrarSintomas = async () => {
    if (!userId) return;

    const enjoo = prompt('Enjoo (0-5):');
    const fraqueza = prompt('Fraqueza (0-5):');
    
    if (!enjoo && !fraqueza) return;

    const hoje = new Date().toISOString().split('T')[0];
    const novosSintomas = {
      enjoo: parseInt(enjoo) || 0,
      fraqueza: parseInt(fraqueza) || 0,
    };

    // Verificar se já existe registro hoje
    const { data: existing } = await supabase
      .from('sintomas')
      .select('id')
      .eq('user_id', userId)
      .eq('data', hoje)
      .single();

    if (existing) {
      await supabase
        .from('sintomas')
        .update({
          enjoo: novosSintomas.enjoo,
          fraqueza: novosSintomas.fraqueza,
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('sintomas').insert({
        user_id: userId,
        data: hoje,
        enjoo: novosSintomas.enjoo,
        dor_abdominal: 0,
        fraqueza: novosSintomas.fraqueza,
        constipacao: 0,
        diarreia: 0,
        refluxo: 0,
        tontura: 0,
        dor_cabeca: 0,
        falta_apetite: 0,
      });
    }

    setSintomasHoje(novosSintomas);
    alert('✅ Sintomas registrados com sucesso!');
  };

  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

  const getCorProgresso = (progresso: number) => {
    if (progresso < 40) return 'bg-red-500';
    if (progresso < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const perdaPeso = pesoInicial > 0 ? (pesoInicial - pesoAtual).toFixed(1) : '0.0';

  // Verificar se deve mostrar alerta de "Modo Sem Fome"
  const mostrarModoSemFome = 
    nivelApetite === 'Quase não sinto fome' || 
    nivelApetite === 'Zero fome mesmo';

  // Verificar dificuldades para priorizar cards
  const temDificuldadeProteina = dificuldades.includes('Comer proteína');
  const temDificuldadeAgua = dificuldades.includes('Beber água');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Droplet className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 via-purple-600 to-blue-500 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <Droplet className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Monjaro UP</h1>
                <p className="text-purple-100 text-sm">Diário de Uso do Monjaro</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <p className="text-purple-100 mt-2">{currentDate}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
        
        {/* Alerta Modo Sem Fome */}
        {mostrarModoSemFome && proteinaHoje < metaProteina * 0.4 && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-pulse">
            <Flame className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Modo Sem Fome Ativado!</p>
              <p className="text-sm text-yellow-100">
                Você está com pouca fome, mas precisa manter a ingestão mínima de proteína.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Ingestão Baixa */}
        {!mostrarModoSemFome && proteinaHoje < metaProteina * 0.4 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-pulse">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Atenção: Ingestão de proteína muito baixa!</p>
              <p className="text-sm text-orange-100">Tente consumir ao menos 40% da sua meta diária.</p>
            </div>
          </div>
        )}

        {/* Alerta de Água (se marcou dificuldade) */}
        {temDificuldadeAgua && aguaHoje < metaAgua * 0.5 && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
            <Waves className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Lembre-se de beber água!</p>
              <p className="text-sm text-blue-100">Você ainda não atingiu metade da sua meta de hidratação.</p>
            </div>
          </div>
        )}

        {/* Dose Atual */}
        <DashboardCard 
          title="Dose Atual" 
          icon={Droplet}
          gradient="from-purple-600 to-purple-400"
        >
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-purple-700">{doseAtual}</span>
              <span className="text-2xl text-gray-600">mg</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <p className="text-sm text-gray-600">Próxima aplicação</p>
              <p className="font-semibold text-purple-700">{proximaDose || 'Não agendada'}</p>
            </div>
            <button 
              onClick={registrarDose}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Registrar Aplicação
            </button>
          </div>
        </DashboardCard>

        {/* Nutrição Diária - Card de Proteína em destaque se tem dificuldade */}
        {temDificuldadeProteina && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Beef className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-800">Vamos cuidar da sua proteína hoje</h3>
                <p className="text-sm text-gray-600">Você marcou que tem dificuldade com proteína</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Progresso</span>
              <span className="text-sm font-semibold text-gray-600">
                {proteinaHoje}g / {metaProteina}g
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-4">
              <div 
                className={`h-full ${getCorProgresso(calcularProgresso(proteinaHoje, metaProteina))} transition-all duration-500 rounded-full`}
                style={{ width: `${calcularProgresso(proteinaHoje, metaProteina)}%` }}
              />
            </div>
            <button 
              onClick={registrarRefeicao}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Registrar Proteína
            </button>
          </div>
        )}

        {/* Nutrição Diária */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-500 p-3 rounded-2xl">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Nutrição de Hoje</h3>
          </div>

          <div className="space-y-6">
            {/* Proteína */}
            {!temDificuldadeProteina && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Beef className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-gray-700">Proteína</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {proteinaHoje}g / {metaProteina}g
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full ${getCorProgresso(calcularProgresso(proteinaHoje, metaProteina))} transition-all duration-500 rounded-full`}
                    style={{ width: `${calcularProgresso(proteinaHoje, metaProteina)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Fibra */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-700">Fibra</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {fibraHoje}g / {metaFibra}g
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${getCorProgresso(calcularProgresso(fibraHoje, metaFibra))} transition-all duration-500 rounded-full`}
                  style={{ width: `${calcularProgresso(fibraHoje, metaFibra)}%` }}
                />
              </div>
            </div>

            {/* Água */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-700">Água</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {aguaHoje}ml / {metaAgua}ml
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${getCorProgresso(calcularProgresso(aguaHoje, metaAgua))} transition-all duration-500 rounded-full`}
                  style={{ width: `${calcularProgresso(aguaHoje, metaAgua)}%` }}
                />
              </div>
            </div>

            <button 
              onClick={registrarRefeicao}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Registrar Refeição
            </button>
          </div>
        </div>

        {/* Peso e Progresso */}
        <DashboardCard 
          title="Peso e Progresso" 
          icon={Weight}
          gradient="from-blue-600 to-cyan-500"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Peso Atual</p>
                <p className="text-3xl font-bold text-blue-700">
                  {pesoAtual > 0 ? `${pesoAtual} kg` : 'Não registrado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Peso Inicial</p>
                <p className="text-xl font-semibold text-gray-500">
                  {pesoInicial > 0 ? `${pesoInicial} kg` : '-'}
                </p>
              </div>
            </div>
            
            {pesoInicial > 0 && pesoAtual > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-2 justify-center">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Perda Total</p>
                    <p className="text-2xl font-bold text-green-600">-{perdaPeso} kg</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={registrarPeso}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Registrar Peso
            </button>
          </div>
        </DashboardCard>

        {/* Sintomas */}
        <DashboardCard 
          title="Sintomas de Hoje" 
          icon={Activity}
          gradient="from-orange-600 to-red-500"
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Monitore seus sintomas diários</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-xs text-gray-600">Enjoo</p>
                <p className="text-lg font-semibold text-gray-800">{sintomasHoje.enjoo}/5</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-xs text-gray-600">Fraqueza</p>
                <p className="text-lg font-semibold text-gray-800">{sintomasHoje.fraqueza}/5</p>
              </div>
            </div>
            <button 
              onClick={registrarSintomas}
              className="w-full bg-gradient-to-r from-orange-600 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Registrar Sintomas
            </button>
          </div>
        </DashboardCard>

        {/* Modo Sem Fome */}
        <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-bold text-lg">Modo Sem Fome</p>
              <p className="text-sm text-yellow-100">Recomendações para manter energia</p>
            </div>
            <Flame className="w-8 h-8" />
          </div>
        </button>

        {/* Relatório */}
        <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-bold text-lg">Gerar Relatório</p>
              <p className="text-sm text-indigo-100">Exportar dados para seu médico</p>
            </div>
            <FileText className="w-8 h-8" />
          </div>
        </button>

        {/* Disclaimer Legal */}
        <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            ⚠️ <strong>Este aplicativo não substitui acompanhamento médico.</strong><br />
            Monjaro é um medicamento controlado. Consulte seu endocrinologista.
          </p>
        </div>

      </main>
    </div>
  );
}
