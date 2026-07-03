import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { STAGES, getRAGStatus } from '../data/store';
import { clsx } from 'clsx';

const RAG_DOT: Record<string, string> = {
  green: 'bg-green-400', amber: 'bg-amber-400', red: 'bg-red-400',
};

export function WorkflowPage() {
  const { vehicles } = useStore();
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Workflow</h1>
        <p className="text-gray-500 text-sm mt-1">Each vehicle moves left-to-right through compliance stages.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STAGES.map(stage => {
            const stageVehicles = vehicles.filter(v => v.currentStage === stage.key);
            return (
              <div key={stage.key} className="w-60 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{stage.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{stage.owner}</div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                    {stageVehicles.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageVehicles.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <span className="text-xs text-gray-400">Empty</span>
                    </div>
                  ) : (
                    stageVehicles.map(v => {
                      const rag = getRAGStatus(v.currentStage, v.updatedAt);
                      return (
                        <div key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)}
                          className="card p-4 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={clsx('w-2 h-2 rounded-full shrink-0', RAG_DOT[rag])} />
                            <span className="text-xs font-mono text-gray-400">{v.registration}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {v.vehicleMake} {v.vehicleModel}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{v.customerName}</div>
                          {stage.slaDays > 0 && (
                            <div className={clsx('text-xs mt-2 font-medium',
                              rag === 'red' ? 'text-red-600' : rag === 'amber' ? 'text-amber-600' : 'text-gray-400')}>
                              SLA: {stage.slaDays * 24}h {rag === 'red' ? '⚠ Overdue' : rag === 'amber' ? '· Due soon' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-6 text-xs text-gray-500">
        <span className="font-medium text-gray-700">SLA Status:</span>
        {[['green', 'On Track'], ['amber', 'Due within 24h'], ['red', 'Overdue']].map(([color, label]) => (
          <div key={color} className="flex items-center gap-1.5">
            <div className={clsx('w-2 h-2 rounded-full', RAG_DOT[color])} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
