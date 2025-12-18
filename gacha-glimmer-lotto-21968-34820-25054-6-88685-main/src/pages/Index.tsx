import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Supabase env vars are available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    
    // Only redirect after 2 seconds to allow user to see the page
    const timer = setTimeout(() => {
      navigate('/historico-compras');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
          Gacha World
        </h1>
        <p className="text-purple-200 text-xl mb-8">
          Bem-vindo à plataforma de boxes e roletas gacha!
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/historico-compras')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            Ver Histórico de Compras
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors"
          >
            Login
          </button>
        </div>
        <p className="text-purple-300 text-sm mt-8">
          Carregando...
        </p>
      </div>
    </div>
  );
}
