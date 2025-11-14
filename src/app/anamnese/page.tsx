"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AnamneseData } from '@/lib/types';

export default function AnamnesePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<AnamneseData>>({
    objetivo_principal: '',
    nivel_apetite: '',
    freq_proteina: '',
    freq_fibra: '',
    nivel_energia: '',
    sentiu_enjoo: '',
    bebe_agua: '',
    atividade_fisica: '',
    dificuldades: [],
    pref_notificacoes: '',
    peso_atual: 0,
    ja_comecou_tratamento: '',
  });

  const questions = [
    {
      question: 'Qual é o seu objetivo principal agora?',
      field: 'objetivo_principal',
      options: [
        'Emagrecer rápido',
        'Emagrecer com saúde',
        'Controlar o apetite',
        'Me sentir mais disposto(a)',
      ],
    },
    {
      question: 'Como está seu apetite depois de usar Monjaro?',
      field: 'nivel_apetite',
      options: [
        'Normal',
        'Quase não sinto fome',
        'Zero fome mesmo',
        'Ainda não comecei a usar',
      ],
    },
    {
      question: 'Com que frequência você come proteínas (carne, ovos, frango, whey)?',
      field: 'freq_proteina',
      options: ['Quase sempre', 'Às vezes', 'Quase nunca', 'Não sei'],
    },
    {
      question: 'E fibras (frutas, legumes, verduras, chia etc.)?',
      field: 'freq_fibra',
      options: ['Todos os dias', 'Às vezes', 'Quase nunca'],
    },
    {
      question: 'Como está a sua energia durante o dia?',
      field: 'nivel_energia',
      options: ['Alta', 'Média', 'Baixa', 'Fico fraco(a) às vezes'],
    },
    {
      question: 'Você já sentiu enjoo usando o remédio?',
      field: 'sentiu_enjoo',
      options: ['Sim, bastante', 'Sim, de leve', 'Às vezes', 'Não'],
    },
    {
      question: 'Você bebe água o suficiente?',
      field: 'bebe_agua',
      options: ['Sim', 'Não', 'Esqueço bastante'],
    },
    {
      question: 'Você faz alguma atividade física?',
      field: 'atividade_fisica',
      options: ['Sim, sempre', 'Às vezes', 'Raramente', 'Nunca'],
    },
    {
      question: 'O que mais está difícil pra você no dia a dia?',
      field: 'dificuldades',
      options: [
        'Comer proteína',
        'Comer fibra',
        'Beber água',
        'Lidar com enjoo',
        'Sono ruim',
        'Falta de energia',
        'Manter rotina',
      ],
      multiSelect: true,
    },
    {
      question: 'Você quer receber lembretes durante o dia?',
      field: 'pref_notificacoes',
      options: [
        'Sim, me ajuda',
        'Só o essencial',
        'Só lembrete da dose',
        'Não quero notificações',
      ],
    },
    {
      question: 'Qual é seu peso atual?',
      field: 'peso_atual',
      type: 'number',
    },
    {
      question: 'Você já começou o tratamento com Monjaro?',
      field: 'ja_comecou_tratamento',
      options: ['Sim', 'Vou começar', 'Ainda decidindo'],
    },
  ];

  const currentQuestion = questions[step];

  const handleSelect = (value: string) => {
    const field = currentQuestion.field as keyof AnamneseData;

    if (currentQuestion.multiSelect) {
      const current = (formData.dificuldades || []) as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFormData({ ...formData, dificuldades: updated });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleNumberInput = (value: number) => {
    setFormData({ ...formData, peso_atual: value });
  };

  const canProceed = () => {
    const field = currentQuestion.field as keyof AnamneseData;
    const value = formData[field];

    if (currentQuestion.type === 'number') {
      return value && (value as number) > 0;
    }

    if (currentQuestion.multiSelect) {
      return (value as string[])?.length > 0;
    }

    return value && value !== '';
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular metas baseadas no peso e respostas
      const peso = formData.peso_atual || 70;
      const metaProteina = Math.round(peso * 1.4); // 1.4g/kg
      const metaFibra = 25; // padrão
      const metaAgua = 2000; // padrão

      // Atualizar usuário com dados da anamnese
      const { error } = await supabase
        .from('users')
        .update({
          objetivo_principal: formData.objetivo_principal,
          nivel_apetite: formData.nivel_apetite,
          freq_proteina: formData.freq_proteina,
          freq_fibra: formData.freq_fibra,
          nivel_energia: formData.nivel_energia,
          sentiu_enjoo: formData.sentiu_enjoo,
          bebe_agua: formData.bebe_agua,
          atividade_fisica: formData.atividade_fisica,
          dificuldades: formData.dificuldades,
          pref_notificacoes: formData.pref_notificacoes,
          peso_atual: formData.peso_atual,
          ja_comecou_tratamento: formData.ja_comecou_tratamento,
          meta_proteina: metaProteina,
          meta_fibra: metaFibra,
          meta_agua: metaAgua,
          anamnese_concluida: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Redirecionar para dashboard
      router.push('/');
    } catch (err: any) {
      alert('Erro ao salvar anamnese: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((step + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 flex flex-col">
      {/* Header com progresso */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Pergunta {step + 1} de {questions.length}
            </span>
            <span className="text-sm font-medium text-purple-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Pergunta */}
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              {currentQuestion.question}
            </h2>

            {/* Opções */}
            <div className="space-y-3 mb-8">
              {currentQuestion.type === 'number' ? (
                <div className="flex items-center justify-center gap-4">
                  <input
                    type="number"
                    value={formData.peso_atual || ''}
                    onChange={(e) => handleNumberInput(parseFloat(e.target.value))}
                    className="w-32 text-center text-3xl font-bold border-2 border-purple-300 rounded-xl py-4 focus:border-purple-500 focus:outline-none"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-2xl font-semibold text-gray-600">kg</span>
                </div>
              ) : (
                currentQuestion.options?.map((option) => {
                  const field = currentQuestion.field as keyof AnamneseData;
                  const isSelected = currentQuestion.multiSelect
                    ? (formData.dificuldades || []).includes(option)
                    : formData[field] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left font-medium ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {isSelected && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {currentQuestion.multiSelect && (
              <p className="text-sm text-gray-500 text-center mb-6">
                Você pode selecionar mais de uma opção
              </p>
            )}

            {/* Botões de navegação */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  'Salvando...'
                ) : step === questions.length - 1 ? (
                  <>
                    <Check className="w-5 h-5" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próxima
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
