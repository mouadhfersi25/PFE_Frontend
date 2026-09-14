import AuthLayout from '../../../components/features/auth/AuthLayout';
import LoginForm from '../../../components/features/auth/LoginForm';
import { Link } from 'react-router-dom';
import '../../../assets/styles/index.css';

const Login = () => {
  return (
    <AuthLayout
      mode="login"
      title="Bienvenue"
      subtitle="Connexion pour parents, joueurs, éducateurs, sponsors et administrateurs."
      footer={
        <>
          Pas encore de compte parent ?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700 no-underline">
            S&apos;inscrire
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
