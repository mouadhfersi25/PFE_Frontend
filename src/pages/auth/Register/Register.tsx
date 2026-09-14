import AuthLayout from '../../../components/features/auth/AuthLayout';
import RegisterForm from '../../../components/features/auth/RegisterForm';
import { Link } from 'react-router-dom';
import '../../../assets/styles/index.css';

const Register = () => {
  return (
    <AuthLayout
      mode="register"
      title="Inscription parent"
      subtitle="Créez votre compte parent, puis ajoutez vos joueurs depuis le tableau de bord."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 no-underline">
            Se connecter
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
