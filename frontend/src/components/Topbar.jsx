
import { IconMaximize } from '@tabler/icons-react';
import { IconBell } from '@tabler/icons-react';
const Topbar = () => {
  return (
   <div className="w-full px-5 py-3  bg-gray-900">
    <div className="flex justify-between">
      <div  className="">
        <label className="text-white">Search</label><input className="px-2 py-1.5 border-gray-500 ml-4 rounded-sm" text="text"/>
      </div>
      <div  className="flex justify-center items-center">
            <div><button className="bg-gray-300 py-1 px-1 rounded-md mr-3"><IconBell stroke={1.5} /></button></div>
            <div><button className="bg-gray-300 py-1 px-1 rounded-md mr-3"><IconMaximize stroke={1.25} /></button></div>
            <div><img className="w-9 h-9 rounded-full" src={'https://res.cloudinary.com/dspa4q1mo/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1726764972/samples/man-portrait.jpg'} alt="user image"/></div>
      </div>
      
      </div>
   </div>
  );
};

export default Topbar;
