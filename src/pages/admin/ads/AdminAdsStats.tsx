import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Loader2, Eye, MousePointerClick, Users, Percent, ExternalLink, Gamepad2 } from 'lucide-react';
import sponsorApi from '@/api/sponsor';
import type { SponsorPubliciteDTO } from '@/api/types';

function ctr(clics: number, vues: number): number {
  if (vues <= 0) return 0;
  return Math.round((clics / vues) * 1000) / 10;
}

type SponsorGroup = {
  key: string;
  name: string;
  email: string | null;
  ads: SponsorPubliciteDTO[];
  totalVues: number;
  totalClics: number;
};

function groupAdsBySponsor(ads: SponsorPubliciteDTO[]): SponsorGroup[] {
  const map = new Map<string, SponsorGroup>();
  for (const ad of ads) {
    const key = ad.sponsorId != null ? `sponsor-${ad.sponsorId}` : `name-${ad.sponsorNom || 'inconnu'}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: ad.sponsorNom || 'Sponsor inconnu',
        email: ad.sponsorEmail || null,
        ads: [],
        totalVues: 0,
        totalClics: 0,
      });
    }
    const group = map.get(key)!;
    group.ads.push(ad);
    group.totalVues += ad.nbVues ?? 0;
    group.totalClics += ad.nbClics ?? 0;
  }
  return Array.from(map.values()).sort((a, b) => b.totalVues - a.totalVues);
}

function initialsFromName(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

export default function AdminAdsStats() {
  const [ads, setAds] = useState<SponsorPubliciteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    sponsorApi
      .listPublicites()
      .then((res) => {
        if (!cancelled) setAds(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Erreur lors du chargement des publicités');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const groups = useMemo(() => groupAdsBySponsor(ads), [ads]);

  const globalStats = useMemo(() => {
    const totalVues = ads.reduce((sum, a) => sum + (a.nbVues ?? 0), 0);
    const totalClics = ads.reduce((sum, a) => sum + (a.nbClics ?? 0), 0);
    const activeAds = ads.filter((a) => (a.status || '').toUpperCase() === 'ACTIVE').length;
    return {
      totalAds: ads.length,
      activeAds,
      totalSponsors: groups.length,
      totalVues,
      totalClics,
      ctr: ctr(totalClics, totalVues),
    };
  }, [ads, groups.length]);

  return (
    <div className="p-5 md:p-6 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 min-h-full">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 md:p-5 mb-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 mb-3 border border-slate-200">
          <Megaphone className="w-4 h-4 text-violet-600" />
          Publicités sponsors
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">Statistiques des publicités</h1>
        <p className="text-sm text-slate-600">
          Impressions, clics et détails de toutes les campagnes, regroupées par sponsor.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-500">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-gray-500 rounded-xl bg-white border border-gray-100">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucune publicité créée pour le moment.</p>
        </div>
      ) : (
        <>
          {/* KPI globaux */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                <Users className="w-4 h-4" /> Sponsors
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{globalStats.totalSponsors}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                <Megaphone className="w-4 h-4" /> Publicités
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {globalStats.totalAds}
                <span className="text-sm font-semibold text-emerald-600 ml-1.5">{globalStats.activeAds} actives</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                <Eye className="w-4 h-4" /> Impressions
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{globalStats.totalVues.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                <MousePointerClick className="w-4 h-4" /> Clics
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{globalStats.totalClics.toLocaleString('fr-FR')}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
                <Percent className="w-4 h-4" /> CTR global
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{globalStats.ctr}%</p>
            </div>
          </div>

          {/* Regroupement par sponsor */}
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <motion.section
                key={group.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100 bg-slate-50/60">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initialsFromName(group.name)}
                  </div>
                  <div className="min-w-0 mr-auto">
                    <p className="font-bold text-slate-900 truncate">{group.name}</p>
                    {group.email && <p className="text-xs text-slate-500 truncate">{group.email}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {group.ads.length} pub{group.ads.length > 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                      <Eye className="w-3.5 h-3.5" /> {group.totalVues.toLocaleString('fr-FR')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                      <MousePointerClick className="w-3.5 h-3.5" /> {group.totalClics.toLocaleString('fr-FR')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Percent className="w-3.5 h-3.5" /> CTR {ctr(group.totalClics, group.totalVues)}%
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px]">
                    <thead className="bg-gray-50/70 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Publicité</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Jeux ciblés</th>
                        <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Impressions</th>
                        <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Clics</th>
                        <th className="text-right px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.ads.map((ad) => {
                        const vues = ad.nbVues ?? 0;
                        const clics = ad.nbClics ?? 0;
                        const active = (ad.status || '').toUpperCase() === 'ACTIVE';
                        const jeuTitres = ad.jeuTitres ?? [];
                        return (
                          <tr key={ad.id} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-gray-900">{ad.contenu}</p>
                              {ad.ctaUrl && (
                                <a
                                  href={ad.ctaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {ad.ctaLabel || 'Offre liée'}
                                </a>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                                active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {active ? 'Active' : 'En pause'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {jeuTitres.length === 0 ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {jeuTitres.slice(0, 3).map((titre) => (
                                    <span key={titre} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      <Gamepad2 className="w-3 h-3" /> {titre}
                                    </span>
                                  ))}
                                  {jeuTitres.length > 3 && (
                                    <span className="text-[11px] text-slate-400">+{jeuTitres.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">{vues.toLocaleString('fr-FR')}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">{clics.toLocaleString('fr-FR')}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-700">{ctr(clics, vues)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
