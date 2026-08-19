import React, { useState } from "react";
import { parseISO, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

import { useHrAnnouncements } from "./hooks";
import { useAuth } from "../auth/AuthProvider";
import { APP_CONFIG } from "../../config/appConfig";

export default function AnnouncementsPage() {
  const { organization_id } = useAuth();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);

  const limit = APP_CONFIG.PAGE_SIZE;
  const { data, isLoading, isFetching } = useHrAnnouncements(page, limit, "");

  if (!organization_id || isLoading || isFetching || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-blue-500/60 border-t-transparent animate-spin" />
          <p className="text-gray-600 text-sm">Loading announcements…</p>
        </div>
      </div>
    );
  }

  const announcements = Array.isArray(data.announcements)
    ? data.announcements
    : [];

  const totalPages = data.paginationMetaInfo?.totalPages ?? 1;

  // ✅ Full-page single view
  if (selected) {
    const dateObj = parseISO(selected.scheduled_at);
    const displayTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="relative bg-gradient-to-br from-blue-50 via-blue-100/40 to-cyan-50/60 border-b border-blue-100/80">
          <div className="mx-auto max-w-4xl px-5 py-8 flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" /> Back
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-12">
          <article className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {selected.title}
            </h1>
            <time className="block text-sm text-gray-500 mb-8">
              {displayTime}
            </time>
            <div
              className="prose max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selected.content_html }}
            />
          </article>
        </main>
      </div>
    );
  }

  // ✅ Announcements list view
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-blue-50 via-blue-100/40 to-cyan-50/60 border-b border-blue-100/80">
        <div className="mx-auto max-w-6xl px-5 py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            HR Announcements
          </h1>
          <p className="mt-3 text-lg text-gray-700 font-light">
            Stay informed • {new Date().toISOString().split("T")[0]}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {announcements.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-6">
              📢
            </div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              No announcements
            </h3>
            <p className="text-gray-600">
              Check back later for important updates.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:gap-9">
            {announcements.map((ann, index) => {
              const dateObj = parseISO(ann.scheduled_at);
              const isNewToday = isToday(dateObj);

              const accent =
                index === 0 ? "red" : index === 1 ? "amber" : "blue";
              const accentClass = {
                red: "from-red-500 to-rose-600",
                amber: "from-amber-500 to-orange-500",
                blue: "from-blue-500 to-cyan-600",
              }[accent];

              const displayTime = new Intl.DateTimeFormat("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }).format(dateObj);

              return (
                <article
                  key={ann.id}
                  className={`group relative rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    isNewToday ? "ring-1 ring-blue-400/40 ring-offset-2" : ""
                  }`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${accentClass}`} />

                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                        {ann.title}
                      </h2>

                      {isNewToday && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shrink-0">
                          New
                        </span>
                      )}
                    </div>

                    <time className="block text-sm text-gray-500 mb-3">
                      {displayTime}
                    </time>

                    <PreviewContent
                      html={ann.content_html}
                      onMore={() => setSelected(ann)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-4 bg-white border border-gray-200 shadow-sm rounded-xl px-6 py-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-sm font-medium text-gray-700">
                Page{" "}
                <span className="text-blue-600 font-bold">{page}</span> of{" "}
                <span className="text-blue-600 font-bold">{totalPages}</span>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-700 disabled:opacity-50"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PreviewContent({
  html,
  onMore,
}: {
  html: string;
  onMore: () => void;
}) {
  const plainText = html.replace(/<[^>]+>/g, "").trim();
  const isLong = plainText.length > 160;
  const previewText = isLong ? plainText.slice(0, 160) + "…" : plainText;

  return (
    <div className="mt-3">
      <div className="line-clamp-3 text-gray-700 leading-relaxed text-[15px]">
        {previewText}
      </div>
      <button
        onClick={onMore}
        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 transition-colors"
      >
        Continue reading →
      </button>
    </div>
  );
}
