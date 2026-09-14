import AuthLayout from '../../../components/features/auth/AuthLayout';
import ResetPasswordForm from '../../../components/features/auth/ResetPasswordForm';
import { Link } from 'react-router-dom';
import '../../../assets/styles/index.css';

const ResetPassword = () => {
  return (
    <AuthLayout
      eyebrow="Nouveau mot de passe"
      title="Choisis un nouveau mot de passe"
      subtitle="Un mot de passe sécurisé pour continuer ton aventure EduGame."
      footer={
        <>
          Tu te souviens de ton mot de passe ?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 no-underline">
            Se connecter
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPassword;
