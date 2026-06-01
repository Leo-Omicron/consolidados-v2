import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <MainLayout />
    </ErrorBoundary>
  );
}

export default App;
