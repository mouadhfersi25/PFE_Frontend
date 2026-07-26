// Input Component
export default function Input({ label, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} className="input" />
    </div>
  );
}
