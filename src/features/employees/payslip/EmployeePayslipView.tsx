// src/pages/employee/payslip/EmployeePayslipView.tsx

import React, { useEffect, useState } from 'react';
import { Loader2, FileText, Calendar, Eye, EyeOff, Download, X } from 'lucide-react';
import { format, subMonths, parse } from 'date-fns';

import { useAuth } from '../../auth/AuthProvider';
import { useCan } from '../../../utils/permissions';
import { payslipApi, PayslipAuditRecord } from './api';
import PayslipPreview from './PayslipPreview';
import { useDownloadPayslipPDF } from './hooks';

interface PayslipWithSource extends PayslipAuditRecord {
  source: 'recent' | 'range';
  originalIndex: number;
}

export default function EmployeePayslipView() {
  const { user, organization_id } = useAuth();
  const employeeId = user?.id ?? '';
  const can = useCan();

  const downloadPayslip = useDownloadPayslipPDF();

  const canViewPayslip =
    can('payslips:view') || can('payslips:view_own_record_only');

  const [recentRecords, setRecentRecords] = useState<PayslipAuditRecord[]>([]);
  const [rangeRecords, setRangeRecords] = useState<PayslipAuditRecord[]>([]);

  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingRange, setLoadingRange] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedPayslip, setSelectedPayslip] =
    useState<PayslipWithSource | null>(null);

  const [showClear, setShowClear] = useState(false);

  const [fromDate, setFromDate] = useState(
    format(subMonths(new Date(), 5), 'yyyy-MM')
  );
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM'));

  if (!canViewPayslip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3m0 4h.01M4.293 6.707a1 1 0 011.414 0L12 13l6.293-6.293a1 1 0 111.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-1">
          Access Restricted
        </h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to view payslips.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (!organization_id || !employeeId) return;

    (async () => {
      setLoadingRecent(true);
      try {
        const { versions } = await payslipApi.getAudit(
          organization_id,
          employeeId,
          '',
          1,
          100
        );

        const map = new Map<string, PayslipAuditRecord>();
        (versions ?? []).forEach((r) => {
          const cur = map.get(r.month);
          if (!cur || r.version > cur.version) map.set(r.month, r);
        });

        setRecentRecords(
          Array.from(map.values())
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, 3)
        );
      } finally {
        setLoadingRecent(false);
      }
    })();
  }, [organization_id, employeeId]);

  const handleShowSelected = async () => {
    if (!organization_id || !employeeId || loadingRange) return;

    setHasSearched(true);
    setLoadingRange(true);

    try {
      const from = parse(`${fromDate}-01`, 'yyyy-MM-dd', new Date());
      const to = parse(`${toDate}-01`, 'yyyy-MM-dd', new Date());

      const months: string[] = [];
      let cur = from;

      while (cur <= to) {
        months.push(format(cur, 'yyyy-MM'));
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }

      if (months.length > 6) {
        alert('Maximum 6 months allowed.');
        return;
      }

      const payslips = await Promise.all(
        months.map(async (m) => {
          try {
            const data = await payslipApi.get(organization_id, employeeId, m);
            if ('header' in data) {
              return {
                id: `${employeeId}-${m}`,
                month: m,
                version: 1,
                final_payslip: data,
                generated_at: new Date().toISOString(),
              } as PayslipAuditRecord;
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      setRangeRecords(payslips.filter(Boolean) as PayslipAuditRecord[]);
    } finally {
      setLoadingRange(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPayslip || !organization_id || !employeeId) return;

    try {
      const res = await downloadPayslip.mutateAsync({
        employeeId,
        month: selectedPayslip.month,
      });

      if (!res?.url) return;

      const response = await fetch(res.url);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `payslip-${selectedPayslip.month}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const closeModal = () => {
    setSelectedPayslip(null);
    setShowClear(false);
  };

  const monthTitle = selectedPayslip
    ? new Date(`${selectedPayslip.month}-01`).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-6 sm:px-6 lg:px-12 xl:px-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          My Payslips
        </h1>
        <p className="text-slate-600 mt-2 text-base">
          Securely view and download your salary slips
        </p>
      </div>

      {/* Recent Payslips */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Recent Payslips
        </h2>

        {loadingRecent ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : recentRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentRecords.map((rec, i) => (
              <PayslipCard
                key={rec.id}
                rec={rec}
                onClick={() => {
                  setSelectedPayslip({ ...rec, source: 'recent', originalIndex: i });
                  setShowClear(false);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No recent payslips found</p>
          </div>
        )}
      </div>

      {/* Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          View Payslips by Range
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Month
            </label>
            <input
              type="month"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={toDate}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Month
            </label>
            <input
              type="month"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate}
              max={format(new Date(), 'yyyy-MM')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <button
              onClick={handleShowSelected}
              disabled={loadingRange}
              className={`w-full h-12 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition shadow-sm ${
                loadingRange
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loadingRange ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Show Payslips'
              )}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Select a range (maximum 6 months) to view older payslips.
        </p>
      </div>

      {/* Range Loading */}
      {loadingRange && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-gray-600">Loading payslips for selected period…</p>
        </div>
      )}

      {/* Range Results */}
      {!loadingRange && rangeRecords.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Selected Payslips ({rangeRecords.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rangeRecords.map((rec, i) => (
              <PayslipCard
                key={rec.id}
                rec={rec}
                onClick={() => {
                  setSelectedPayslip({ ...rec, source: 'range', originalIndex: i });
                  setShowClear(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loadingRange && hasSearched && rangeRecords.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <FileText className="w-20 h-20 mx-auto text-gray-300 mb-5" />
          <p className="text-lg font-medium text-gray-600">
            No payslips found for the selected period
          </p>
        </div>
      )}

      {/* Custom Modal - Click outside to close + Reveal + Download */}
      {selectedPayslip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal} // Click on backdrop closes modal
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Payslip — {monthTitle}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-auto relative bg-white">
              <div className="relative">
                {/* Blur Overlay */}
                {!showClear && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                    <div className="text-center space-y-4 p-6">
                      <EyeOff className="w-16 h-16 mx-auto text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-700">Payslip is hidden</h3>
                      <p className="text-sm text-gray-500">Click below to reveal sensitive information</p>
                      <button
                        onClick={() => setShowClear(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Show Payslip
                      </button>
                    </div>
                  </div>
                )}

                {/* Payslip Content */}
                <div className={`transition-all duration-300 ${!showClear ? 'blur-sm' : ''}`}>
                  <PayslipPreview preview={selectedPayslip.final_payslip} isEditing={false} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadPayslip.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloadPayslip.isPending ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stunning Payslip Card — "Click to view" always visible
function PayslipCard({
  rec,
  onClick,
}: {
  rec: PayslipAuditRecord;
  onClick: () => void;
}) {
  const monthLabel = new Date(`${rec.month}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
    >
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
          <FileText className="w-9 h-9 text-indigo-600" />
        </div>
        <p className="font-semibold text-gray-900 text-lg">{monthLabel}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-xs text-gray-500">Version</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {rec.version}
          </span>
        </div>
      </div> 
      {/* Persistent text */}
      <div className="px-6 pb-5 text-center">
        <p className="text-sm text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors">
          Click to view
        </p>
      </div>
    </button>
  );
}