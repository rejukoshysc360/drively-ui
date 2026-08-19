// components/leave/AuditSummary.tsx

import React from "react";

export default function AuditSummary({
  available,
  accruals,
  leave,
}: {
  available: any;
  accruals: any;
  leave: any;
}) {
  if (!available) return null;


  const formatDateTime = (
  d: string | number | Date
) =>
  new Date(d).toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  // =========================================================
  // Normalize accruals
  // =========================================================

  const accrualList = Array.isArray(accruals)
    ? accruals
    : Array.isArray(accruals?.data)
    ? accruals.data
    : [];

  // =========================================================
  // Sort accruals ascending
  // =========================================================

const sortedAccruals = accrualList
  .slice()
  .sort((a: any, b: any) => {
    return (
      new Date(
        a.created_at || a.accrual_date
      ).getTime() -
      new Date(
        b.created_at || b.accrual_date
      ).getTime()
    );
  });

  const formatDate = (
    d: string | number | Date
  ) =>
    new Date(d).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );

  // =========================================================
  // Active leave statuses
  // =========================================================

  const ACTIVE_LEDGER_STATUSES = [
    "approved",
    "pending_cancel_approval",
    "cancel_rejected",
  ];

  // =========================================================
  // Build timeline
  // =========================================================

  const timeline: any[] = [];

  // =========================================================
  // Accrual rows
  // =========================================================

sortedAccruals.forEach((a: any) => {
  timeline.push({
    type: "accrual",

    // ✅ use insertion chronology
    orderDate: new Date(
      a.created_at || a.accrual_date
    ).getTime(),

    accrual: a,
  });
});

  // =========================================================
  // Leave rows (ONLY if no deduction row exists)
  // =========================================================

  (leave?.allLeaves ?? [])
    .filter((l: any) =>
      ACTIVE_LEDGER_STATUSES.includes(
        l.status
      )
    )
    .forEach((l: any) => {
      // ✅ If backend already inserted deduction row
      // don't create another leave block
      const hasDeductionRow =
        sortedAccruals.some(
          (a: any) =>
            a.leave_id === l.id &&
            Number(a.accrual_days) < 0
        );

      if (hasDeductionRow) {
        return;
      }

      timeline.push({
        type: "leave",
        orderDate: new Date(
          l.leave_date ||
            l.start_date ||
            l.created_at
        ).getTime(),
        leave: l,
      });
    });

  // =========================================================
  // Sort timeline
  // =========================================================

  timeline.sort(
    (a, b) => a.orderDate - b.orderDate
  );

  // =========================================================
  // Running balance
  // =========================================================

  let running = 0;

  const merged = timeline.map((item) => {
    // =====================================================
    // ACCRUAL / DEDUCTION ROWS
    // =====================================================

    if (item.type === "accrual") {
     const a = item.accrual;

const linkedLeave = (
  leave?.allLeaves ?? []
).find(
  (l: any) => l.id === a.leave_id
);

const full = Number(
  linkedLeave?.full_pay_days ?? 0
);

const half = Number(
  linkedLeave?.half_pay_days ?? 0
);

const unpaid = Number(
  linkedLeave?.unpaid_days ?? 0
);

      const deltaNum = Number(
        a.accrual_days || 0
      );

      running += deltaNum;

      running = Math.max(running, 0);

      return {
        type: "accrual",

        date: item.orderDate,

       textDate: formatDate(
  a.accrual_date
),

eventTime: formatDateTime(
  a.created_at ||
    a.accrual_date
),

        delta:
          deltaNum >= 0
            ? `+${deltaNum} (Accrual)`
            : `${deltaNum} (Deduction)`,

        color:
          deltaNum < 0
            ? "text-red-600"
            : "text-green-700",

        balance: running.toFixed(1),

        note: a.notes || "",

       children: [
  ...(full > 0
    ? [
        {
          delta: `Full Pay – ${full}`,
          color: "text-green-700",
        },
      ]
    : []),

  ...(half > 0
    ? [
        {
          delta: `Half Pay – ${half}`,
          color: "text-amber-600",
        },
      ]
    : []),

  ...(unpaid > 0
    ? [
        {
          delta: `Unpaid – ${unpaid}`,
          color: "text-red-600",
        },
      ]
    : []),
],
      };
    }

    // =====================================================
    // LEAVE BLOCKS
    // =====================================================

    const l = item.leave;

    const total = Number(
      l.days_applied ?? 0
    );

    const full = Number(
      l.full_pay_days ?? 0
    );

    const half = Number(
      l.half_pay_days ?? 0
    );

    const unpaid = Number(
      l.unpaid_days ?? 0
    );

    return {
      type: "leave",

      date: item.orderDate,

     textDate: formatDate(
  l.created_at
),

eventTime: formatDateTime(
  l.created_at
),

      delta: `Applied for ${total} day${
        total === 1 ? "" : "s"
      }`,

      color: "text-blue-700 font-bold",

      balance: running.toFixed(1),

      note: `Leave (${l.status}) - ${total} days`,

      children: [
        ...(full > 0
          ? [
              {
                delta: `Full Pay – ${full}`,
                color: "text-green-700",
              },
            ]
          : []),

        ...(half > 0
          ? [
              {
                delta: `Half Pay – ${half}`,
                color: "text-amber-600",
              },
            ]
          : []),

        ...(unpaid > 0
          ? [
              {
                delta: `Unpaid – ${unpaid}`,
                color: "text-red-600",
              },
            ]
          : []),
      ],
    };
  });

  return (
    <div className="bg-gray-50/70 border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 bg-white border-b border-gray-200">
        <h3 className="text-base font-bold text-gray-900">
          Leave Accrual & Ledger Summary
        </h3>
      </div>

      {/* SUMMARY */}

      <div className="p-5 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-xs text-gray-500">
              Accrued Balance
            </p>

           <p className="font-bold">
            {Number(
              available.accrued_balance ??
                0
            ).toFixed(1)} days
          </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Days Availed
            </p>

           <p className="font-bold text-blue-700">
  {Number(
    leave?.totalUsed ?? 0
  ).toFixed(1)} days
</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Remaining
            </p>

           <p className="font-bold text-green-700">
            {Number(
              leave?.remaining ?? 0
            ).toFixed(1)} days
          </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Carry Policy
            </p>

            <p>
              {available.carry_forward_policy ||
                "—"}
            </p>
          </div>
        </div>
      </div>

      {/* LEDGER */}

      <div className="max-h-80 overflow-y-auto">
        {merged.length > 0 ? (
          <div className="divide-y">
            {merged.map(
              (r: any, i: number) => (
                <div
                  key={i}
                  className="px-5 py-4"
                >
                  <div className="flex justify-between">
                    <div>
                     <p className="font-semibold">
                      {r.textDate}
                      </p>

                      {r.eventTime && (
                        <p className="text-[11px] text-gray-500">
                          Created: {r.eventTime}
                        </p>
                      )}

                      {r.note && (
                        <p className="text-xs italic">
                          {r.note}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-bold ${r.color}`}
                      >
                        {r.delta}
                      </p>

                      <p className="text-xs">
                        Bal: {r.balance}
                      </p>
                    </div>
                  </div>

                  {r.children?.length >
                    0 && (
                    <div className="mt-2 pl-4 border-l">
                      {r.children.map(
                        (
                          c: any,
                          j: number
                        ) => (
                          <div
                            key={j}
                            className="flex justify-end text-xs"
                          >
                            <span
                              className={
                                c.color
                              }
                            >
                              {c.delta}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No ledger records found.
          </div>
        )}
      </div>
    </div>
  );
}