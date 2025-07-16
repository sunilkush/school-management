
import AddSchoolForm from '../components/forms/AddSchoolForm'

const AddSchool = () => {
  
  
  return (
    <div>
      <div className='w-full flex gap-4'>
        <div className='w-full md:w-1/4 bg-white p-4 space-y-4  border rounded-md shadow-md'>
          <AddSchoolForm />
        </div>
        <div className='w-full md:w-3/4 bg-white p-4 space-y-4  border rounded-md shadow-md'>
          <h1 className='text-2xl font-bold'>Add School</h1>
          <p className='text-gray-600'>Fill in the details below to add a new school.</p></div>
      </div>
    </div>
  )
}

export default AddSchool
