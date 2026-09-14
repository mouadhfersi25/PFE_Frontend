import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useParentChildren } from '@/context';
import ChildSwitcher from '@/components/parent/ChildSwitcher';
import type { LinkedChildProfileDTO } from '@/api/types';

type SkillsMap = { math: number; logic: number; memory: number; reflex: number };

const SKILL_FR: Record<string, string> = {
  math: 'Quiz',
  logic: 'Logique',
  memory: 'Mémoire',
  reflex: 'Réflexe',
};

type ChildView = {
  id: number;
  name: string;
  currentStreak: number;
  skills: SkillsMap;
};

function mapChildToView(child: LinkedChildProfileDTO): ChildView {
  return {
    id: child.id,
    name: `${child.prenom} ${child.nom}`.trim(),
    currentStreak: child.currentStreakDays ?? 0,
    skills: {
      math: child.skillMath ?? 0,
      logic: child.skillLogic ?? 0,
      memory: child.skillMemory ?? 0,
      reflex: child.skillReflex ?? 0,
    },
  };
}

export default function Analytics() {
  const navigate = useNavigate();
  const { selectedChild, loadingChildren: loading } = useParentChildren();

  const childProfile = selectedChild ? mapChildToView(selectedChild) : null;
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }
  if (!childProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Aucun enfant rattaché à ce compte parent.
        </div>
      </div>
    );
  }

  const skillsData = [
    { skill: 'Quiz', value: childProfile.skills.math },
    { skill: 'Logique', value: childProfile.skills.logic },
    { skill: 'Mémoire', value: childProfile.skills.memory },
    { skill: 'Réflexe', value: childProfile.skills.reflex },
  ];

  const performanceByGameType = [
    { type: 'Quiz', played: Math.max(1, Math.round(childProfile.skills.math / 10)), avgScore: childProfile.skills.math * 10, successRate: childProfile.skills.math },
    { type: 'Logique', played: Math.max(1, Math.round(childProfile.skills.logic / 10)), avgScore: childProfile.skills.logic * 10, successRate: childProfile.skills.logic },
    { type: 'Mémoire', played: Math.max(1, Math.round(childProfile.skills.memory / 10)), avgScore: childProfile.skills.memory * 10, successRate: childProfile.skills.memory },
    { type: 'Réflexe', played: Math.max(1, Math.round(childProfile.skills.reflex / 10)), avgScore: childProfile.skills.reflex * 10, successRate: childProfile.skills.reflex },
  ];

  const weakArea = Object.entries(childProfile.skills).reduce((min, [skill, value]) =>
    value < min.value ? { skill, value } : min
  , { skill: 'logic', value: childProfile.skills.logic });

  const strongArea = Object.entries(childProfile.skills).reduce((max, [skill, value]) =>
    value > max.value ? { skill, value } : max
  , { skill: 'memory', value: childProfile.skills.memory });

  const strongLabel = SKILL_FR[strongArea.skill] ?? strongArea.skill;
  const weakLabel = SKILL_FR[weakArea.skill] ?? weakArea.skill;
  const firstName = childProfile.name.split(' ')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/parent/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analyses de performance</h1>
              <p className="text-sm text-gray-600">Insights détaillés et recommandations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChildSwitcher className="mb-6" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl p-6 text-white shadow-lg mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Recommandations intelligentes</h3>
              <p className="text-white/90">
                Basées sur l’analyse des performances de {firstName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <h4 className="font-bold">Point fort</h4>
              </div>
              <p className="text-sm text-white/90 mb-1">
                <span className="font-semibold">{strongLabel}</span> — {strongArea.value}%
              </p>
              <p className="text-sm text-white/80">
                Excellente performance ! Continuez avec des jeux stimulants pour maintenir ce niveau.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-yellow-300" />
                <h4 className="font-bold">Point à travailler</h4>
              </div>
              <p className="text-sm text-white/90 mb-1">
                <span className="font-semibold">{weakLabel}</span> — {weakArea.value}%
              </p>
              <p className="text-sm text-white/80">
                Recommandé : plus de jeux de {weakLabel} en difficulté Moyenne pour progresser.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h4 className="font-bold mb-2">Prochain jeu suggéré</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">Défi {weakLabel}</p>
                <p className="text-sm text-white/80">Difficulté moyenne • Améliore les compétences en {weakLabel}</p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Radar des compétences</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Niveau"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Performance par type de jeu</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceByGameType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
              <Bar dataKey="successRate" fill="#3b82f6" name="Taux de réussite (%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="played" fill="#3b82f6" name="Parties jouées" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {performanceByGameType.map((type) => (
            <div key={type.type} className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="text-lg font-bold text-gray-900 mb-4">{type.type}</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Parties jouées</span>
                  <span className="font-bold text-gray-900">{type.played}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Score moyen</span>
                  <span className="font-bold text-purple-600">{type.avgScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taux de réussite</span>
                  <span className="font-bold text-green-600">{type.successRate}%</span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      type.successRate >= 80
                        ? 'bg-green-500'
                        : type.successRate >= 70
                        ? 'bg-blue-500'
                        : 'bg-yellow-500'
                    }`}
                    style={{ width: `${type.successRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-blue-900 mb-1">Notification parent</h4>
              <p className="text-blue-700">
                {firstName} joue régulièrement et progresse bien !
                Série actuelle : {childProfile.currentStreak} jour{childProfile.currentStreak > 1 ? 's' : ''}. Continuez à encourager une pratique régulière.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
