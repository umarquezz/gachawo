import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to purchase history for now
    navigate('/historico-compras');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Gacha World</h1>
        <p className="text-purple-200">Carregando...</p>
      </div>
    </div>
  );
}
