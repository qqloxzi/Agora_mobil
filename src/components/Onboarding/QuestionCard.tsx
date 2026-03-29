import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { OnboardingQuestion } from '../../data/onboardingQuestions';
import { OnboardingAnswers } from '../../context/OnboardingContext';
import { LevelSelection } from './LevelSelection';
import { LeagueTargetLevelSlider } from './LeagueTargetLevelSlider';

type QuestionCardProps = {
  question: OnboardingQuestion;
  answers: OnboardingAnswers;
  pickSingle: (value: string) => void;
  toggleMulti: (value: string) => void;
  confirmMulti: () => void;
  setAnswerField: (key: keyof OnboardingAnswers, value: any) => void;
  confirmTextStep: () => void;
  confirmTargetLeagueStep: () => void;
};

export function QuestionCard({
  question,
  answers,
  pickSingle,
  toggleMulti,
  confirmMulti,
  setAnswerField,
  confirmTextStep,
  confirmTargetLeagueStep,
}: QuestionCardProps) {
  if (!question) return null;

  useEffect(() => {
    if (question.type !== 'levelTargetSlider') return;
    if (answers.target_league_level == null || String(answers.target_league_level).trim() === '') {
      setAnswerField('target_league_level', '17k');
    }
  }, [question.type, question.id, answers.target_league_level, setAnswerField]);

  const multiKey = question.type === 'multi' ? (question.answerKey as keyof OnboardingAnswers) : null;
  const multiList =
    multiKey && Array.isArray(answers[multiKey]) ? (answers[multiKey] as string[]) : [];

  return (
    <View className="w-full mx-auto rounded-3xl border border-primary-blue/10 dark:border-white/10 bg-white dark:bg-[#020617] p-6 shadow-md mt-4">
      <View className="self-start rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1 mb-4 flex-row items-center">
        <View className="w-1.5 h-1.5 rounded-full bg-accent-blue mr-2" />
        <Text className="text-[11px] font-bold uppercase tracking-widest text-accent-blue">
          Kısa Anket
        </Text>
      </View>

      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
        {question.title}
      </Text>
      <Text className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
        {question.description}
      </Text>

      {question.type === 'text' && (
        <View>
          <TextInput
            value={(answers[question.answerKey as keyof OnboardingAnswers] as string) ?? ''}
            onChangeText={(text) => setAnswerField(question.answerKey as keyof OnboardingAnswers, text)}
            placeholder={question.textPlaceholder ?? ''}
            placeholderTextColor="#94a3b8"
            className="w-full rounded-2xl border border-primary-blue/15 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 px-5 py-4 text-base font-medium text-slate-900 dark:text-white mb-6"
          />
          <TouchableOpacity
            onPress={confirmTextStep}
            className="w-full rounded-2xl bg-primary-blue px-6 py-4 items-center mb-4"
          >
            <Text className="text-white text-sm font-bold uppercase tracking-wider">Devam Et</Text>
          </TouchableOpacity>
        </View>
      )}

      {question.type === 'single' && question.id === 'level' && (
        <LevelSelection
          options={question.options || []}
          selectedValue={answers.level}
          onSelect={pickSingle}
        />
      )}

      {question.type === 'single' && question.id !== 'level' && (
        <View className="flex-col gap-3">
          {question.options?.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => pickSingle(opt.value)}
              className="w-full rounded-2xl border border-primary-blue/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-4"
            >
              <Text className="font-medium text-slate-900 dark:text-white">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {question.type === 'levelTargetSlider' && (
        <View>
          <LeagueTargetLevelSlider
            value={answers.target_league_level || '17k'}
            onChange={(v: string) => setAnswerField('target_league_level', v)}
          />
          <TouchableOpacity
            onPress={confirmTargetLeagueStep}
            disabled={!answers.target_league_level}
            className={`w-full rounded-2xl bg-primary-blue px-6 py-4 items-center mt-8 ${!answers.target_league_level ? 'opacity-50' : ''}`}
          >
            <Text className="text-white text-sm font-bold uppercase tracking-wider">Tamamla</Text>
          </TouchableOpacity>
        </View>
      )}

      {question.type === 'multi' && multiKey && (
        <View>
          <View className="flex-col gap-3 mb-6">
            {question.options?.map((opt) => {
              const checked = multiList.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => toggleMulti(opt.value)}
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-4 ${
                    checked
                      ? 'border-accent-blue/60 bg-accent-blue/10 dark:bg-accent-blue/15'
                      : 'border-primary-blue/10 dark:border-white/10 bg-slate-50 dark:bg-white/5'
                  }`}
                >
                  <View
                    className={`h-5 w-5 rounded border items-center justify-center ${
                      checked ? 'border-accent-blue bg-accent-blue' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {checked && <View className="h-2.5 w-2.5 rounded-xs bg-white" />}
                  </View>
                  <Text className="text-sm font-medium text-slate-900 dark:text-white flex-1 relative bottom-0.5">
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            onPress={confirmMulti}
            className="w-full rounded-2xl bg-primary-blue px-6 py-4 items-center mb-4"
          >
            <Text className="text-white text-sm font-bold uppercase tracking-wider">Devam Et</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


