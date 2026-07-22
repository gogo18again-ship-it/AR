import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';

import Dashboard from '@/pages/dashboard';
import Employees from '@/pages/employees/index';
import EmployeeNew from '@/pages/employees/new';
import EmployeeDetail from '@/pages/employees/[id]';
import EmployeeEdit from '@/pages/employees/edit';
import Schedules from '@/pages/schedules';
import Documents from '@/pages/documents';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/employees" component={Employees} />
        <Route path="/employees/new" component={EmployeeNew} />
        <Route path="/employees/:id/edit" component={EmployeeEdit} />
        <Route path="/employees/:id" component={EmployeeDetail} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/documents" component={Documents} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
