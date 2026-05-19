import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-gray-950">
          <Card className="flex max-w-md flex-col items-center gap-6 p-8 shadow-xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={40} className="text-red-600 dark:text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                Ops! Algo deu errado.
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ocorreu um erro inesperado que impediu a exibição desta página.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full rounded-lg bg-gray-100 p-3 text-left dark:bg-gray-800">
                <p className="font-mono text-[10px] text-gray-600 dark:text-gray-400 break-all line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex w-full flex-col gap-3">
              <Button onClick={this.handleReload} className="gap-2 font-bold">
                <RefreshCw size={18} />
                Tentar Novamente
              </Button>
              <Button onClick={this.handleReset} variant="ghost" className="gap-2 font-bold">
                <Home size={18} />
                Voltar ao Início
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
