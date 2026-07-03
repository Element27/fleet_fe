import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { STAGES } from '../data/store';

const COLORS = ['#0D6E6E', '#16A34A', '#2563EB', '#D97706', '#6B7280'];

export function ReportsPage() {
  const { vehicles } = useStore();

  const stageData = STAGES.map(s => ({
    name: s.label.split(' ')[0],
    count: vehicles.filter(v => v.currentStage === s.key).length,
  }));

  const statusData = [
    { name: 'active', value: vehicles.filter(v => v.status === 'active').length },
    { name: 'completed', value: vehicles.filter(v => v.status === 'completed').length },
    { name: 'flagged', value: vehicles.filter(v => v.status === 'flagged').length },
  ].filter(d => d.value > 0);

  const totalExposure = vehicles.reduce((s, v) => s + v.assetValue, 0);
  const completedExposure = vehicles.filter(v => v.status === 'completed').reduce((s, v) => s + v.assetValue, 0);
  const atRisk = vehicles.filter(v => v.status === 'flagged').reduce((s, v) => s + v.assetValue, 0);

  const handleExport = () => {
    const rows = [['Case Ref', 'Registration', 'Make', 'Model', 'Borrower', 'Dealer', 'Stage', 'Asset Value', 'Status']];
    vehicles.forEach(v => {
      const stage = STAGES.find(s => s.key === v.currentStage);
      rows.push([v.caseRef, v.registration, v.vehicleMake, v.vehicleModel, v.customerName, v.dealer, stage?.label || v.currentStage, String(v.assetValue), v.status]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fleetguard-report.csv'; a.click();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Portfolio compliance and exposure.</p>
        </div>
        <button className="btn-secondary" onClick={handleExport}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Exposure KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Total Exposure', value: totalExposure, color: 'text-gray-900' },
          { label: 'Completed Exposure', value: completedExposure, color: 'text-green-600' },
          { label: 'At-Risk Exposure', value: atRisk, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-6">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">{label}</div>
            <div className={`text-2xl font-bold font-mono ${color}`}>
              {value > 0 ? value.toLocaleString() : <span className="text-gray-300">0</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Bar chart */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Vehicles per stage</h2>
          {vehicles.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="count" fill="#0D6E6E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Status mix</h2>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600 capitalize">{d.name}</span>
                    <span className="font-bold text-gray-900 ml-1">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">All Cases</h2>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No cases yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Case Ref', 'Vehicle', 'Borrower', 'Dealer', 'Stage', 'Value', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider py-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => {
                  const stage = STAGES.find(s => s.key === v.currentStage);
                  return (
                    <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500">{v.caseRef}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{v.vehicleMake} {v.vehicleModel}</td>
                      <td className="py-3 pr-4 text-gray-600">{v.customerName}</td>
                      <td className="py-3 pr-4 text-gray-600">{v.dealer}</td>
                      <td className="py-3 pr-4">
                        <span className="badge bg-primary/10 text-primary text-xs">{stage?.label}</span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-700">{v.assetValue.toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge text-xs capitalize ${
                          v.status === 'active' ? 'bg-blue-50 text-blue-700' :
                          v.status === 'completed' ? 'bg-green-50 text-green-700' :
                          'bg-amber-50 text-amber-700'}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
