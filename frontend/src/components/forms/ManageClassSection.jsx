import { useState } from "react";
import ClassForm from "./ClassForm";
import SectionForm from "./SectionForm";
import ClassSectionForm from "./ClassSectionForm";

const ManageClassSection = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Manage Class & Section</h2>
      
      {/* Step Indicator */}
      <div className="flex mb-4">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 text-center py-1 border-b-2 ${step===s ? 'border-blue-600 font-bold' : 'border-gray-200'}`}>
            Step {s}
          </div>
        ))}
      </div>

      {/* Step Forms */}
      <div className="mt-4">
        {step === 1 && <ClassForm onSuccess={handleNext} />}
        {step === 2 && <SectionForm onSuccess={handleNext} />}
        {step === 3 && <ClassSectionForm onSuccess={handleSuccess} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        {step > 1 && <button onClick={handlePrev} className="px-3 py-1 bg-gray-300 rounded">Back</button>}
        <button onClick={onClose} className="px-3 py-1 bg-red-500 text-white rounded">Close</button>
      </div>
    </div>
  );
};

export default ManageClassSection;
