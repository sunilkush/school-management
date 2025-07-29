
import RegisterForm from '../components/forms/RegisterFrom';


const UserRegister = () => {
  
  return (
    <div>
      <div className="w-full flex gap-4">
        <div className="w-full md:w-1/3 bg-white p-5 mx-auto">
          <RegisterForm />
        </div>
        
      </div>
    </div>
  );
};

export default UserRegister;
