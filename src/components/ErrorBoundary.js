import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-8 flex items-center justify-center">
          <Card className="border-2 border-rose-200 shadow-xl max-w-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-rose-600 to-red-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-slate-700 mb-4">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
