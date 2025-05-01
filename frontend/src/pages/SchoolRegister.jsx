import React from "react";

// @components
import {
  Card,
  Input,
  Button,
  CardBody,
  CardHeader,
  Typography,
} from "@material-tailwind/react";
// @icons


import {  } from "../store/authSlice";
const SchoolRegister = () =>{
 
    
    return (
        <section className="px-8 bg-blue-gray-800">
          <div className="container mx-auto h-screen grid place-items-center ">
            <Card shadow={false} className="md:px-24 md:py-14 py-8 border border-gray-300">
              <CardHeader shadow={false} floated={false} className="text-center">
                <Typography variant="h1" color="blue-gray" className="mb-4 !text-3xl lg:text-4xl">
                  Register School
                </Typography>
                <Typography className="!text-gray-600 text-[18px] font-normal md:max-w-sm">
                  Enjoy quick and secure access to your accounts on various Register School platforms.
                </Typography>
              </CardHeader>
              <CardBody>
              <form  className="flex flex-col gap-4 md:mt-12">
                <div>
                  <label htmlFor="email">
                    <Typography variant="small" color="blue-gray" className="block font-medium mb-2">
                      Your Email
                    </Typography>
                  </label>
                  <Input
                    id="email"
                    color="gray"
                    size="lg"
                    type="email"
                    name="email"
                    
                    placeholder="name@mail.com"
                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password">
                    <Typography variant="small" color="blue-gray" className="block font-medium mb-2">
                      Your Password
                    </Typography>
                  </label>
                  <Input
                    id="password"
                    color="gray"
                    size="lg"
                    type="password"
                    name="password"
                   
                    placeholder="*********"
                    className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
                    required
                  />
                </div>
               
                <Button type="submit" size="lg" color="gray" fullWidth >
                  
                </Button>
               
                
              </form>
              </CardBody>
            </Card>
          </div>
        </section>
      );
}


export default SchoolRegister;