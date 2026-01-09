import React from 'react';

interface TimeSelectProps {
    value?: string;
    onChange: (newValue: string) => void;
    className?: string;
    disabled?: boolean;
}

export function TimeSelect({ value = '09:00', onChange, className = '', disabled = false }: TimeSelectProps) {
    // Ensure value is valid format HH:MM, fallback to 09:00
    const safeValue = (value && value.includes(':')) ? value : '09:00';
    const [hour, minute] = safeValue.split(':');

    // 00-23
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    // 00, 05, 10 ... 55
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    const handleHourChange = (newHour: string) => {
        onChange(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (newMinute: string) => {
        onChange(`${hour}:${newMinute}`);
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <select
                value={hour}
                disabled={disabled}
                onChange={(e) => handleHourChange(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 appearance-none min-w-[50px] text-center"
                style={{ WebkitAppearance: 'menulist' }} // Force arrow visible
            >
                {hours.map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="text-slate-400 font-bold select-none">:</span>
            <select
                value={minute}
                disabled={disabled}
                onChange={(e) => handleMinuteChange(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded px-1 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 appearance-none min-w-[50px] text-center"
                style={{ WebkitAppearance: 'menulist' }}
            >
                {minutes.map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>
        </div>
    );
}
