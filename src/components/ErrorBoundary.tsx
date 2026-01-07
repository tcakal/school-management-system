import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    lossyError: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        lossyError: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, lossyError: error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-red-50 border border-red-200 shadow-xl rounded-lg flex items-start gap-3 w-80 animate-in slide-in-from-bottom-5">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <h3 className="font-bold text-red-900 text-sm">Bir hata oluştu</h3>
                        <p className="text-red-700 text-xs mt-1">
                            {this.state.lossyError?.message || 'Beklenmedik bir sorun yaşandı.'}
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, lossyError: null })}
                            className="mt-2 flex items-center gap-1.5 text-red-800 text-xs font-medium hover:bg-red-100 px-2 py-1.5 rounded transition-colors"
                        >
                            <RefreshCw size={14} />
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
