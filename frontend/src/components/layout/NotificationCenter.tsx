import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, 
  RotateCw, 
  X, 
  FlaskConical, 
  Award, 
  AlertCircle, 
  ChevronRight, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getBisNotifications, BisNotificationItem } from '../../services/api';
import { useProductContext } from '../../context/ProductContext';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<BisNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const { startJourney } = useProductContext();

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getBisNotifications({ limit: 100 });
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else {
        setNotifications([]);
      }
      setHasFetchedOnce(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'BIS regulatory updates are temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount to detect real updates
  useEffect(() => {
    fetchNotifications(true);
  }, []);

  // Close panel on click outside or Esc key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Dynamic filter lists based on actual database records
  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.notification_type));
    return Array.from(types);
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (selectedTypeFilter === 'all') return notifications;
    return notifications.filter((n) => n.notification_type === selectedTypeFilter);
  }, [notifications, selectedTypeFilter]);

  // Helper for notification type details (mapped dynamically, never hardcoding records)
  const getTypeMeta = (type: string) => {
    switch (type) {
      case 'test_change':
        return {
          label: 'New BIS Test Requirement',
          shortLabel: 'Test Requirement',
          icon: <FlaskConical className="w-4 h-4 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
          dotClass: 'bg-amber-500',
        };
      case 'certificate_expiring_soon':
        return {
          label: 'BIS Certificate Expiring Soon',
          shortLabel: 'Certificate Expiry',
          icon: <Award className="w-4 h-4 text-rose-600" />,
          badgeClass: 'bg-rose-50 text-rose-900 border-rose-200',
          dotClass: 'bg-rose-500',
        };
      default:
        return {
          label: 'BIS Regulatory Update',
          shortLabel: type ? type.replace(/_/g, ' ') : 'Regulatory',
          icon: <ShieldCheck className="w-4 h-4 text-bis-700" />,
          badgeClass: 'bg-sky-50 text-sky-900 border-sky-200',
          dotClass: 'bg-bis-600',
        };
    }
  };

  const formatRelativeTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatFullDateTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleNavigateToStandard = (standardIdOrProduct: string) => {
    setIsOpen(false);
    // Switch to home tab
    window.dispatchEvent(new CustomEvent('manak_setu_navigate', { detail: { tab: 'home' } }));
    // Trigger product journey
    startJourney(standardIdOrProduct);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen && !hasFetchedOnce) {
            fetchNotifications(true);
          }
        }}
        aria-label="BIS Regulatory Notifications"
        title="BIS Regulatory Updates & Notifications"
        className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all ${
          isOpen
            ? 'bg-bis-900 text-white border-bis-900 shadow-sm'
            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-bis-950'
        }`}
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-extrabold bg-rose-600 text-white rounded-full shadow-xs ring-2 ring-white">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notification Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] sm:w-[440px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-bis-950 to-bis-900 text-white flex items-center justify-between border-b border-bis-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-bis-800 text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">BIS Regulatory Updates</h3>
                <p className="text-[10px] text-slate-300">
                  Live statutory alerts via Supabase Regulatory Monitor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchNotifications(true)}
                disabled={isLoading}
                title="Fetch latest BIS updates"
                className="p-1.5 rounded-lg hover:bg-bis-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-bis-800 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills (if multiple types exist) */}
          {availableTypes.length > 1 && (
            <div className="px-3 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTypeFilter === 'all'
                    ? 'bg-bis-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>

              {availableTypes.map((type) => {
                const meta = getTypeMeta(type);
                const count = notifications.filter((n) => n.notification_type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedTypeFilter === type
                        ? 'bg-bis-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {meta.shortLabel} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Notifications List Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {isLoading && notifications.length === 0 ? (
              /* Loading Skeleton */
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 animate-pulse space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-32 bg-slate-200 rounded" />
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3 w-48 bg-slate-200 rounded" />
                    <div className="h-2.5 w-full bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              /* Error State */
              <div className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900">Unable to Load Updates</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
                </div>
                <button
                  onClick={() => fetchNotifications(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              /* Empty State */
              <div className="p-8 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-900">You're all caught up.</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    New BIS regulatory updates will appear here as monitored by the regulatory service.
                  </p>
                </div>
              </div>
            ) : (
              /* Real Notifications from Supabase */
              filteredNotifications.map((item) => {
                const meta = getTypeMeta(item.notification_type);
                const isExpanded = expandedId === item.id;
                const standardId = item.new_value?.standard_id;
                const productName = item.new_value?.product_name;

                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className={`p-4 transition-colors cursor-pointer text-left hover:bg-slate-50/80 ${
                      isExpanded ? 'bg-slate-50/90' : 'bg-white'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${meta.badgeClass}`}
                        >
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600 shrink-0 whitespace-nowrap">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    {/* Title & Message */}
                    <div className="mt-1.5 space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h4>
                      <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.message}
                      </p>
                    </div>

                    {/* Collapsed Preview Hint */}
                    {!isExpanded && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-bis-700 font-semibold">
                        <span>Click for technical details & standard link</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Expanded Details Drawer */}
                    {isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 text-xs animate-fade-in"
                      >
                        {/* Timestamp Info */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Recorded: <strong>{formatFullDateTime(item.created_at)}</strong></span>
                        </div>

                        {/* Related Entity */}
                        {item.related_entity_type && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Entity: <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-800">{item.related_entity_type}</code>
                              {item.related_entity_id && (
                                <span className="ml-1 text-slate-400">({item.related_entity_id})</span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Key Attributes from new_value */}
                        {item.new_value && (
                          <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 space-y-1.5 text-[11px]">
                            <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                              Verified Notice Parameters
                            </div>

                            {item.new_value.requirement && (
                              <div>
                                <span className="text-slate-500">Requirement: </span>
                                <strong className="text-slate-900">{item.new_value.requirement}</strong>
                              </div>
                            )}

                            {item.new_value.clause && (
                              <div>
                                <span className="text-slate-500">Clause: </span>
                                <strong className="text-slate-900">{item.new_value.clause}</strong>
                              </div>
                            )}

                            {item.new_value.test_method && (
                              <div>
                                <span className="text-slate-500">Test Method: </span>
                                <strong className="text-slate-900">{item.new_value.test_method}</strong>
                              </div>
                            )}

                            {item.new_value.testing_type && (
                              <div>
                                <span className="text-slate-500">Test Classification: </span>
                                <strong className="text-slate-900">
                                  {item.new_value.testing_type === 'S'
                                    ? 'Special Test (S)'
                                    : item.new_value.testing_type === 'R'
                                    ? 'Routine Test (R)'
                                    : item.new_value.testing_type}
                                </strong>
                              </div>
                            )}

                            {item.new_value.certificate_number && (
                              <div>
                                <span className="text-slate-500">Certificate No: </span>
                                <strong className="text-slate-900">{item.new_value.certificate_number}</strong>
                              </div>
                            )}

                            {item.new_value.product_name && (
                              <div>
                                <span className="text-slate-500">Product: </span>
                                <strong className="text-slate-900">{item.new_value.product_name}</strong>
                              </div>
                            )}

                            {item.new_value.expiry_date && (
                              <div>
                                <span className="text-slate-500">Expiry Date: </span>
                                <strong className="text-rose-700 font-extrabold">{item.new_value.expiry_date}</strong>
                              </div>
                            )}

                            {standardId && (
                              <div className="pt-0.5">
                                <span className="text-slate-500">Standard ID: </span>
                                <span className="font-mono text-[10px] text-bis-900 font-bold break-all">
                                  {standardId}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Navigation Action Button */}
                        {(standardId || productName) && (
                          <button
                            type="button"
                            onClick={() => handleNavigateToStandard(standardId || productName)}
                            className="w-full mt-2 px-3 py-2 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                          >
                            <span>Open Compliance Guide</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Source: <strong>BIS Official Gazette & Orders</strong>
            </span>
            <span className="text-slate-400">
              {notifications.length} {notifications.length === 1 ? 'Notice' : 'Notices'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
