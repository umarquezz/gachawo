import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-4 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl text-purple-200 mb-8">Página não encontrada</p>
        <Button onClick={() => navigate('/')} variant="secondary">
          Voltar para Home
        </Button>
      </div>
    </div>
  );
}
