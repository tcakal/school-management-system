import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelExportBtnProps {
    data: any[];
    fileName?: string;
    sheetName?: string;
    label?: string;
    className?: string;
}

export function ExcelExportBtn({
    data,
    fileName = 'export',
    sheetName = 'Sheet1',
    label = 'Excel\'e Aktar',
    className = ''
}: ExcelExportBtnProps) {

    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('Dışa aktarılacak veri bulunamadı.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors ${className}`}
        >
            <Download size={18} />
            {label}
        </button>
    );
}
