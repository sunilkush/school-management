import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addSchool, resetSchoolState } from "../../features/schools/schoolSlice";

const AddSchoolForm = () => {
  const dispatch = useDispatch();
  const { loading, error, message, success } = useSelector((state) => state.school);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    website: '',
    isActive: false,
    logo: null,
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState('');

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (file) {
        // Check file size (max 50KB)
        if (file.size > 50 * 1024) {
          setLogoError('Logo size must be less than or equal to 50KB');
          setFormData((prev) => ({ ...prev, logo: null }));
          setLogoPreview(null);
          return;
        } else {
          setLogoError('');
          setLogoPreview(URL.createObjectURL(file));
        }
      }

      setFormData((prev) => ({
        ...prev,
        logo: file || null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (logoError) return; // Prevent submit if logo is invalid
    dispatch(addSchool(formData));
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(resetSchoolState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Add School</h2>

      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{message || 'School added successfully!'}</div>}

      <div>
        <label className="block font-medium mb-1 text-xs">School Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block font-medium mb-1 text-xs">Contact Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block font-medium mb-1 text-xs">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block font-medium mb-1 text-xs">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block font-medium mb-1 text-xs">Website</label>
        <input
          type="url"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="mr-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <label className="font-medium">Is Active</label>
      </div>

      <div>
        <label className="block font-medium mb-1">Logo <span className='text-xs text-deep-orange-400'>( Max 50 KB )</span></label>
        <input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-purple-700
            hover:file:bg-blue-100 border rounded-full"
        />
        {logoError && <div className="text-red-500 text-sm mt-1">{logoError}</div>}
        {logoPreview && (
          <img
            src={logoPreview}
            alt="Logo Preview"
            width={50}
            height={50}
            className="mt-2 rounded border"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !!logoError}
        className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Add School'}
      </button>
    </form>
  );
};

export default AddSchoolForm;
