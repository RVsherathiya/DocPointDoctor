import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CalendarDays, Eye } from 'lucide-react';
import { useToast } from '../services/ToastContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './AvailabilityTab.css';

interface WeekdayConfig {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  active: boolean;
  startTime: string;
  endTime: string;
}

// Generate time options at 15-minute intervals
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  const periods = ['AM', 'PM'];
  
  for (const period of periods) {
    for (let h = 0; h < 12; h++) {
      const displayHour = h === 0 ? 12 : h;
      const hourStr = displayHour.toString().padStart(2, '0');
      for (const m of ['00', '15', '30', '45']) {
        options.push(`${hourStr}:${m} ${period}`);
      }
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export const AvailabilityTab: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  // Date range states
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default to next 30 days
    return d.toISOString().split('T')[0];
  });
  
  const [slotDuration, setSlotDuration] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Weekday list configuration
  const [weekdays, setWeekdays] = useState<WeekdayConfig[]>([
    { dayOfWeek: 'Monday', active: true, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Tuesday', active: true, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Wednesday', active: true, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Thursday', active: false, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Friday', active: false, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Saturday', active: false, startTime: '09:00 AM', endTime: '01:00 PM' },
    { dayOfWeek: 'Sunday', active: false, startTime: '09:00 AM', endTime: '01:00 PM' },
  ]);

  // Viewer states: For displaying actual database slots for a chosen date
  const [viewDate, setViewDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dbSlots, setDbSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Helper to parse time string e.g. "09:00 AM" into minutes from midnight
  const timeToMins = (timeStr: string): number => {
    const [timePart, modifier] = timeStr.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper to format minutes from midnight back to "HH:MM AM/PM"
  const minsToTime = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 === 0 ? 12 : h % 12;
    const displayMins = m.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMins} ${ampm}`;
  };

  // Compute live slots preview for the first active day
  const getPreviewSlots = (): string[] => {
    const firstActiveDay = weekdays.find(d => d.active);
    if (!firstActiveDay) return [];

    const startMins = timeToMins(firstActiveDay.startTime);
    const endMins = timeToMins(firstActiveDay.endTime);

    if (startMins >= endMins) return [];

    const preview: string[] = [];
    for (let mins = startMins; mins < endMins; mins += slotDuration) {
      preview.push(minsToTime(mins));
    }
    return preview;
  };

  const previewSlots = getPreviewSlots();

  // Fetch configured slots from database for selected date
  const fetchDbSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const response = await api.get(`/availability/me?date=${viewDate}`);
      if (response.data?.status === 'success' && response.data.data.availability?.length > 0) {
        setDbSlots(response.data.data.availability[0].slots || []);
      } else {
        setDbSlots([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch slots:', err);
      showToast(err.message || 'Failed to fetch slots', 'error');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchDbSlots();
  }, [viewDate]);

  const handleDayToggle = (index: number) => {
    setWeekdays(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, active: !item.active };
      }
      return item;
    }));
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setWeekdays(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        newErrors.dateRange = 'Start Date must be before or equal to End Date';
      }

      // Check range size (limit to 90 days)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        newErrors.dateRange = 'Date range cannot exceed 90 days';
      }
    }

    const activeDays = weekdays.filter(d => d.active);
    if (activeDays.length === 0) {
      newErrors.global = 'Please select at least one active day of the week';
    }

    for (const d of activeDays) {
      if (timeToMins(d.startTime) >= timeToMins(d.endTime)) {
        newErrors[d.dayOfWeek] = `${d.dayOfWeek} start time must be before end time`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the validation errors before saving.', 'error');
      return;
    }

    setIsSaving(true);
    const activeDays = weekdays.filter(d => d.active);
    const payload = {
      startDate,
      endDate,
      timezone: browserTimezone,
      slotDuration,
      availability: activeDays.map(d => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
    };

    try {
      const response = await api.post('/availability', payload);
      showToast(response.data?.message || 'Availability saved successfully!', 'success');
      // Refresh current daily slots view
      fetchDbSlots();
    } catch (err: any) {
      console.error('Failed to save availability:', err);
      showToast(err.message || 'Failed to save availability', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="availability-grid">
      {/* Configuration Form */}
      <div>
        <form onSubmit={handleSave} className="availability-card">
          <h3 className="availability-section-title">
            <CalendarDays size={20} style={{ color: 'var(--primary-color)' }} />
            {t('availability.configure_title', 'Configure Weekly Availability')}
          </h3>
          
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-light)',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '20px',
            borderLeft: '4px solid var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={16} />
            <span>{t('availability.timezone_detected', 'Timezone detected: {{timezone}}. All slots will be saved timezone-aware.', { timezone: browserTimezone })}</span>
          </div>

          <div className="form-row" style={{ marginBottom: errors.dateRange ? '12px' : '20px' }}>
            <div>
              <label className="form-label">{t('availability.start_date', 'Start Date')}</label>
              <input 
                type="date" 
                className={`form-control ${errors.dateRange || errors.startDate ? 'error' : ''}`} 
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate || errors.dateRange) setErrors(prev => ({ ...prev, startDate: '', dateRange: '' }));
                }}
                required
              />
            </div>
            <div>
              <label className="form-label">{t('availability.end_date', 'End Date')}</label>
              <input 
                type="date" 
                className={`form-control ${errors.dateRange || errors.endDate ? 'error' : ''}`} 
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate || errors.dateRange) setErrors(prev => ({ ...prev, endDate: '', dateRange: '' }));
                }}
                required
              />
            </div>
          </div>
          {errors.dateRange && <div className="error-text" style={{ display: 'block', marginTop: '-8px', marginBottom: '16px' }}>{errors.dateRange}</div>}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">{t('availability.slot_duration', 'Slot Duration')}</label>
            <select 
              className="form-control" 
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              style={{ padding: '0 16px', appearance: 'auto', WebkitAppearance: 'menulist' }}
            >
              <option value={10}>10 {t('common.minutes', 'Minutes')}</option>
              <option value={15}>15 {t('common.minutes', 'Minutes')}</option>
              <option value={20}>20 {t('common.minutes', 'Minutes')}</option>
              <option value={30}>30 {t('common.minutes', 'Minutes')}</option>
              <option value={45}>45 {t('common.minutes', 'Minutes')}</option>
              <option value={60}>60 {t('common.minutes', 'Minutes')}</option>
            </select>
          </div>

          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>{t('availability.configure_days', 'Configure Days & Time Windows')}</label>
          {errors.global && <div className="error-text" style={{ display: 'block', marginBottom: '12px' }}>{errors.global}</div>}
          <div className="days-config-list" style={{ marginBottom: '28px' }}>
            {weekdays.map((day, idx) => (
              <div 
                key={day.dayOfWeek}
                className={`day-config-card ${day.active ? 'active' : ''}`}
                style={errors[day.dayOfWeek] ? { borderColor: 'var(--danger-color)', backgroundColor: 'rgba(255, 59, 48, 0.02)' } : undefined}
              >
                <div className="day-header">
                  <label className="day-label" htmlFor={`chk-${day.dayOfWeek}`}>
                    <input 
                      type="checkbox"
                      id={`chk-${day.dayOfWeek}`}
                      className="day-checkbox"
                      checked={day.active}
                      onChange={() => {
                        handleDayToggle(idx);
                        if (errors.global) setErrors(prev => ({ ...prev, global: '' }));
                        if (errors[day.dayOfWeek]) setErrors(prev => ({ ...prev, [day.dayOfWeek]: '' }));
                      }}
                    />
                    <span>{t('availability.days.' + day.dayOfWeek.toLowerCase(), day.dayOfWeek)}</span>
                  </label>
                  {!day.active && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t('availability.unavailable', 'Unavailable')}</span>}
                </div>

                {day.active && (
                  <>
                    <div className="day-time-inputs">
                      <select 
                        className="time-select"
                        value={day.startTime}
                        onChange={(e) => {
                          handleTimeChange(idx, 'startTime', e.target.value);
                          if (errors[day.dayOfWeek]) setErrors(prev => ({ ...prev, [day.dayOfWeek]: '' }));
                        }}
                      >
                        {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      
                      <span className="time-to-separator">to</span>
                      
                      <select 
                        className="time-select"
                        value={day.endTime}
                        onChange={(e) => {
                          handleTimeChange(idx, 'endTime', e.target.value);
                          if (errors[day.dayOfWeek]) setErrors(prev => ({ ...prev, [day.dayOfWeek]: '' }));
                        }}
                      >
                        {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    {errors[day.dayOfWeek] && (
                      <div className="error-text" style={{ fontSize: '0.8rem', marginTop: '6px', display: 'block' }}>
                        {errors[day.dayOfWeek]}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', height: '48px' }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="spinner" style={{ marginRight: '8px' }}></div>
                {t('availability.saving', 'Saving Availability...')}
              </>
            ) : t('availability.save_btn', 'Save Availability Setup')}
          </button>
        </form>
      </div>

      {/* Live Preview & Actual Schedule */}
      <div>
        {/* Live Preview Card */}
        <div className="availability-card" style={{ marginBottom: '24px' }}>
          <h3 className="availability-section-title">
            <Clock size={20} style={{ color: 'var(--primary-color)' }} />
            {t('availability.slots_preview', 'Slots Preview')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {t('availability.preview_desc', 'This shows a mockup of slots that will be generated for your active days (showing template matching first selected active day).')}
          </p>

          {previewSlots.length > 0 ? (
            <div className="slots-preview-container">
              <div className="slots-grid">
                {previewSlots.map((slot, index) => (
                  <div key={index} className="slot-block preview">
                    {slot.split(' ')[0]} {slot.split(' ')[1]}
                  </div>
                ))}
              </div>
              <div className="status-legend">
                <div className="legend-item">
                  <div className="legend-color preview"></div>
                  <span>{t('availability.generated_preview', 'Generated Preview ({{count}} slots)', { count: previewSlots.length })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-slots-placeholder">
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <div>{t('availability.enable_weekday_preview', 'Please enable at least one weekday to preview generated slots.')}</div>
            </div>
          )}
        </div>

        {/* Daily Schedule Viewer */}
        <div className="availability-card">
          <h3 className="availability-section-title">
            <Eye size={20} style={{ color: 'var(--primary-color)' }} />
            {t('availability.view_active_slots', 'View Active Slots')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {t('availability.view_active_desc', 'Select a date to view current active availability and patient bookings saved in the database.')}
          </p>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">{t('availability.select_date', 'Select Date')}</label>
            <input 
              type="date" 
              className="form-control"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
            />
          </div>

          {isLoadingSlots ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '8px' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', color: 'var(--primary-color)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('availability.loading_slots', 'Loading slots from server...')}</span>
            </div>
          ) : dbSlots.length > 0 ? (
            <div className="slots-preview-container">
              <div className="slots-grid">
                {dbSlots.map((slot, idx) => (
                  <div 
                    key={idx} 
                    className={`slot-block ${slot.isBooked ? 'booked' : 'available'}`}
                    title={slot.isBooked ? t('availability.booked', 'Booked') : t('availability.available', 'Available')}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
              
              <div className="status-legend">
                <div className="legend-item">
                  <div className="legend-color available"></div>
                  <span>{t('availability.available', 'Available ({{count}})', { count: dbSlots.filter(s => !s.isBooked).length })}</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color booked"></div>
                  <span>{t('availability.booked', 'Booked ({{count}})', { count: dbSlots.filter(s => s.isBooked).length })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-slots-placeholder">
              <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <div>{t('availability.no_slots_configured', 'No availability configured for {{date}}.', { date: new Date(viewDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) })}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTab;
