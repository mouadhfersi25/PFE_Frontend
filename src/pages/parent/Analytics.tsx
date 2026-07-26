import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO } from '@/api/types';

type SkillsMap = { math: number; logic: number; memory: number; reflex: number };

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
  const location = useLocation();
  const [children, setChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const childIdFromState = (location.state as { childId?: number } | null)?.childId ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userApi
      .getLinkedChildren()
      .then((res) => {
        if (cancelled) return;
        setChildren(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setChildren([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChild = useMemo(() => {
    if (children.length === 0) return null;
    if (childIdFromState != null) {
      const match = children.find((c) => c.id === childIdFromState);
      if (match) return match;
    }
    return children[0];
  }, [children, childIdFromState]);

  const childProfile = selectedChild ? mapChildToView(selectedChild) : null;
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }
  if (!childProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Aucun enfant rattaché à ce compte parent.
        </div>
      </div>
    );
  }

  const skillsData = [
    { skill: 'Math', value: childProfile.skills.math },
    { skill: 'Logic', value: childProfile.skills.logic },
    { skill: 'Memory', value: childProfile.skills.memory },
    { skill: 'Reflex', value: childProfile.skills.reflex },
  ];

  const performanceByGameType = [
    { type: 'Quiz', played: Math.max(1, Math.round(childProfile.skills.math / 10)), avgScore: childProfile.skills.math * 10, successRate: childProfile.skills.math },
    { type: 'Logique', played: Math.max(1, Math.round(childProfile.skills.logic / 10)), avgScore: childProfile.skills.logic * 10, successRate: childProfile.skills.logic },
    { type: 'Mémoire', played: Math.max(1, Math.round(childProfile.skills.memory / 10)), avgScore: childProfile.skills.memory * 10, successRate: childProfile.skills.memory },
    { type: 'Réflexe', played: Math.max(1, Math.round(childProfile.skills.reflex / 10)), avgScore: childProfile.skills.reflex * 10, successRate: childProfile.skills.reflex },
  ];

  const weakArea = Object.entries(childProfile.skills).reduce((min, [skill, value]) =>
    value < min.value ? { skill, value } : min
  , { skill: 'Logic', value: childProfile.skills.logic });

  const strongArea = Object.entries(childProfile.skills).reduce((max, [skill, value]) =>
    value > max.value ? { skill, value } : max
  , { skill: 'Memory', value: childProfile.skills.memory });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
              <p className="text-sm text-gray-600">Detailed insights and recommendations</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Recommendations Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">🤖 AI Smart Recommendations</h3>
              <p className="text-white/90">
                Based on {childProfile.name.split(' ')[0]}'s performance analysis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strength Area */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <h4 className="font-bold">Strong Area</h4>
              </div>
              <p className="text-sm text-white/90 mb-1">
                <span className="font-semibold capitalize">{strongArea.skill}</span> - {strongArea.value}%
              </p>
              <p className="text-sm text-white/80">
                Excellent performance! Continue with challenging games to maintain this level.
              </p>
            </div>

            {/* Weak Area */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-yellow-300" />
                <h4 className="font-bold">Focus Area</h4>
              </div>
              <p className="text-sm text-white/90 mb-1">
                <span className="font-semibold capitalize">{weakArea.skill}</span> - {weakArea.value}%
              </p>
              <p className="text-sm text-white/80">Recommended: More {weakArea.skill} games at Medium difficulty to improve.</p>
            </div>
          </div>

          {/* Suggested Game */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h4 className="font-bold mb-2">Suggested Next Game</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{weakArea.skill} Challenge</p>
                <p className="text-sm text-white/80">Medium difficulty • Improves {weakArea.skill} skills</p>
              </div>
              <span className="text-3xl">🎯</span>
            </div>
          </div>
        </motion.div>

        {/* Skills Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Skills Radar</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
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

        {/* Performance by Game Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Performance by Game Type</h3>
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
              <Bar dataKey="successRate" fill="#8b5cf6" name="Success Rate %" radius={[8, 8, 0, 0]} />
              <Bar dataKey="played" fill="#3b82f6" name="Games Played" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Detailed Statistics */}
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
                  <span className="text-gray-600">Games Played</span>
                  <span className="font-bold text-gray-900">{type.played}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-bold text-purple-600">{type.avgScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
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

        {/* Guardian Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-blue-900 mb-1">Guardian Notification</h4>
              <p className="text-blue-700">
                {childProfile.name.split(' ')[0]} has been actively playing and showing great progress!
                Current streak: {childProfile.currentStreak} days. Keep encouraging consistent practice.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
