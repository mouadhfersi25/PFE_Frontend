import AuthLayout from '../../../components/features/auth/AuthLayout';
import ForgotPasswordForm from '../../../components/features/auth/ForgotPasswordForm';
import { Link } from 'react-router-dom';
import '../../../assets/styles/index.css';

const ForgotPassword = () => {
  return (
    <AuthLayout
      eyebrow="Mot de passe oublié"
      title="Mot de passe oublié ?"
      subtitle="Pas de souci — indique ton e-mail et on t'envoie un lien pour en choisir un nouveau."
      footer={
        <>
          Tu te souviens de ton mot de passe ?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 no-underline">
            Se connecter
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPassword;
