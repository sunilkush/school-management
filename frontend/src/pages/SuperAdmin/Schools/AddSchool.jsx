
import AddSchoolForm from '../../../components/forms/AddSchoolForm'

const AddSchool = () => {
  return (
    <div>
      <div className='w-full flex gap-4'>
        <div className='w-full md:w-1/3 mx-auto bg-white p-4 space-y-4  border rounded-md shadow-md'>
          <AddSchoolForm />
        </div>
       </div>
    </div>
  )
}
export default AddSchool
